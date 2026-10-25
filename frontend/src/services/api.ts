const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_BASE_URL

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const DEFAULT_TIMEOUT_MS = 8000

export async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const url = `${API_BASE_URL}${cleanPath}`

    const headers = new Headers(options.headers)
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    const text = await response.text()
    const body = parseJsonSafely(text)

    if (!response.ok) {
      const serverMessage = getServerErrorMessage(body)
      throw new Error(serverMessage || `La API respondió con estado HTTP ${response.status}.`)
    }

    return body as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`La API no respondió en ${timeoutMs / 1000} segundos.`)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('No se pudo conectar con la API. Verifica que el backend esté en ejecución.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function parseJsonSafely(text: string): unknown {
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getServerErrorMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) {
    return body.trim()
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const message = record.message ?? record.error

    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.map(String).join(', ')
    }
  }

  return null
}

export function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
