import type { ImportFlagRecord } from '../entities/import-flag.entity';
import type { ContextoFila } from './importacion.types';

export function crearIncidencia(
  contexto: ContextoFila,
  tipo: ImportFlagRecord['tipo'],
  codigos: string[],
  mensaje: string,
  datosCrudos: Record<string, unknown> | string,
): ImportFlagRecord {
  return {
    importacion_id: contexto.importacionId,
    archivo: contexto.archivo,
    fila: contexto.fila,
    tipo,
    codigos: [...new Set(codigos)],
    mensaje,
    datos_crudos: datosCrudos,
    created_at: contexto.fechaProcesamiento,
  };
}
