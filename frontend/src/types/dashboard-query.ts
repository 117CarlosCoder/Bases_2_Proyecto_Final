import type { ConsultaDashboard } from './analytics'

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
