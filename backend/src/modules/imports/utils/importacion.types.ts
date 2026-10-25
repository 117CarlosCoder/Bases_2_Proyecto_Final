import type { EvaluacionDocument } from '../entities/evaluacion.entity';
import type { ImportFlagRecord } from '../entities/import-flag.entity';

export interface ContextoImportacion {
  importacionId: string;
  archivo: string;
}

export interface ContextoFila extends ContextoImportacion {
  fila: number;
  fechaProcesamiento: string;
}

export interface ResultadoFila {
  evaluacion: EvaluacionDocument | null;
  incidencia: ImportFlagRecord | null;
}

export interface ResultadoCsv {
  evaluaciones: EvaluacionDocument[];
  incidencias: ImportFlagRecord[];
  contadores: {
    leidos: number;
    validos: number;
    rechazados: number;
    advertencias: number;
  };
}
