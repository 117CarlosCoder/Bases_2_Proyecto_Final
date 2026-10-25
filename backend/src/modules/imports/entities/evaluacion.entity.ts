export interface EvaluacionDocument {
  evaluacion_uid: string;
  correlativo: string;
  carnet: string | null;

  fecha_asignacion: string;
  anio_asignacion: number;
  mes_asignacion: number;
  fecha_evaluacion: string | null;

  sexo: 'F' | 'M' | 'NO_ESPECIFICADO';
  edad: number | null;
  anio_nacimiento: number | null;

  grado_academico: string;
  carrera_objetivo: string;
  establecimiento: string;

  departamento_establecimiento: string;
  municipio_establecimiento: string;
  municipio_uid: string;

  tipo_establecimiento:
    | 'PUBLICO'
    | 'PRIVADO'
    | 'POR COOPERATIVA'
    | 'MUNICIPAL'
    | 'SIN_TIPO_ESTABLECIMIENTO';

  materia_evaluada: string;
  numero_evaluacion: number;
  anio_evaluacion: number;

  resultado_evaluacion: 'APROBADO' | 'NO APROBADO';
  aprobado: boolean;

  advertencias: string[];
  importacion_id: string;
  fila_origen: number;
  updated_at: string;
}