
const DEFAULT_BASE_URL = 'http://localhost:3000/api'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_BASE_URL

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const REQUEST_TIMEOUT_MS = 8000

export class ApiError extends Error {
  readonly status?: number
  readonly payload?: unknown

  constructor(message: string, status?: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}


export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
    const headers = new Headers(options.headers)
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    const response = await fetch(url, { ...options, headers, signal: controller.signal })
    const body = await parseBody(response)

    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(body) ?? `La API respondió con estado HTTP ${response.status}.`,
        response.status,
        body,
      )
    }

    return body as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (isAbortError(error)) {
      throw new ApiError(`La API no respondió en ${REQUEST_TIMEOUT_MS / 1000} segundos.`, undefined, error)
    }
    throw new ApiError(
      'No se pudo conectar con la API. Verifica que el backend esté en ejecución.',
      undefined,
      error,
    )
  } finally {
    window.clearTimeout(timeout)
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) {
    return body.trim()
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const candidate = record.message ?? record.error
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.map(String).join(', ')
    }
  }
  return null
}

function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError'
}


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
