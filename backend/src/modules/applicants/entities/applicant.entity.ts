import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';

export interface ResumenAspiranteItem {
  correlativo: string;
  carnet: string | null;
  anio_evaluacion: number;
  sexo: string;
  edad: number | null;
  grado_academico: string;
  carrera_objetivo: string;
  establecimiento: string;
  departamento_establecimiento: string;
  municipio_establecimiento: string;
  tipo_establecimiento: string;
  evaluaciones: number;
  aprobadas: number;
  porcentaje_aprobacion: number;
}

export interface DetalleAspirante {
  perfil: ResumenAspiranteItem;
  historial: EvaluacionDocument[];
}

export interface FiltrosDisponiblesAspirantes {
  anios: number[];
  carreras: string[];
  materias: string[];
  tipos: string[];
  departamentos: string[];
}
