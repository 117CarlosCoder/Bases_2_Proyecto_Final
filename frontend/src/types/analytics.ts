export interface ResumenMensualDashboard {
  total: number
  approved: number
}

export interface PuntoSerieDashboard {
  date?: string
  label: string
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
  points?: PuntoSerieDashboard[]
  approvalPercentage: number
  periodLabel: string
}

export interface ResumenPeriodoDashboard {
  year: string
  total: number
  approved: number
  applicants: number
  careers: number
  approvalPercentage: number
  periodLabel: string
  points: PuntoSerieDashboard[]
}

export type DashboardPeriod = 'year' | 'month' | 'week' | 'day'

export interface SeleccionPeriodo {
  anio?: number
  periodo?: DashboardPeriod
  mes?: number
  fecha?: string
}

export interface RangoSemanaCalendario {
  desde: string
  hasta: string
  label: string
}

export interface CalendarioDashboard {
  min: string
  max: string
  initialDate: string
  weeks: RangoSemanaCalendario[]
}

export interface ResumenDashboardResponse {
  years: string[]
  selectedYear: string
  summary: ResumenAnualDashboard
  calendar: CalendarioDashboard | null
}

export type ConsultaDashboard =
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'p6'
  | 'p7'
  | 'p8'
  | 'p9'
  | 'p10'
  | 'p11'
  | 'p12'
  | 'p13'
  | 'p14'
  | 'p15'
  | 'p16'
  | 'p17'
  | 'p18'
  | 'p19'
  | 'p20'

export interface ParametrosTabla {
  buscar: string
  pagina: number
  limite: number
  ordenarPor?: string
  direccion?: 'asc' | 'desc'
}

export interface PaginaConsulta<T = Record<string, unknown>> {
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
  mongoQuery?: string
}

export type FilaConsulta = Record<string, unknown>
export type ResultadoConsulta = PaginaConsulta<FilaConsulta>

export interface QueryColumn {
  key: string
  label: string
  format?: 'number' | 'percent' | 'age' | 'year'
}

export interface DashboardQuery {
  key: ConsultaDashboard
  title: string
  description: string
  columns: QueryColumn[]
}
