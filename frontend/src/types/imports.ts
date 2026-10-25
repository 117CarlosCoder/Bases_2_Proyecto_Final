export interface ImportRecord {
  id: string
  archivo: string
  estado: 'PROCESANDO' | 'COMPLETADO' | 'NEO4J_PENDIENTE' | 'FALLO'
  neo4j_sync: {
    status: 'SINCRONIZADO' | 'PENDIENTE' | 'FALLO'
    syncedAt: string | null
    error: string | null
    nodesProcessed: number
  }
  contadores: {
    leidos: number
    validos: number
    nuevos: number
    duplicados: number
    advertencias: number
    rechazados: number
  }
  duracion_ms: number
  created_at: string
  finished_at: string | null
}

export type TipoIncidencia = 'ERROR' | 'ADVERTENCIA'

export interface ImportIssue {
  importacion_id: string
  archivo: string
  fila: number
  tipo: TipoIncidencia
  codigos: string[]
  mensaje: string
  datos_crudos: Record<string, unknown> | string
  created_at: string
}

export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  limite: number
  paginas: number
  paginaAnterior: number | null
  paginaSiguiente: number | null
}
