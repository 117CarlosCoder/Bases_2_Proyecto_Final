<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import { getImportById, getImportErrors, listImports, uploadCsvFile } from '@/services/imports.service'
import type { ImportIssue, ImportRecord, TipoIncidencia } from '@/types/imports'

const input = ref<HTMLInputElement | null>(null)
const archivosSeleccionados = ref<File[]>([])
const ocupado = ref(false)
const arrastrando = ref(false)
const mensaje = ref('')
const error = ref('')
const ultima = ref<ImportRecord | null>(null)

const historial = ref<ImportRecord[]>([])
const cargandoHistorial = ref(false)
const errorHistorial = ref('')
const pagina = ref(1)
const paginas = ref(1)
const total = ref(0)
const paginaAnterior = ref<number | null>(null)
const paginaSiguiente = ref<number | null>(null)
const limite = 10

const seleccionada = ref<ImportRecord | null>(null)
const incidencias = ref<ImportIssue[]>([])
const filtro = ref<TipoIncidencia | ''>('')
const paginaIncidencias = ref(1)
const paginasIncidencias = ref(1)
const totalIncidencias = ref(0)
const incidenciaAnterior = ref<number | null>(null)
const incidenciaSiguiente = ref<number | null>(null)
const cargandoIncidencias = ref(false)
const errorIncidencias = ref('')

const resumen = computed(() => [
  { label: 'Filas leídas', value: ultima.value?.contadores.leidos ?? '—' },
  { label: 'Válidas', value: ultima.value?.contadores.validos ?? '—' },
  { label: 'Nuevas', value: ultima.value?.contadores.nuevos ?? '—' },
  { label: 'Duplicadas', value: ultima.value?.contadores.duplicados ?? '—' },
  { label: 'Con advertencias', value: ultima.value?.contadores.advertencias ?? '—' },
  { label: 'Rechazadas', value: ultima.value?.contadores.rechazados ?? '—' },
])

const mensajeError = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'No se pudo completar la operación.'
const fecha = (value: string) => new Date(value).toLocaleString('es-GT')
const tamano = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const estado = (value: ImportRecord['estado']) =>
  ({
    PROCESANDO: 'Procesando',
    COMPLETADO: 'Completado',
    NEO4J_PENDIENTE: 'MongoDB guardado',
    FALLO: 'Falló',
  })[value]
const estadoSync = (value: ImportRecord['neo4j_sync']['status']) =>
  ({ SINCRONIZADO: 'Sincronizado', PENDIENTE: 'Pendiente', FALLO: 'Falló' })[value]

function agregarArchivos(files: File[]) {
  if (ocupado.value) return
  error.value = ''
  mensaje.value = ''
  const validos = files.filter(file => /\.csv$/i.test(file.name) && file.size > 0)
  if (validos.length !== files.length) {
    error.value = 'Algunos archivos fueron omitidos porque no son .csv o están vacíos.'
  }
  archivosSeleccionados.value = validos
}

function cambioArchivos(event: Event) {
  const element = event.target as HTMLInputElement
  agregarArchivos(Array.from(element.files ?? []))
  element.value = ''
}

function soltarArchivos(event: DragEvent) {
  arrastrando.value = false
  agregarArchivos(Array.from(event.dataTransfer?.files ?? []))
}

async function subirArchivos() {
  if (ocupado.value || !archivosSeleccionados.value.length) return
  ocupado.value = true
  error.value = ''
  mensaje.value = ''
  let exitosos = 0

  try {
    for (const file of archivosSeleccionados.value) {
      const resultado = await uploadCsvFile(file)
      ultima.value = resultado
      exitosos += 1
    }
    mensaje.value = `Se importaron ${exitosos} archivo(s) correctamente.`
    archivosSeleccionados.value = []
    pagina.value = 1
    await cargarHistorial()
  } catch (cause) {
    error.value = mensajeError(cause)
  } finally {
    ocupado.value = false
  }
}

async function cargarHistorial() {
  cargandoHistorial.value = true
  errorHistorial.value = ''
  try {
    const response = await listImports(pagina.value, limite)
    historial.value = response.items
    total.value = response.total
    pagina.value = response.pagina
    paginas.value = response.paginas
    paginaAnterior.value = response.paginaAnterior
    paginaSiguiente.value = response.paginaSiguiente
  } catch (cause) {
    errorHistorial.value = mensajeError(cause)
  } finally {
    cargandoHistorial.value = false
  }
}

async function cambiarPagina(value: number | null) {
  if (value === null) return
  pagina.value = value
  await cargarHistorial()
}

async function cargarIncidencias() {
  const id = seleccionada.value?.id
  if (!id) return
  cargandoIncidencias.value = true
  errorIncidencias.value = ''
  incidencias.value = []
  try {
    const response = await getImportErrors(id, filtro.value || undefined, paginaIncidencias.value)
    incidencias.value = response.items
    totalIncidencias.value = response.total
    paginaIncidencias.value = response.pagina
    paginasIncidencias.value = response.paginas
    incidenciaAnterior.value = response.paginaAnterior
    incidenciaSiguiente.value = response.paginaSiguiente
  } catch (cause) {
    errorIncidencias.value = mensajeError(cause)
  } finally {
    cargandoIncidencias.value = false
  }
}

async function verDetalle(registro: ImportRecord) {
  seleccionada.value = registro
  paginaIncidencias.value = 1
  filtro.value = ''
  await cargarIncidencias()
}

async function cambiarFiltro() {
  paginaIncidencias.value = 1
  await cargarIncidencias()
}

async function cambiarPaginaIncidencias(value: number | null) {
  if (value === null) return
  paginaIncidencias.value = value
  await cargarIncidencias()
}

async function actualizarSeleccionada() {
  const id = seleccionada.value?.id
  if (!id) return
  try {
    const actual = await getImportById(id)
    seleccionada.value = actual
    ultima.value = actual
    await cargarIncidencias()
  } catch (cause) {
    errorIncidencias.value = mensajeError(cause)
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
        <p class="page-subtitle">Importa tus archivos, revisa los resultados y consulta los errores de cada fila.</p>
      </div>
    </header>

    <p v-if="error" class="upload-alert upload-alert--error" role="alert">{{ error }}</p>
    <p v-if="mensaje" class="upload-alert" role="status">{{ mensaje }}</p>

    <section aria-label="Resultado de la última importación">
      <div class="section-heading upload-result-heading">
        <h2>Resultado de importación</h2>
        <span v-if="ultima" class="badge">{{ estado(ultima.estado) }}</span>
      </div>
      <p class="hint upload-result-description">
        {{ ultima ? `${ultima.archivo} · ${ultima.duracion_ms} ms · Neo4j: ${estadoSync(ultima.neo4j_sync.status)}` : 'Los contadores aparecerán cuando el servidor procese un archivo.' }}
      </p>
      <ul class="stat-grid">
        <li v-for="stat in resumen" :key="stat.label" class="stat">
          <span class="stat__value">{{ stat.value }}</span>
          <span class="stat__label">{{ stat.label }}</span>
        </li>
      </ul>
    </section>

    <BaseCard title="Carga de archivos CSV" description="Selecciona uno o varios CSV UTF-8. El servidor valida el tamaño, los encabezados y las filas.">
      <input
        ref="input"
        class="sr-only"
        type="file"
        accept=".csv,text/csv"
        multiple
        :disabled="ocupado"
        tabindex="-1"
        aria-label="Archivos CSV"
        @change="cambioArchivos"
      />
      <div
        class="placeholder placeholder--dropzone"
        :class="{ 'dropzone--active': arrastrando }"
        @dragover.prevent="arrastrando = !ocupado"
        @dragleave.prevent="arrastrando = false"
        @drop.prevent="soltarArchivos"
      >
        <AppIcon name="upload" :size="32" />
        <p class="placeholder__title">{{ ocupado ? 'Procesando archivos…' : 'Arrastra tus archivos CSV aquí' }}</p>
        <p>También puedes seleccionarlos desde tu equipo.</p>
        <button class="btn btn--primary" type="button" :disabled="ocupado" @click="input?.click()">
          Seleccionar archivos
        </button>
      </div>

      <div v-if="archivosSeleccionados.length" class="upload-queue">
        <div v-for="file in archivosSeleccionados" :key="file.name" class="upload-file">
          <div>
            <strong>{{ file.name }}</strong>
            <p class="hint">{{ tamano(file.size) }}</p>
          </div>
        </div>
        <div class="upload-actions">
          <button class="btn btn--primary" type="button" :disabled="ocupado" @click="subirArchivos">
            {{ ocupado ? 'Procesando…' : `Importar ${archivosSeleccionados.length} archivo(s)` }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="ocupado" @click="archivosSeleccionados = []">
            Limpiar lista
          </button>
        </div>
      </div>
    </BaseCard>

    <BaseCard title="Historial de importaciones" description="Registros consultados directamente al backend.">
      <div class="upload-actions">
        <button class="btn btn--ghost" type="button" :disabled="ocupado || cargandoHistorial" @click="cargarHistorial">
          <AppIcon name="refresh" :size="16" />Actualizar historial
        </button>
        <span class="hint">{{ total }} importaciones</span>
      </div>
      <p v-if="errorHistorial" class="upload-alert upload-alert--error" role="alert">{{ errorHistorial }}</p>
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
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in historial" :key="registro.id">
              <td>{{ registro.archivo }}</td>
              <td>{{ fecha(registro.created_at) }}</td>
              <td>{{ registro.contadores.leidos }}</td>
              <td>{{ registro.contadores.nuevos }}</td>
              <td>{{ registro.contadores.duplicados }}</td>
              <td>{{ registro.contadores.rechazados }}</td>
              <td>{{ registro.contadores.advertencias }}</td>
              <td>
                <span class="badge" :class="registro.estado === 'FALLO' ? 'badge--warning' : 'badge--muted'">
                  {{ estado(registro.estado) }}
                </span>
              </td>
              <td>{{ estadoSync(registro.neo4j_sync.status) }}</td>
              <td>
                <button class="btn btn--ghost" type="button" :disabled="ocupado" @click="verDetalle(registro)">
                  Ver detalle
                </button>
              </td>
            </tr>
            <tr v-if="!historial.length && !cargandoHistorial && !errorHistorial">
              <td colspan="10" class="table__empty">Todavía no hay importaciones.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="upload-pagination">
        <button class="btn btn--ghost" type="button" :disabled="paginaAnterior === null || cargandoHistorial || ocupado" @click="cambiarPagina(paginaAnterior)">
          Anterior
        </button>
        <span class="hint">Página {{ pagina }} de {{ paginas }}</span>
        <button class="btn btn--ghost" type="button" :disabled="paginaSiguiente === null || cargandoHistorial || ocupado" @click="cambiarPagina(paginaSiguiente)">
          Siguiente
        </button>
      </div>
    </BaseCard>

    <BaseCard
      title="Errores y advertencias"
      :description="seleccionada ? `${seleccionada.archivo} · ${seleccionada.id}` : 'Selecciona una importación del historial para ver su detalle.'"
    >
      <template v-if="seleccionada">
        <div class="upload-actions">
          <label class="field">
            Tipo de incidencia
            <select v-model="filtro" :disabled="cargandoIncidencias" @change="cambiarFiltro">
              <option value="">Todos</option>
              <option value="ERROR">Errores</option>
              <option value="ADVERTENCIA">Advertencias</option>
            </select>
          </label>
          <button class="btn btn--ghost" type="button" :disabled="cargandoIncidencias" @click="actualizarSeleccionada">
            Actualizar detalle
          </button>
          <span class="hint">{{ totalIncidencias }} incidencias</span>
        </div>
        <p v-if="errorIncidencias" class="upload-alert upload-alert--error" role="alert">{{ errorIncidencias }}</p>
        <p v-if="cargandoIncidencias" class="hint" role="status">Consultando incidencias…</p>
        <div
          v-for="issue in incidencias"
          :key="`${issue.importacion_id}:${issue.fila}:${issue.tipo}:${issue.codigos.join(',')}`"
          class="upload-issue"
        >
          <div class="upload-actions">
            <strong>Fila {{ issue.fila }}</strong>
            <span class="badge" :class="issue.tipo === 'ERROR' ? 'badge--warning' : 'badge--muted'">{{ issue.tipo }}</span>
          </div>
          <p>{{ issue.mensaje }}</p>
          <p class="hint">{{ issue.codigos.join(' · ') }}</p>
          <details>
            <summary>Datos originales</summary>
            <pre>{{ JSON.stringify(issue.datos_crudos, null, 2) }}</pre>
          </details>
        </div>
        <p v-if="!incidencias.length && !cargandoIncidencias && !errorIncidencias" class="hint">
          No hay incidencias para este filtro.
        </p>
        <div class="upload-pagination">
          <button class="btn btn--ghost" type="button" :disabled="incidenciaAnterior === null || cargandoIncidencias" @click="cambiarPaginaIncidencias(incidenciaAnterior)">
            Anterior
          </button>
          <span class="hint">Página {{ paginaIncidencias }} de {{ paginasIncidencias }}</span>
          <button class="btn btn--ghost" type="button" :disabled="incidenciaSiguiente === null || cargandoIncidencias" @click="cambiarPaginaIncidencias(incidenciaSiguiente)">
            Siguiente
          </button>
        </div>
      </template>
    </BaseCard>
  </div>
</template>

<style scoped>
.upload-actions, .upload-pagination { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.upload-pagination { justify-content: space-between; }
.upload-actions .field { min-width: 160px; }
.upload-result-heading h2 { font-size: 16px; }
.upload-result-description { margin: 8px 0 16px; }
.upload-alert { padding: 13px 16px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--blue-soft); font-size: 12px; overflow-wrap: anywhere; }
.upload-alert--error { background: var(--coral-soft); }
.dropzone--active { outline: 2px solid var(--color-primary); outline-offset: -3px; }
.upload-file { display: flex; gap: 15px; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border); }
.upload-file > div { min-width: 0; overflow-wrap: anywhere; }
.upload-file strong { font-size: 13px; font-weight: 500; }
.upload-queue > .upload-actions { margin-top: 16px; }
.upload-issue { display: grid; gap: 8px; padding: 18px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 12px; overflow-wrap: anywhere; }
.upload-issue summary { cursor: pointer; color: var(--color-primary); }
.upload-issue pre { overflow: auto; max-height: 250px; white-space: pre-wrap; padding: 12px; border-radius: 6px; background: var(--color-surface-muted); }
.table td { vertical-align: top; }
</style>
