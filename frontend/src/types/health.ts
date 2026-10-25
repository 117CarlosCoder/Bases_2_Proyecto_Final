export type OverallStatus = 'ok' | 'degraded' | 'offline'
export type ServiceStatus = 'up' | 'down' | 'unknown'

export interface ServiceHealth {
  status: ServiceStatus
  error?: string | null
}

export interface HealthReport {
  overall: OverallStatus
  services: {
    api: ServiceHealth
    mongodb: ServiceHealth
    neo4j: ServiceHealth
  }
  error: string | null
}
