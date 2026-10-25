import { request } from './api'
import type { HealthReport, ServiceHealth, ServiceStatus } from '@/types/health'

interface BackendHealthResponse {
  status?: string
  services?: {
    api?: { status?: string; error?: string | null }
    mongodb?: { status?: string; error?: string | null }
    neo4j?: { status?: string; error?: string | null }
  }
}

function leerEstadoServicio(
  servicio: { status?: string; error?: string | null } | undefined,
  porDefecto: ServiceStatus,
): ServiceHealth {
  if (!servicio) {
    return { status: porDefecto, error: null }
  }

  const texto = (servicio.status ?? '').toLowerCase()
  const status: ServiceStatus = texto === 'up' ? 'up' : texto === 'down' ? 'down' : porDefecto

  return {
    status,
    error: servicio.error ?? null,
  }
}

export async function getHealth(): Promise<HealthReport> {
  try {
    const respuesta = await request<BackendHealthResponse>('/health')
    const api = leerEstadoServicio(respuesta.services?.api, 'up')
    const mongodb = leerEstadoServicio(respuesta.services?.mongodb, 'unknown')
    const neo4j = leerEstadoServicio(respuesta.services?.neo4j, 'unknown')

    const todoDisponible = respuesta.status === 'ok' && mongodb.status === 'up' && neo4j.status === 'up'

    return {
      overall: todoDisponible ? 'ok' : 'degraded',
      services: { api, mongodb, neo4j },
      error: null,
    }
  } catch (cause) {
    const mensajeError = cause instanceof Error ? cause.message : 'Error al consultar el estado del sistema.'

    return {
      overall: 'offline',
      services: {
        api: { status: 'down', error: mensajeError },
        mongodb: { status: 'unknown', error: null },
        neo4j: { status: 'unknown', error: null },
      },
      error: mensajeError,
    }
  }
}
