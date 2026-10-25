import type { PaginaConsulta } from './analytics'

export interface ResumenAspiranteItem {
  correlativo: string
  carnet: string | null
  anio_evaluacion: number
  sexo: string
  edad: number | null
  grado_academico: string
  carrera_objetivo: string
  establecimiento: string
  departamento_establecimiento: string
  municipio_establecimiento: string
  tipo_establecimiento: string
  evaluaciones: number
  aprobadas: number
  porcentaje_aprobacion: number
}

export interface EvaluacionHistorialItem {
  evaluacion_uid: string
  correlativo: string
  carnet: string | null
  carrera_objetivo: string
  materia_evaluada: string
  numero_evaluacion: number
  anio_evaluacion: number
  mes_asignacion: number
  aprobado: boolean
  establecimiento: string
  departamento_establecimiento: string
  municipio_establecimiento: string
  tipo_establecimiento: string
}

export interface DetalleAspirante {
  perfil: ResumenAspiranteItem
  historial: EvaluacionHistorialItem[]
}

export interface FiltrosDisponiblesAspirantes {
  anios: number[]
  carreras: string[]
  materias: string[]
  tipos: string[]
  departamentos: string[]
}

export interface FiltrosBusquedaAspirantes {
  buscar?: string
  anio?: number
  carrera?: string
  materia?: string
  tipo?: string
  departamento?: string
  pagina?: number
  limite?: number
}

export type RespuestaListaAspirantes = PaginaConsulta<ResumenAspiranteItem>
