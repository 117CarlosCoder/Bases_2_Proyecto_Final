import { request, buildQueryString } from './api'
import type {
  FilaP1TipoInstitucion,
  FilaP2AprobadosMateria,
  FilaP3AprobadosCarreraAnio,
  FilaP4TasaAprobacion,
  FilaP5EdadCarrera,
  ResumenCarreraDocument,
  ParametrosTabla,
  PaginaConsulta,
} from '@/types/analytics'

export function getP1(anio: number | undefined, table: ParametrosTabla): Promise<PaginaConsulta<FilaP1TipoInstitucion>> {
  return request(`/analytics/queries/p1${buildQueryString({ anio, ...table })}`, { method: 'GET' })
}

export function getP2(anio: number | undefined, table: ParametrosTabla): Promise<PaginaConsulta<FilaP2AprobadosMateria>> {
  return request(`/analytics/queries/p2${buildQueryString({ anio, ...table })}`, { method: 'GET' })
}

export function getP3(anio: number | undefined, table: ParametrosTabla): Promise<PaginaConsulta<FilaP3AprobadosCarreraAnio>> {
  return request(`/analytics/queries/p3${buildQueryString({ anio, ...table })}`, { method: 'GET' })
}

export function getP4(anio: number | undefined, table: ParametrosTabla): Promise<PaginaConsulta<FilaP4TasaAprobacion>> {
  return request(`/analytics/queries/p4${buildQueryString({ anio, ...table })}`, { method: 'GET' })
}

export function getP5(anio: number | undefined, table: ParametrosTabla): Promise<PaginaConsulta<FilaP5EdadCarrera>> {
  return request(`/analytics/queries/p5${buildQueryString({ anio, ...table })}`, { method: 'GET' })
}

export function getP6(table: ParametrosTabla): Promise<PaginaConsulta<ResumenCarreraDocument>> {
  return request(`/analytics/queries/p6${buildQueryString(table)}`, { method: 'GET' })
}

export function materializeCareerSummary(): Promise<{ actualizado: boolean }> {
  return request('/analytics/resumen-carrera', { method: 'POST' })
}
