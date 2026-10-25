export type OverallStatus = 'ok' | 'degraded' | 'offline'
export type ServiceStatus = 'up' | 'down' | 'unknown'

export interface ServiceHealth {
  status: ServiceStatus
  latencyMs: number | null
  error: string | null
}

export interface HealthReport {
  overall: OverallStatus
  reachable: boolean
  checkedAt: string
  latencyMs: number | null
  services: {
    api: ServiceHealth
    mongodb: ServiceHealth
    neo4j: ServiceHealth
  }
  error: string | null
}
