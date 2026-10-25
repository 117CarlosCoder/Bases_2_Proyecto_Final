import { parse } from 'csv-parse';
import type { ContextoFila, ContextoImportacion, ResultadoCsv } from './importacion.types';
import { crearIncidencia } from './crearIncidencia.util';
import { ErrorCsv } from './errorCsv';
import { procesarFila } from './procesarFila.util';
import { validarEncabezados } from './validarEncabezados.util';

export async function procesarCsv(
  contenido: string,
  contexto: ContextoImportacion,
): Promise<ResultadoCsv> {
  if (!contexto.importacionId.trim() || !contexto.archivo.trim()) {
    throw new ErrorCsv('ERR_INVALID_CONTEXT', 'Faltan el identificador o el nombre del archivo.');
  }

  const resultado: ResultadoCsv = {
    evaluaciones: [],
    incidencias: [],
    contadores: { leidos: 0, validos: 0, rechazados: 0, advertencias: 0 },
  };
  const fechaProcesamiento = new Date().toISOString();
  let encabezados: string[] | null = null;
  let originales: string[] = [];
  const parser = parse(contenido, {
    bom: true,
    delimiter: ',',
    skip_empty_lines: true,
    relax_column_count: true,
    info: true,
    max_record_size: 1024 * 1024,
  });

  try {
    for await (const entrada of parser) {
      const valores = entrada.record as string[];
      if (encabezados === null) {
        originales = valores;
        encabezados = validarEncabezados(valores);
        continue;
      }

      resultado.contadores.leidos += 1;
      const contextoFila: ContextoFila = {
        ...contexto,
        fila: entrada.info.lines,
        fechaProcesamiento,
      };

      if (valores.length !== encabezados.length) {
        resultado.contadores.rechazados += 1;
        resultado.incidencias.push(crearIncidencia(
          contextoFila, 'ERROR', ['ERR_COLUMN_COUNT'],
          `Se esperaban ${encabezados.length} columnas y se recibieron ${valores.length}.`,
          { columnas: valores },
        ));
        continue;
      }

      const datos: Record<string, string> = {};
      const datosCrudos: Record<string, string> = {};
      encabezados.forEach((nombre, i) => {
        datos[nombre] = valores[i];
        datosCrudos[originales[i]] = valores[i];
      });

      const fila = procesarFila(datos, contextoFila, datosCrudos);
      if (fila.incidencia) resultado.incidencias.push(fila.incidencia);
      if (fila.evaluacion) {
        resultado.evaluaciones.push(fila.evaluacion);
        resultado.contadores.validos += 1;
        if (fila.incidencia?.tipo === 'ADVERTENCIA') {
          resultado.contadores.advertencias += 1;
        }
      } else {
        resultado.contadores.rechazados += 1;
      }
    }
  } catch (error) {
    if (error instanceof ErrorCsv) throw error;
    throw new ErrorCsv(
      'ERR_CSV_FORMAT',
      'El archivo tiene una estructura CSV inválida o supera el límite de 1 MiB por registro.',
    );
  } finally {
    parser.destroy();
  }

  if (encabezados === null || resultado.contadores.leidos === 0) {
    throw new ErrorCsv('ERR_EMPTY_FILE', 'El CSV debe incluir encabezados y al menos una fila de datos.');
  }

  return resultado;
}
