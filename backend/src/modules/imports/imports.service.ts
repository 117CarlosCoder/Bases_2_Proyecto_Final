import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Collection, Db, MongoBulkWriteError } from 'mongodb';
import type { Filter } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { MONGODB_DB, NEO4J_DRIVER } from '../database/database.constants';
import { Neo4jSchemaService } from '../database/neo4j-schema.service';
import type { EvaluacionDocument } from './entities/evaluacion.entity';
import type { ImportRecord } from './entities/import.entity';
import type { ImportFlagRecord } from './entities/import-flag.entity';
import { ErrorCsv } from './utils/errorCsv';
import type { ResultadoCsv } from './utils/importacion.types';
import { procesarCsv } from './utils/procesarCsv.util';
import { proyectarEvaluacionesNeo4j } from './utils/proyectarNeo4j.util';

const TAMANO_LOTE = 500;

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private readonly evaluaciones: Collection<EvaluacionDocument>;
  private readonly importaciones: Collection<ImportRecord>;
  private readonly incidencias: Collection<ImportFlagRecord>;

  constructor(
    @Inject(MONGODB_DB) mongoDb: Db,
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
    private readonly neo4jSchemaService: Neo4jSchemaService,
    private readonly configService: ConfigService,
  ) {
    this.evaluaciones = mongoDb.collection('evaluaciones');
    this.importaciones = mongoDb.collection('importaciones');
    this.incidencias = mongoDb.collection('errores_importacion');
  }

  async cargarCsv(csvContent: string, fileName: string): Promise<ImportRecord> {
    if (!csvContent?.trim()) {
      throw new BadRequestException('El contenido CSV está vacío');
    }

    const archivo = fileName.replace(/\\/g, '/').split('/').pop()?.trim();
    if (!archivo || !/\.csv$/i.test(archivo)) {
      throw new BadRequestException('El archivo debe tener extensión .csv');
    }

    const limiteMb = Number(this.configService.getOrThrow<number>('MAX_CSV_FILE_SIZE_MB'));
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
      const resultado = await procesarCsv(csvContent, { importacionId: registro.id, archivo });
      await this.guardarLotesMongo(resultado, registro);

      if (registro.contadores.validos > 0) {
        registro.neo4j_sync = await this.proyectarEnNeo4j(resultado.evaluaciones);
        registro.estado = registro.neo4j_sync.status === 'SINCRONIZADO' ? 'COMPLETADO' : 'NEO4J_PENDIENTE';
      } else {
        registro.estado = 'FALLO';
      }

      await this.finalizarImportacion(registro, inicio);
      return registro;
    } catch (error: unknown) {
      registro.estado = 'FALLO';
      await this.finalizarImportacion(registro, inicio).catch(() => {
        this.logger.error(`No se pudo registrar el fallo de la importación ${registro.id}`);
      });

      if (error instanceof ErrorCsv) {
        throw new BadRequestException({
          message: error.message,
          details: { codigo: error.codigo, importacionId: registro.id },
        });
      }

      throw new InternalServerErrorException({
        message: 'La importación falló y puede haber datos guardados parcialmente. Puedes reintentar la carga.',
        details: { importacionId: registro.id },
      });
    }
  }

  async sincronizarNeo4j(id: string): Promise<ImportRecord | { syncedAt: string; nodesProcessed: number }> {
    if (id === 'all') {
      const evaluaciones = await this.evaluaciones.find({}, { projection: { _id: 0 } }).toArray();
      const neo4jSync = await this.proyectarEnNeo4j(evaluaciones);

      if (neo4jSync.status === 'FALLO') {
        throw new BadRequestException(`No se pudo sincronizar con Neo4j: ${neo4jSync.error}`);
      }

      await this.importaciones.updateMany(
        { 'contadores.validos': { $gt: 0 } },
        { $set: { estado: 'COMPLETADO', neo4j_sync: neo4jSync } },
      );

      return { syncedAt: neo4jSync.syncedAt!, nodesProcessed: neo4jSync.nodesProcessed };
    }

    const registro = await this.obtenerImportacion(id);
    if (registro.contadores.validos === 0) {
      throw new BadRequestException('La importación no tiene filas válidas para sincronizar con Neo4j');
    }

    let evaluaciones = await this.evaluaciones.find({ importacion_id: id }, { projection: { _id: 0 } }).toArray();
    if (evaluaciones.length < registro.contadores.validos) {
      evaluaciones = await this.evaluaciones.find({}, { projection: { _id: 0 } }).toArray();
    }

    registro.neo4j_sync = await this.proyectarEnNeo4j(evaluaciones);
    registro.estado = registro.neo4j_sync.status === 'SINCRONIZADO' ? 'COMPLETADO' : 'NEO4J_PENDIENTE';

    await this.importaciones.updateOne(
      { id: registro.id },
      { $set: { estado: registro.estado, neo4j_sync: registro.neo4j_sync } },
    );

    if (registro.neo4j_sync.status === 'FALLO') {
      throw new BadRequestException(`No se pudo sincronizar con Neo4j: ${registro.neo4j_sync.error}`);
    }

    return registro;
  }

  async listarImportaciones(pagina = 1, limite = 20) {
    const total = await this.importaciones.countDocuments({});
    const meta = this.metadatosPagina(total, pagina, limite);
    const items = await this.importaciones
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .skip((meta.pagina - 1) * limite)
      .limit(limite)
      .toArray();

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
    await this.obtenerImportacion(importacionId);
    const filtro: Filter<ImportFlagRecord> = { importacion_id: importacionId };
    if (tipo !== undefined) filtro.tipo = tipo;

    const total = await this.incidencias.countDocuments(filtro);
    const meta = this.metadatosPagina(total, pagina, limite);
    const items = await this.incidencias
      .find(filtro, { projection: { _id: 0 } })
      .sort({ fila: 1 })
      .skip((meta.pagina - 1) * limite)
      .limit(limite)
      .toArray();

    return { importacionId, items, ...meta };
  }

  private async guardarLotesMongo(resultado: ResultadoCsv, registro: ImportRecord): Promise<void> {
    registro.contadores.leidos = resultado.contadores.leidos;
    registro.contadores.validos = resultado.contadores.validos;
    registro.contadores.rechazados = resultado.contadores.rechazados;
    registro.contadores.advertencias = resultado.contadores.advertencias;

    for (let i = 0; i < resultado.incidencias.length; i += TAMANO_LOTE) {
      await this.incidencias.insertMany(resultado.incidencias.slice(i, i + TAMANO_LOTE), { ordered: true });
    }

    for (let i = 0; i < resultado.evaluaciones.length; i += TAMANO_LOTE) {
      const lote = resultado.evaluaciones.slice(i, i + TAMANO_LOTE);
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
  }

  private async proyectarEnNeo4j(evaluaciones: EvaluacionDocument[]): Promise<ImportRecord['neo4j_sync']> {
    try {
      await this.neo4jSchemaService.restriccionNeo4j();
      const nodesProcessed = await proyectarEvaluacionesNeo4j(this.neo4jDriver, evaluaciones);
      return {
        status: 'SINCRONIZADO',
        syncedAt: new Date().toISOString(),
        error: null,
        nodesProcessed,
      };
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Sincronización Neo4j fallida: ${mensaje}`);
      return {
        status: 'FALLO',
        syncedAt: null,
        error: mensaje,
        nodesProcessed: 0,
      };
    }
  }

  private async finalizarImportacion(registro: ImportRecord, inicio: number): Promise<void> {
    registro.duracion_ms = Math.max(0, Date.now() - inicio);
    registro.finished_at = new Date().toISOString();
    await this.importaciones.updateOne({ id: registro.id }, { $set: registro });
  }

  private metadatosPagina(total: number, solicitada: number, limite: number) {
    const paginas = Math.max(1, Math.ceil(total / limite));
    const pagina = Math.min(solicitada, paginas);
    return {
      total,
      pagina,
      limite,
      paginas,
      paginaAnterior: pagina > 1 ? pagina - 1 : null,
      paginaSiguiente: pagina < paginas ? pagina + 1 : null,
    };
  }
}
