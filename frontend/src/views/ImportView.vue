<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import { getImportById, getImportErrors, listImports, resyncAllNeo4j, resyncImportNeo4j, uploadCsvFile } from '@/services/imports.service'
import type { ImportIssue, ImportRecord, TipoIncidencia } from '@/types/imports'

const inputArchivo = ref<HTMLInputElement | null>(null)
const archivosSeleccionados = ref<File[]>([])
const ocupado = ref(false)
const sincronizandoId = ref<string | null>(null)
const arrastrando = ref(false)
const mensaje = ref('')
const error = ref('')
const ultimaImportacion = ref<ImportRecord | null>(null)

const historial = ref<ImportRecord[]>([])
const cargandoHistorial = ref(false)
const errorHistorial = ref('')
const pagina = ref(1)
const paginas = ref(1)
const total = ref(0)
const paginaAnterior = ref<number | null>(null)
const paginaSiguiente = ref<number | null>(null)
const limite = 10

const importacionSeleccionada = ref<ImportRecord | null>(null)
const incidencias = ref<ImportIssue[]>([])
const filtroIncidencia = ref<TipoIncidencia | ''>('')
const paginaIncidencias = ref(1)
const paginasIncidencias = ref(1)
const totalIncidencias = ref(0)
const incidenciaAnterior = ref<number | null>(null)
const incidenciaSiguiente = ref<number | null>(null)
const cargandoIncidencias = ref(false)
const errorIncidencias = ref('')

const resumenContadores = computed(() => [
  { label: 'Filas leídas', value: ultimaImportacion.value?.contadores.leidos ?? '—' },
  { label: 'Válidas', value: ultimaImportacion.value?.contadores.validos ?? '—' },
  { label: 'Nuevas', value: ultimaImportacion.value?.contadores.nuevos ?? '—' },
  { label: 'Duplicadas', value: ultimaImportacion.value?.contadores.duplicados ?? '—' },
  { label: 'Con advertencias', value: ultimaImportacion.value?.contadores.advertencias ?? '—' },
  { label: 'Rechazadas', value: ultimaImportacion.value?.contadores.rechazados ?? '—' },
])

function obtenerMensajeError(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message
  }
  return 'No se pudo completar la operación.'
}

function formatearFecha(valorIso: string): string {
  return new Date(valorIso).toLocaleString('es-GT')
}

function formatearTamanoArchivo(bytes: number): string {
  const unMegabyte = 1024 * 1024
  if (bytes < unMegabyte) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / unMegabyte).toFixed(1)} MB`
}

function formatearEstadoImportacion(estado: ImportRecord['estado']): string {
  if (estado === 'PROCESANDO') return 'Procesando'
  if (estado === 'COMPLETADO') return 'Completado'
  if (estado === 'NEO4J_PENDIENTE') return 'MongoDB guardado'
  return 'Falló'
}

function formatearEstadoNeo4j(estado: ImportRecord['neo4j_sync']['status']): string {
  if (estado === 'SINCRONIZADO') return 'Sincronizado'
  if (estado === 'PENDIENTE') return 'Pendiente'
  return 'Falló'
}

function agregarArchivos(archivos: File[]) {
  if (ocupado.value) return
  error.value = ''
  mensaje.value = ''

  const archivosValidos = archivos.filter(archivo => /\.csv$/i.test(archivo.name) && archivo.size > 0)
  if (archivosValidos.length !== archivos.length) {
    error.value = 'Algunos archivos fueron omitidos porque no son .csv o están vacíos.'
  }
  archivosSeleccionados.value = archivosValidos
}

function alSeleccionarArchivos(event: Event) {
  const elemento = event.target as HTMLInputElement
  agregarArchivos(Array.from(elemento.files ?? []))
  elemento.value = ''
}

function alSoltarArchivos(event: DragEvent) {
  arrastrando.value = false
  agregarArchivos(Array.from(event.dataTransfer?.files ?? []))
}

async function subirArchivos() {
  if (ocupado.value || !archivosSeleccionados.value.length) return
  ocupado.value = true
  error.value = ''
  mensaje.value = ''
  let archivosImportados = 0

  try {
    for (const archivo of archivosSeleccionados.value) {
      const resultado = await uploadCsvFile(archivo)
      ultimaImportacion.value = resultado
      archivosImportados += 1
    }
    mensaje.value = `Se importaron ${archivosImportados} archivo(s) correctamente.`
    archivosSeleccionados.value = []
    pagina.value = 1
    await cargarHistorial()
  } catch (cause) {
    error.value = obtenerMensajeError(cause)
  } finally {
    ocupado.value = false
  }
}

async function sincronizarRegistroNeo4j(registro: ImportRecord) {
  if (ocupado.value || sincronizandoId.value !== null) return
  sincronizandoId.value = registro.id
  errorHistorial.value = ''
  mensaje.value = ''

  try {
    const actualizado = await resyncImportNeo4j(registro.id)
    if (ultimaImportacion.value?.id === actualizado.id) {
      ultimaImportacion.value = actualizado
    }
    if (importacionSeleccionada.value?.id === actualizado.id) {
      importacionSeleccionada.value = actualizado
    }
    mensaje.value = `Sincronización con Neo4j completada para ${actualizado.archivo} (${actualizado.neo4j_sync.nodesProcessed} evaluaciones).`
    await cargarHistorial()
  } catch (cause) {
    errorHistorial.value = obtenerMensajeError(cause)
    await cargarHistorial()
  } finally {
    sincronizandoId.value = null
  }
}

async function sincronizarTodoNeo4j() {
  if (ocupado.value || sincronizandoId.value !== null) return
  sincronizandoId.value = 'all'
  errorHistorial.value = ''
  mensaje.value = ''

  try {
    const resultado = await resyncAllNeo4j()
    mensaje.value = `Grafo Neo4j sincronizado con todas las evaluaciones (${resultado.nodesProcessed} registros procesados).`
    await cargarHistorial()
  } catch (cause) {
    errorHistorial.value = obtenerMensajeError(cause)
  } finally {
    sincronizandoId.value = null
  }
}

async function cargarHistorial() {
  cargandoHistorial.value = true
  errorHistorial.value = ''

  try {
    const respuesta = await listImports(pagina.value, limite)
    historial.value = respuesta.items
    total.value = respuesta.total
    pagina.value = respuesta.pagina
    paginas.value = respuesta.paginas
    paginaAnterior.value = respuesta.paginaAnterior
    paginaSiguiente.value = respuesta.paginaSiguiente
  } catch (cause) {
    errorHistorial.value = obtenerMensajeError(cause)
  } finally {
    cargandoHistorial.value = false
  }
}

async function cambiarPaginaHistorial(nuevaPagina: number | null) {
  if (nuevaPagina === null) return
  pagina.value = nuevaPagina
  await cargarHistorial()
}

async function cargarIncidencias() {
  const idImportacion = importacionSeleccionada.value?.id
  if (!idImportacion) return

  cargandoIncidencias.value = true
  errorIncidencias.value = ''
  incidencias.value = []

  try {
    const respuesta = await getImportErrors(
      idImportacion,
      filtroIncidencia.value || undefined,
      paginaIncidencias.value,
    )
    incidencias.value = respuesta.items
    totalIncidencias.value = respuesta.total
    paginaIncidencias.value = respuesta.pagina
    paginasIncidencias.value = respuesta.paginas
    incidenciaAnterior.value = respuesta.paginaAnterior
    incidenciaSiguiente.value = respuesta.paginaSiguiente
  } catch (cause) {
    errorIncidencias.value = obtenerMensajeError(cause)
  } finally {
    cargandoIncidencias.value = false
  }
}

async function verDetalleImportacion(registro: ImportRecord) {
  importacionSeleccionada.value = registro
  paginaIncidencias.value = 1
  filtroIncidencia.value = ''
  await cargarIncidencias()
}

async function cambiarFiltroIncidencias() {
  paginaIncidencias.value = 1
  await cargarIncidencias()
}

async function cambiarPaginaIncidencias(nuevaPagina: number | null) {
  if (nuevaPagina === null) return
  paginaIncidencias.value = nuevaPagina
  await cargarIncidencias()
}

async function actualizarImportacionSeleccionada() {
  const idImportacion = importacionSeleccionada.value?.id
  if (!idImportacion) return

  try {
    const actualizada = await getImportById(idImportacion)
    importacionSeleccionada.value = actualizada
    ultimaImportacion.value = actualizada
    await cargarIncidencias()
  } catch (cause) {
    errorIncidencias.value = obtenerMensajeError(cause)
  }
}

onMounted(() => {
  void cargarHistorial()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Carga de CSV e historial</h1>
        <p class="page-subtitle">
          Importa tus archivos, revisa los resultados y consulta los errores de cada fila.
        </p>
      </div>
    </header>

    <p v-if="error" class="upload-alert upload-alert--error" role="alert">{{ error }}</p>
    <p v-if="mensaje" class="upload-alert" role="status">{{ mensaje }}</p>

    <section aria-label="Resultado de la última importación">
      <div class="section-heading upload-result-heading">
        <h2>Resultado de importación</h2>
        <span v-if="ultimaImportacion" class="badge">
          {{ formatearEstadoImportacion(ultimaImportacion.estado) }}
        </span>
      </div>
      <p class="hint upload-result-description">
        {{
          ultimaImportacion
            ? `${ultimaImportacion.archivo} · ${ultimaImportacion.duracion_ms} ms · Neo4j: ${formatearEstadoNeo4j(ultimaImportacion.neo4j_sync.status)}`
            : 'Los contadores aparecerán cuando el servidor procese un archivo.'
        }}
      </p>
      <ul class="stat-grid">
        <li v-for="contador in resumenContadores" :key="contador.label" class="stat">
          <span class="stat__value">{{ contador.value }}</span>
          <span class="stat__label">{{ contador.label }}</span>
        </li>
      </ul>
    </section>

    <BaseCard
      title="Carga de archivos CSV"
      description="Selecciona uno o varios CSV UTF-8. El servidor valida el tamaño, los encabezados y las filas."
    >
      <input
        ref="inputArchivo"
        class="sr-only"
        type="file"
        accept=".csv,text/csv"
        multiple
        :disabled="ocupado"
        tabindex="-1"
        aria-label="Archivos CSV"
        @change="alSeleccionarArchivos"
      />
      <div
        class="placeholder placeholder--dropzone"
        :class="{ 'dropzone--active': arrastrando }"
        @dragover.prevent="arrastrando = !ocupado"
        @dragleave.prevent="arrastrando = false"
        @drop.prevent="alSoltarArchivos"
      >
        <AppIcon name="upload" :size="32" />
        <p class="placeholder__title">
          {{ ocupado ? 'Procesando archivos…' : 'Arrastra tus archivos CSV aquí' }}
        </p>
        <p>También puedes seleccionarlos desde tu equipo.</p>
        <button class="btn btn--primary" type="button" :disabled="ocupado" @click="inputArchivo?.click()">
          Seleccionar archivos
        </button>
      </div>

      <div v-if="archivosSeleccionados.length" class="upload-queue">
        <div v-for="archivo in archivosSeleccionados" :key="archivo.name" class="upload-file">
          <div>
            <strong>{{ archivo.name }}</strong>
            <p class="hint">{{ formatearTamanoArchivo(archivo.size) }}</p>
          </div>
        </div>
        <div class="upload-actions">
          <button class="btn btn--primary" type="button" :disabled="ocupado" @click="subirArchivos">
            {{ ocupado ? 'Procesando…' : `Importar ${archivosSeleccionados.length} archivo(s)` }}
          </button>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="ocupado"
            @click="archivosSeleccionados = []"
          >
            Limpiar lista
          </button>
        </div>
      </div>
    </BaseCard>

    <BaseCard title="Historial de importaciones" description="Registros consultados directamente al backend.">
      <div class="upload-actions">
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="ocupado || cargandoHistorial"
          @click="cargarHistorial"
        >
          <AppIcon name="refresh" :size="16" />
          Actualizar historial
        </button>
        <button
          class="btn btn--primary"
          type="button"
          :disabled="ocupado || sincronizandoId !== null || !historial.length"
          @click="sincronizarTodoNeo4j"
        >
          {{ sincronizandoId === 'all' ? 'Sincronizando Neo4j…' : 'Sincronizar todo con Neo4j' }}
        </button>
        <span class="hint">{{ total }} importaciones</span>
      </div>

      <p v-if="errorHistorial" class="upload-alert upload-alert--error" role="alert">
        {{ errorHistorial }}
      </p>
      <p v-if="cargandoHistorial" class="hint" role="status">Consultando historial…</p>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Fecha</th>
              <th>Leídos</th>
              <th>Nuevos</th>
              <th>Duplicados</th>
              <th>Rechazados</th>
              <th>Advertencias</th>
              <th>Estado</th>
              <th>Neo4j</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in historial" :key="registro.id">
              <td>{{ registro.archivo }}</td>
              <td>{{ formatearFecha(registro.created_at) }}</td>
              <td>{{ registro.contadores.leidos }}</td>
              <td>{{ registro.contadores.nuevos }}</td>
              <td>{{ registro.contadores.duplicados }}</td>
              <td>{{ registro.contadores.rechazados }}</td>
              <td>{{ registro.contadores.advertencias }}</td>
              <td>
                <span
                  class="badge"
                  :class="registro.estado === 'FALLO' ? 'badge--warning' : 'badge--muted'"
                >
                  {{ formatearEstadoImportacion(registro.estado) }}
                </span>
              </td>
              <td>{{ formatearEstadoNeo4j(registro.neo4j_sync.status) }}</td>
              <td>
                <div class="upload-actions">
                  <button
                    class="btn btn--ghost"
                    type="button"
                    :disabled="ocupado"
                    @click="verDetalleImportacion(registro)"
                  >
                    Ver detalle
                  </button>
                  <button
                    v-if="registro.contadores.validos > 0 && registro.neo4j_sync.status !== 'SINCRONIZADO'"
                    class="btn btn--ghost"
                    type="button"
                    :disabled="ocupado || sincronizandoId !== null"
                    @click="sincronizarRegistroNeo4j(registro)"
                  >
                    {{ sincronizandoId === registro.id ? 'Sincronizando…' : 'Sincronizar Neo4j' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!historial.length && !cargandoHistorial && !errorHistorial">
              <td colspan="10" class="table__empty">Todavía no hay importaciones.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="upload-pagination">
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="paginaAnterior === null || cargandoHistorial || ocupado"
          @click="cambiarPaginaHistorial(paginaAnterior)"
        >
          Anterior
        </button>
        <span class="hint">Página {{ pagina }} de {{ paginas }}</span>
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="paginaSiguiente === null || cargandoHistorial || ocupado"
          @click="cambiarPaginaHistorial(paginaSiguiente)"
        >
          Siguiente
        </button>
      </div>
    </BaseCard>

    <BaseCard
      title="Errores y advertencias"
      :description="
        importacionSeleccionada
          ? `${importacionSeleccionada.archivo} · ${importacionSeleccionada.id}`
          : 'Selecciona una importación del historial para ver su detalle.'
      "
    >
      <template v-if="importacionSeleccionada">
        <div class="upload-actions">
          <label class="field">
            Tipo de incidencia
            <select
              v-model="filtroIncidencia"
              :disabled="cargandoIncidencias"
              @change="cambiarFiltroIncidencias"
            >
              <option value="">Todos</option>
              <option value="ERROR">Errores</option>
              <option value="ADVERTENCIA">Advertencias</option>
            </select>
          </label>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="cargandoIncidencias"
            @click="actualizarImportacionSeleccionada"
          >
            Actualizar detalle
          </button>
          <span class="hint">{{ totalIncidencias }} incidencias</span>
        </div>

        <p v-if="errorIncidencias" class="upload-alert upload-alert--error" role="alert">
          {{ errorIncidencias }}
        </p>
        <p v-if="cargandoIncidencias" class="hint" role="status">Consultando incidencias…</p>

        <div
          v-for="incidencia in incidencias"
          :key="`${incidencia.importacion_id}:${incidencia.fila}:${incidencia.tipo}:${incidencia.codigos.join(',')}`"
          class="upload-issue"
        >
          <div class="upload-actions">
            <strong>Fila {{ incidencia.fila }}</strong>
            <span
              class="badge"
              :class="incidencia.tipo === 'ERROR' ? 'badge--warning' : 'badge--muted'"
            >
              {{ incidencia.tipo }}
            </span>
          </div>
          <p>{{ incidencia.mensaje }}</p>
          <p class="hint">{{ incidencia.codigos.join(' · ') }}</p>
          <details>
            <summary>Datos originales</summary>
            <pre>{{ JSON.stringify(incidencia.datos_crudos, null, 2) }}</pre>
          </details>
        </div>

        <p v-if="!incidencias.length && !cargandoIncidencias && !errorIncidencias" class="hint">
          No hay incidencias para este filtro.
        </p>

        <div class="upload-pagination">
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="incidenciaAnterior === null || cargandoIncidencias"
            @click="cambiarPaginaIncidencias(incidenciaAnterior)"
          >
            Anterior
          </button>
          <span class="hint">Página {{ paginaIncidencias }} de {{ paginasIncidencias }}</span>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="incidenciaSiguiente === null || cargandoIncidencias"
            @click="cambiarPaginaIncidencias(incidenciaSiguiente)"
          >
            Siguiente
          </button>
        </div>
      </template>
    </BaseCard>
  </div>
</template>

<style scoped>
.upload-actions,
.upload-pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.upload-pagination {
  justify-content: space-between;
}

.upload-actions .field {
  min-width: 160px;
}

.upload-result-heading h2 {
  font-size: 16px;
}

.upload-result-description {
  margin: 8px 0 16px;
}

.upload-alert {
  padding: 13px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--blue-soft);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.upload-alert--error {
  background: var(--coral-soft);
}

.dropzone--active {
  outline: 2px solid var(--color-primary);
  outline-offset: -3px;
}

.upload-file {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.upload-file > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.upload-file strong {
  font-size: 13px;
  font-weight: 500;
}

.upload-queue > .upload-actions {
  margin-top: 16px;
}

.upload-issue {
  display: grid;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.upload-issue summary {
  cursor: pointer;
  color: var(--color-primary);
}

.upload-issue pre {
  overflow: auto;
  max-height: 250px;
  white-space: pre-wrap;
  padding: 12px;
  border-radius: 6px;
  background: var(--color-surface-muted);
}

.table td {
  vertical-align: top;
}
</style>
