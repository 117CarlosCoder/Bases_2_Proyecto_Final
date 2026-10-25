export interface ResumenMensualDashboard {
  total: number
  approved: number
}

export interface ResumenAnualDashboard {
  year: string
  total: number
  applicants: number
  approved: number
  careers: number
  months: ResumenMensualDashboard[]
  approvalPercentage: number
  periodLabel: string
}

export interface ResumenCarreraDocument {
  carrera_objetivo: string
  aspirantes_distintos: number
  evaluaciones: number
  evaluaciones_aprobadas: number
  porcentaje_aprobacion: number
  promedio_edad: number | null
  updated_at: string
}

export interface FilaP1TipoInstitucion {
  tipo_establecimiento: string
  aspirantes: number
}

export interface FilaP2AprobadosMateria {
  materia_evaluada: string
  aprobados: number
}

export interface FilaP3AprobadosCarreraAnio {
  carrera_objetivo: string
  anio_evaluacion: number
  aspirantes_aprobados: number
}

export interface FilaP4TasaAprobacion {
  materia_evaluada: string
  evaluaciones: number
  aprobadas: number
  porcentaje_aprobacion: number
}

export interface FilaP5EdadCarrera {
  carrera_objetivo: string
  aspirantes_con_edad: number
  promedio_edad: number
}

export interface ResultadosConsultas {
  p1: PaginaConsulta<FilaP1TipoInstitucion>
  p2: PaginaConsulta<FilaP2AprobadosMateria>
  p3: PaginaConsulta<FilaP3AprobadosCarreraAnio>
  p4: PaginaConsulta<FilaP4TasaAprobacion>
  p5: PaginaConsulta<FilaP5EdadCarrera>
  p6: PaginaConsulta<ResumenCarreraDocument>
}

export type ConsultaDashboard = keyof ResultadosConsultas
export type ResultadoConsulta = ResultadosConsultas[ConsultaDashboard]

export interface ParametrosTabla {
  buscar: string
  pagina: number
  limite: number
  ordenarPor?: string
  direccion?: 'asc' | 'desc'
}

export interface ResumenDashboardResponse {
  years: string[]
  selectedYear: string
  summary: ResumenAnualDashboard
}

export interface PaginaConsulta<T> {
  items: T[]
  total: number
  totalSinBusqueda: number
  pagina: number
  limite: number
  paginas: number
  desde: number
  hasta: number
  paginaAnterior: number | null
  paginaSiguiente: number | null
  ordenarPor: string
  direccion: 'asc' | 'desc'
  scopeLabel: string
}
