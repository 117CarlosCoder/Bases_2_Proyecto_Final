export interface ResumenMensualDashboard {
  total: number;
  approved: number;
}

export interface PuntoSerieDashboard {
  label: string;
  total: number;
  approved: number;
}

export interface ResumenAnualDashboard {
  year: string;
  total: number;
  applicants: number;
  approved: number;
  careers: number;
  months: ResumenMensualDashboard[];
  points?: PuntoSerieDashboard[];
  approvalPercentage: number;
  periodLabel: string;
}

export interface ResumenPeriodoDashboard {
  year: string;
  total: number;
  approved: number;
  applicants: number;
  careers: number;
  approvalPercentage: number;
  periodLabel: string;
  points: { date: string; label: string; total: number; approved: number }[];
}

export interface CalendarioDashboard {
  min: string;
  max: string;
  initialDate: string;
  weeks: { desde: string; hasta: string; label: string }[];
}

export interface ResumenCarreraDocument {
  carrera_objetivo: string;
  aspirantes_distintos: number;
  evaluaciones: number;
  evaluaciones_aprobadas: number;
  porcentaje_aprobacion: number;
  promedio_edad: number | null;
  updated_at: string;
}

export interface FilaP1TipoInstitucion {
  tipo_establecimiento: string;
  aspirantes: number;
}

export interface FilaP2AprobadosMateria {
  materia_evaluada: string;
  aprobados: number;
}

export interface FilaP3AprobadosCarreraAnio {
  carrera_objetivo: string;
  anio_evaluacion: number;
  aspirantes_aprobados: number;
}

export interface FilaP4TasaAprobacion {
  materia_evaluada: string;
  evaluaciones: number;
  aprobadas: number;
  porcentaje_aprobacion: number;
}

export interface FilaP5EdadCarrera {
  carrera_objetivo: string;
  aspirantes_con_edad: number;
  promedio_edad: number;
}

export interface FilaP7EdadAprobadosCarreraInstitucion {
  carrera_objetivo: string;
  tipo_establecimiento: string;
  aspirantes_aprobados: number;
  promedio_edad: number;
}

export interface FilaP8AprobadosMunicipioCarrera {
  departamento_establecimiento: string;
  municipio_establecimiento: string;
  carrera_objetivo: string;
  aspirantes_aprobados: number;
}

export interface FilaP9EvaluacionesMesPublico {
  anio_asignacion: number;
  mes_asignacion: number;
  materia_evaluada: string;
  evaluaciones: number;
}

export interface FilaP10TopCarrerasJovenes {
  carrera_objetivo: string;
  aspirantes: number;
}

export interface FilaP11DesempenoAspirante {
  correlativo: string;
  carnet: string | null;
  anio_evaluacion: number;
  materia_evaluada: string;
  numero_evaluacion: number;
  resultado_evaluacion: string;
  carrera_objetivo: string;
}

export interface FilaP12SexoTipoInstitucion {
  sexo: string;
  tipo_establecimiento: string;
  aspirantes: number;
}

export interface FilaP13AprobacionEdad {
  edad: number;
  evaluaciones: number;
  aprobadas: number;
  porcentaje_aprobacion: number;
}

export interface FilaP14PromedioIntentosMateria {
  materia_evaluada: string;
  aspirantes: number;
  promedio_intentos: number;
}

export interface FilaP15ResumenAspirante {
  correlativo: string;
  carnet: string | null;
  anio_evaluacion: number;
  sexo: string;
  edad: number | null;
  carrera_objetivo: string;
  establecimiento: string;
  evaluaciones: number;
  aprobadas: number;
}

export interface FilaP16ReprobadosPrimerIntento {
  carrera_objetivo: string;
  aspirantes_reprobados: number;
}

export interface FilaP17TopMunicipiosAspirantes {
  departamento_establecimiento: string;
  municipio_establecimiento: string;
  aspirantes: number;
}

export interface FilaP18AprobacionTipoInstitucion {
  tipo_establecimiento: string;
  evaluaciones: number;
  aprobadas: number;
  porcentaje_aprobacion: number;
}

export interface FilaP19CarrerasDepartamento {
  departamento_establecimiento: string;
  carrera_objetivo: string;
  aspirantes: number;
}

export interface FilaP20EvolucionAnual {
  anio_evaluacion: number;
  evaluaciones: number;
  aprobadas: number;
  no_aprobadas: number;
  porcentaje_aprobacion: number;
}

export interface PaginaConsulta<T> {
  items: T[];
  total: number;
  totalSinBusqueda: number;
  pagina: number;
  limite: number;
  paginas: number;
  desde: number;
  hasta: number;
  paginaAnterior: number | null;
  paginaSiguiente: number | null;
  ordenarPor: string;
  direccion: 'asc' | 'desc';
  scopeLabel: string;
}
