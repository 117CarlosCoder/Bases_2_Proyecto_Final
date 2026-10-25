import { request, buildQueryString } from './api'
import type { ConsultaDashboard, ParametrosTabla, ResultadoConsulta, ResumenDashboardResponse, ResumenPeriodoDashboard, SeleccionPeriodo } from '@/types/analytics'

export function getDashboardSummary(anio?: number): Promise<ResumenDashboardResponse> {
  const query = buildQueryString({ anio })
  return request<ResumenDashboardResponse>(`/analytics/summary${query}`, { method: 'GET' })
}

export function getDashboardPeriod(seleccion: SeleccionPeriodo): Promise<ResumenPeriodoDashboard> {
  const query = buildQueryString(seleccion)
  return request<ResumenPeriodoDashboard>(`/analytics/period${query}`, { method: 'GET' })
}

export function getAnalyticsQuery(
  consulta: ConsultaDashboard,
  anio: number | undefined,
  parametrosTabla: ParametrosTabla,
): Promise<ResultadoConsulta> {
  const filtros = consulta === 'p6' ? parametrosTabla : { anio, ...parametrosTabla }
  const query = buildQueryString(filtros)
  return request<ResultadoConsulta>(`/analytics/queries/${consulta}${query}`, { method: 'GET' })
}

export function materializeCareerSummary(): Promise<{ actualizado: boolean }> {
  return request<{ actualizado: boolean }>('/analytics/resumen-carrera', { method: 'POST' })
}
