import { request, buildQueryString } from './api'
import type { DetalleAspirante, FiltrosBusquedaAspirantes, FiltrosDisponiblesAspirantes, RespuestaListaAspirantes } from '@/types/applicants'

export function getApplicantsFilters() {
  return request<FiltrosDisponiblesAspirantes>('/applicants/filters', { method: 'GET' })
}

export function getApplicants(filtros: FiltrosBusquedaAspirantes = {}) {
  const query = buildQueryString({
    buscar: filtros.buscar?.trim() || undefined,
    anio: filtros.anio || undefined,
    carrera: filtros.carrera?.trim() || undefined,
    materia: filtros.materia?.trim() || undefined,
    tipo: filtros.tipo?.trim() || undefined,
    departamento: filtros.departamento?.trim() || undefined,
    pagina: filtros.pagina,
    limite: filtros.limite,
  })
  return request<RespuestaListaAspirantes>(`/applicants${query}`, { method: 'GET' })
}

export function getApplicantDetail(identifier: string) {
  return request<DetalleAspirante>(`/applicants/${encodeURIComponent(identifier)}`, { method: 'GET' })
}
