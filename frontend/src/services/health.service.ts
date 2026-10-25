import { request } from './api'
import type { HealthReport, ServiceHealth, ServiceStatus } from '@/types/health'

interface RawServiceHealth {
  status?: string
  latencyMs?: number
  error?: string | null
}

interface RawHealthResponse {
  status?: string
  timestamp?: string
  services?: Record<string, RawServiceHealth | undefined>
}

const UP_STATUSES = ['up', 'ok', 'healthy', 'available', 'connected']
const DOWN_STATUSES = ['down', 'error', 'unhealthy', 'unavailable', 'disconnected']

function normalizeServiceStatus(value: string | undefined): ServiceStatus {
  const normalized = (value ?? '').trim().toLowerCase()
  if (UP_STATUSES.includes(normalized)) {
    return 'up'
  }
  if (DOWN_STATUSES.includes(normalized)) {
    return 'down'
  }
  return 'unknown'
}

function normalizeService(raw: RawServiceHealth | undefined, fallback: ServiceStatus): ServiceHealth {
  if (!raw) {
    return { status: fallback, latencyMs: null, error: null }
  }
  const status = normalizeServiceStatus(raw.status)
  return {
    status: status === 'unknown' ? fallback : status,
    latencyMs: typeof raw.latencyMs === 'number' && Number.isFinite(raw.latencyMs) ? raw.latencyMs : null,
    error: typeof raw.error === 'string' && raw.error.trim() ? raw.error : null,
  }
}

export async function getHealth(): Promise<HealthReport> {
  const startedAt = performance.now()

  try {
    const payload = await request<RawHealthResponse>('/health')
    const latencyMs = Math.round(performance.now() - startedAt)
    const services = payload.services ?? {}

    const api = normalizeService(services.api, 'up')
    const mongodb = normalizeService(services.mongodb, 'unknown')
    const neo4j = normalizeService(services.neo4j, 'unknown')

    const reportedOk = (payload.status ?? '').trim().toLowerCase() === 'ok'
    const databasesOk = mongodb.status === 'up' && neo4j.status === 'up'

    return {
      overall: reportedOk && databasesOk ? 'ok' : 'degraded',
      reachable: true,
      checkedAt: payload.timestamp ?? new Date().toISOString(),
      latencyMs,
      services: { api, mongodb, neo4j },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al consultar la API.'
    return {
      overall: 'offline',
      reachable: false,
      checkedAt: new Date().toISOString(),
      latencyMs: null,
      services: {
        api: { status: 'down', latencyMs: null, error: message },
        mongodb: { status: 'unknown', latencyMs: null, error: null },
        neo4j: { status: 'unknown', latencyMs: null, error: null },
      },
      error: message,
    }
  }
}
