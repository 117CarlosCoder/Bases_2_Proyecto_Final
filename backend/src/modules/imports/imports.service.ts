import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Collection, Db, MongoBulkWriteError } from 'mongodb';
import type { Filter } from 'mongodb';
import { MONGODB_DB } from '../database/database.constants';
import type { EvaluacionDocument } from './entities/evaluacion.entity';
import type { ImportRecord } from './entities/import.entity';
import type { ImportFlagRecord } from './entities/import-flag.entity';
import { ErrorCsv } from './utils/errorCsv';
import { procesarCsv } from './utils/procesarCsv.util';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private readonly evaluaciones: Collection<EvaluacionDocument>;
  private readonly importaciones: Collection<ImportRecord>;
  private readonly incidencias: Collection<ImportFlagRecord>;

  constructor(
    @Inject(MONGODB_DB) mongoDb: Db,
    private readonly configService: ConfigService,
  ) {
    this.evaluaciones = mongoDb.collection('evaluaciones');
    this.importaciones = mongoDb.collection('importaciones');
    this.incidencias = mongoDb.collection('errores_importacion');
  }

  async cargarCsv(csvContent: string, fileName: string): Promise<ImportRecord> {
    if (typeof csvContent !== 'string' || !csvContent.trim()) {
      throw new BadRequestException('El contenido CSV está vacío');
    }
    if (typeof fileName !== 'string') {
      throw new BadRequestException('Debes indicar el nombre del archivo');
    }

    const archivo = fileName.replace(/\\/g, '/').split('/').pop()?.trim();
    if (!archivo || !/\.csv$/i.test(archivo)) {
      throw new BadRequestException('El archivo debe tener extensión .csv');
    }

    const limiteMb = Number(
      this.configService.getOrThrow<number>('MAX_CSV_FILE_SIZE_MB'),
    );
    if (Buffer.byteLength(csvContent, 'utf8') > limiteMb * 1024 * 1024) {
      throw new BadRequestException(`El archivo supera el límite de ${limiteMb} MB`);
    }

    const inicio = Date.now();
    const registro: ImportRecord = {
      id: randomUUID(),
      archivo,
      estado: 'PROCESANDO',
      neo4j_sync: {
        status: 'PENDIENTE',
        syncedAt: null,
        error: null,
        nodesProcessed: 0,
      },
      contadores: {
        leidos: 0,
        validos: 0,
        nuevos: 0,
        duplicados: 0,
        advertencias: 0,
        rechazados: 0,
      },
      duracion_ms: 0,
      created_at: new Date().toISOString(),
      finished_at: null,
    };

    await this.importaciones.insertOne({ ...registro });

    try {
      const resultado = await procesarCsv(csvContent, {
        importacionId: registro.id,
        archivo,
      });

      registro.contadores.leidos = resultado.contadores.leidos;
      registro.contadores.validos = resultado.contadores.validos;
      registro.contadores.rechazados = resultado.contadores.rechazados;
      registro.contadores.advertencias = resultado.contadores.advertencias;
      const tamanoLote = 500;

      for (let posicion = 0; posicion < resultado.incidencias.length; posicion += tamanoLote) {
        await this.incidencias.insertMany(
          resultado.incidencias.slice(posicion, posicion + tamanoLote),
          { ordered: true },
        );
      }

      for (let posicion = 0; posicion < resultado.evaluaciones.length; posicion += tamanoLote) {
        const lote = resultado.evaluaciones.slice(posicion, posicion + tamanoLote);
        try {
          const escritura = await this.evaluaciones.bulkWrite(
            lote.map(documento => ({
              updateOne: {
                filter: { evaluacion_uid: documento.evaluacion_uid },
                update: { $set: documento },
                upsert: true,
              },
            })),
            { ordered: true },
          );
          registro.contadores.nuevos += escritura.upsertedCount;
          registro.contadores.duplicados += escritura.matchedCount;
        } catch (error: unknown) {
          if (error instanceof MongoBulkWriteError) {
            registro.contadores.nuevos += error.result.upsertedCount;
            registro.contadores.duplicados += error.result.matchedCount;
          }
          throw error;
        }
      }

      const contadores = registro.contadores;
      if (contadores.leidos !== contadores.validos + contadores.rechazados) {
        throw new Error('Los contadores de lectura no coinciden');
      }
      if (contadores.validos !== contadores.nuevos + contadores.duplicados) {
        throw new Error('Los contadores de persistencia no coinciden');
      }

      registro.estado = contadores.validos > 0 ? 'NEO4J_PENDIENTE' : 'FALLO';
      registro.duracion_ms = Math.max(0, Date.now() - inicio);
      registro.finished_at = new Date().toISOString();
      await this.importaciones.updateOne({ id: registro.id }, { $set: registro });

      this.logger.log(
        `Importación ${registro.id}: ${contadores.nuevos} nuevas, ` +
        `${contadores.duplicados} duplicadas, ${contadores.rechazados} rechazadas`,
      );
      return registro;
    } catch (error: unknown) {
      registro.estado = 'FALLO';
      registro.duracion_ms = Math.max(0, Date.now() - inicio);
      registro.finished_at = new Date().toISOString();
      try {
        await this.importaciones.updateOne({ id: registro.id }, { $set: registro });
      } catch {
        this.logger.error(`No se pudo registrar el fallo de la importación ${registro.id}`);
      }

      if (error instanceof ErrorCsv) {
        throw new BadRequestException({
          message: error.message,
          details: {
            codigo: error.codigo,
            importacionId: registro.id,
          },
        });
      }

      this.logger.error(`Falló la persistencia de la importación ${registro.id}`);
      throw new InternalServerErrorException({
        message: 'La importación falló y puede haber datos guardados parcialmente. Puedes reintentar la carga.',
        details: { importacionId: registro.id },
      });
    }
  }

  async listarImportaciones(pagina = 1, limite = 20) {
    this.validarPaginacion(pagina, limite);
    const total = await this.importaciones.countDocuments({});
    const meta = this.metadatosPagina(total, pagina, limite);
    const items = await this.importaciones.find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 }).skip((meta.pagina - 1) * limite).limit(limite).toArray();
    return { items, ...meta };
  }

  async obtenerImportacion(id: string): Promise<ImportRecord> {
    const registro = await this.importaciones.findOne({ id }, { projection: { _id: 0 } });
    if (!registro) throw new NotFoundException('La importación no existe');
    return registro;
  }

  async obtenerIncidencias(
    importacionId: string,
    tipo?: ImportFlagRecord['tipo'],
    pagina = 1,
    limite = 20,
  ) {
    this.validarPaginacion(pagina, limite);
    if (tipo !== undefined && tipo !== 'ERROR' && tipo !== 'ADVERTENCIA') {
      throw new BadRequestException('El tipo debe ser ERROR o ADVERTENCIA');
    }
    await this.obtenerImportacion(importacionId);
    const filtro: Filter<ImportFlagRecord> = { importacion_id: importacionId };
    if (tipo !== undefined) filtro.tipo = tipo;
    const total = await this.incidencias.countDocuments(filtro);
    const meta = this.metadatosPagina(total, pagina, limite);
    const items = await this.incidencias.find(filtro, { projection: { _id: 0 } })
      .sort({ fila: 1 }).skip((meta.pagina - 1) * limite).limit(limite).toArray();
    return { importacionId, items, ...meta };
  }

  private metadatosPagina(total: number, solicitada: number, limite: number) {
    const paginas = Math.max(1, Math.ceil(total / limite));
    const pagina = Math.min(solicitada, paginas);
    return { total, pagina, limite, paginas,
      paginaAnterior: pagina > 1 ? pagina - 1 : null,
      paginaSiguiente: pagina < paginas ? pagina + 1 : null };
  }

  private validarPaginacion(pagina: number, limite: number): void {
    if (!Number.isSafeInteger(pagina) || !Number.isSafeInteger(limite) ||
      pagina < 1 || limite < 1 || limite > 100) {
      throw new BadRequestException(
        'La página debe ser un entero positivo y el límite debe estar entre 1 y 100',
      );
    }
  }
}
