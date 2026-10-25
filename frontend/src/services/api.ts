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


export async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

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
      throw new ApiError(`La API no respondió en ${timeoutMs / 1000} segundos.`, undefined, error)
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

export function buildQueryString(options: object): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params.size ? `?${params}` : ''
}
