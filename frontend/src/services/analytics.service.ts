import { request, buildQueryString } from './api'
import type { ResumenDashboardResponse } from '@/types/analytics'

export function getDashboardSummary(anio?: number): Promise<ResumenDashboardResponse> {
  return request(`/analytics/summary${buildQueryString({ anio })}`, { method: 'GET' })
}
