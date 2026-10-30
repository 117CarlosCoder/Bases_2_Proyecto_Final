import { request, buildQueryString } from './api'
import type { FiltrosDisponiblesGrafo, IdConsultaGrafo, ParametrosBenchmarkGrafo, ParametrosConsultaGrafo, RespuestaBenchmarkGrafo, RespuestaConsultaGrafo } from '@/types/graphs'

export function getGraphFilters() {
  return request<FiltrosDisponiblesGrafo>('/graphs/filters', { method: 'GET' }, 30000)
}

export function runGraphQuery(queryId: IdConsultaGrafo, params: ParametrosConsultaGrafo = {}) {
  const query = buildQueryString({
    anio: params.anio || undefined,
    correlativo: params.correlativo?.trim() || undefined,
    departamento: params.departamento?.trim() || undefined,
    carrera: params.carrera?.trim() || undefined,
    materia: params.materia?.trim() || undefined,
    tipo: params.tipo?.trim() || undefined,
    limite: params.limite || undefined,
  })
  return request<RespuestaConsultaGrafo>(`/graphs/queries/${queryId}${query}`, { method: 'GET' }, 30000)
}

export function runGraphBenchmark(params: ParametrosBenchmarkGrafo = {}) {
  const query = buildQueryString({
    escenario: params.escenario || undefined,
    repeticiones: params.repeticiones || undefined,
    limite: params.limite || undefined,
    anio: params.anio || undefined,
  })
  return request<RespuestaBenchmarkGrafo>(`/graphs/benchmark${query}`, { method: 'GET' }, 60000)
}
