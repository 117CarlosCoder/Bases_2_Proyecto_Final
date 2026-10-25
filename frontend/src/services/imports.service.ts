import { request } from './api'
import type { ImportRecord, ImportIssue, TipoIncidencia } from '@/types/imports'
import type { Pagina } from '@/types/pagination'

const IMPORT_TIMEOUT_MS = 120_000

export async function uploadCsvFile(file: File): Promise<ImportRecord> {
  if (!/\.csv$/i.test(file.name)) throw new Error('Selecciona un archivo con extensión .csv.')
  if (file.size === 0) throw new Error('El archivo está vacío.')
  let csvContent: string
  try {
    csvContent = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
  } catch {
    throw new Error('No se pudo leer el archivo como UTF-8. Revisa su codificación.')
  }
  return request<ImportRecord>('/imports/csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvContent, fileName: file.name }),
  }, IMPORT_TIMEOUT_MS)
}

export function listImports(pagina = 1, limite = 10): Promise<Pagina<ImportRecord>> {
  const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) })
  return request(`/imports?${params}`)
}

export function getImportById(id: string): Promise<ImportRecord> {
  return request(`/imports/${encodeURIComponent(id)}`)
}

export function getImportErrors(
  id: string,
  tipo?: TipoIncidencia,
  pagina = 1,
  limite = 20,
): Promise<Pagina<ImportIssue> & { importacionId: string }> {
  const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) })
  if (tipo) params.set('tipo', tipo)
  return request(`/imports/${encodeURIComponent(id)}/errors?${params}`)
}
