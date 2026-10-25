<script setup lang="ts">
import { computed, ref } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { useDebounceFn } from '@vueuse/core'
import AppIcon from './AppIcon.vue'
import { queries } from '@/config/dashboard-queries'
import type { ConsultaDashboard, FilaConsulta, ParametrosTabla, QueryColumn, ResultadoConsulta } from '@/types/analytics'

const props = defineProps<{
  selected: ConsultaDashboard
  params: ParametrosTabla
  response?: ResultadoConsulta
  loading: boolean
  materializing: boolean
}>()

const emit = defineEmits<{
  select: [consulta: ConsultaDashboard]
  search: [buscar: string]
  sort: [columna: string, direccion: 'asc' | 'desc']
  page: [pagina: number]
  'page-size': [limite: number]
  recalculate: []
}>()

const formateadorNumero = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 })

const consultaActiva = computed(() => {
  return queries.find(consulta => consulta.key === props.selected) ?? queries[0]!
})

const filas = computed<FilaConsulta[]>(() => {
  return props.response?.items ?? []
})

const textoBusqueda = ref(props.params.buscar)

const enviarBusquedaConRetraso = useDebounceFn((valor: string, consulta: ConsultaDashboard) => {
  if (consulta === props.selected && valor === textoBusqueda.value && valor !== props.params.buscar) {
    emit('search', valor)
  }
}, 300)

function seleccionarPestana(consulta: string | number) {
  if (consulta === props.selected) return
  textoBusqueda.value = ''
  emit('select', consulta as ConsultaDashboard)
}

function obtenerDireccionOrden(columna: QueryColumn): 'asc' | 'desc' | undefined {
  if (props.params.ordenarPor === columna.key) {
    return props.params.direccion
  }
  if (props.response?.ordenarPor === columna.key) {
    return props.response.direccion
  }
  return undefined
}

function obtenerAriaSort(columna: QueryColumn): 'ascending' | 'descending' | 'none' {
  const direccion = obtenerDireccionOrden(columna)
  if (direccion === 'asc') return 'ascending'
  if (direccion === 'desc') return 'descending'
  return 'none'
}

function obtenerIconoOrden(columna: QueryColumn): string {
  const direccion = obtenerDireccionOrden(columna)
  if (direccion === 'asc') return '↑'
  if (direccion === 'desc') return '↓'
  return '↕'
}

function alternarOrdenColumna(columna: QueryColumn) {
  const direccionActual = obtenerDireccionOrden(columna)
  const siguienteDireccion = direccionActual === 'asc' ? 'desc' : 'asc'
  emit('sort', columna.key, siguienteDireccion)
}

function irAPagina(pagina: number | null | undefined) {
  if (pagina == null) return
  emit('page', pagina)
}

function cambiarFilasPorPagina(event: Event) {
  const selector = event.target as HTMLSelectElement
  emit('page-size', Number(selector.value))
}

function formatearValorCelda(valor: unknown, columna: QueryColumn): string {
  if (valor == null) return '—'
  if (typeof valor !== 'number' || columna.format === 'year') {
    return String(valor)
  }

  const numeroFormateado = formateadorNumero.format(valor)
  if (columna.format === 'percent') return `${numeroFormateado}%`
  if (columna.format === 'age') return `${numeroFormateado} años`
  return numeroFormateado
}

const mensajeTablaVacia = computed(() => {
  if (props.loading) {
    return 'Cargando resultados…'
  }
  if (textoBusqueda.value.trim()) {
    return 'No hay resultados para esta búsqueda.'
  }
  if (props.selected === 'p6') {
    return 'Todavía no hay un resumen. Usa «Recalcular resumen» para generarlo.'
  }
  return 'Sin datos disponibles para esta consulta.'
})
</script>

<template>
  <TabsRoot :model-value="selected" class="query-explorer" @update:model-value="seleccionarPestana">
    <TabsList class="query-tabs" aria-label="Consultas analíticas">
      <TabsTrigger
        v-for="(consulta, indice) in queries"
        :key="consulta.key"
        :value="consulta.key"
        class="query-tab"
        :class="{ 'query-tab--active': selected === consulta.key }"
      >
        <span class="query-id">P{{ indice + 1 }}</span>
        <span class="query-tab-title">{{ consulta.title }}</span>
        <span v-if="selected === consulta.key && response" class="query-tab-count">
          {{ formateadorNumero.format(response.total) }}
        </span>
      </TabsTrigger>
    </TabsList>

    <TabsContent :value="selected" class="query-panel" :aria-busy="loading">
      <header class="query-panel-heading">
        <div>
          <div class="query-panel-title">
            <h3>{{ consultaActiva.title }}</h3>
            <span class="query-scope">{{ response?.scopeLabel ?? 'Cargando alcance…' }}</span>
          </div>
          <p>{{ consultaActiva.description }}</p>
        </div>

        <button
          v-if="selected === 'p6'"
          class="btn btn--ghost"
          type="button"
          :disabled="materializing || loading"
          @click="$emit('recalculate')"
        >
          <AppIcon name="refresh" :size="15" />
          {{ materializing ? 'Recalculando…' : 'Recalcular resumen' }}
        </button>
      </header>

      <div class="query-toolbar">
        <label class="query-search">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <span class="sr-only">Buscar en esta consulta</span>
          <input
            v-model="textoBusqueda"
            type="search"
            placeholder="Buscar en esta consulta…"
            @input="enviarBusquedaConRetraso(textoBusqueda, selected)"
          />
        </label>

        <label class="query-page-size">
          Filas por página
          <select :value="params.limite" @change="cambiarFilasPorPagina">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>

      <div
        class="table-wrap query-table-wrap"
        role="region"
        :aria-label="`Resultados: ${consultaActiva.title}`"
        tabindex="0"
      >
        <table class="table query-table">
          <caption class="sr-only">
            {{ consultaActiva.description }} {{ response?.scopeLabel }}
          </caption>
          <thead>
            <tr>
              <th
                v-for="columna in consultaActiva.columns"
                :key="columna.label"
                scope="col"
                :class="{ 'query-numeric': columna.format }"
                :aria-sort="obtenerAriaSort(columna)"
              >
                <button class="query-sort" type="button" @click="alternarOrdenColumna(columna)">
                  {{ columna.label }}
                  <span
                    class="query-sort-icon"
                    :class="{ 'query-sort-icon--active': Boolean(obtenerDireccionOrden(columna)) }"
                    aria-hidden="true"
                  >
                    {{ obtenerIconoOrden(columna) }}
                  </span>
                  <span class="sr-only">
                    : ordenar {{ obtenerDireccionOrden(columna) === 'asc' ? 'de mayor a menor' : 'de menor a mayor' }}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, indiceFila) in filas" :key="`${selected}-${response?.pagina}-${indiceFila}`">
              <td
                v-for="columna in consultaActiva.columns"
                :key="columna.key"
                :class="{ 'query-numeric': columna.format }"
              >
                {{ formatearValorCelda(fila[columna.key], columna) }}
              </td>
            </tr>
            <tr v-if="!filas.length">
              <td :colspan="consultaActiva.columns.length" class="table__empty">
                {{ mensajeTablaVacia }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="query-pagination">
        <p role="status" aria-live="polite">
          {{ formateadorNumero.format(response?.desde ?? 0) }}–{{ formateadorNumero.format(response?.hasta ?? 0) }}
          de {{ formateadorNumero.format(response?.total ?? 0) }} resultados
          <span v-if="textoBusqueda.trim()">
            · {{ formateadorNumero.format(response?.totalSinBusqueda ?? 0) }} en total
          </span>
        </p>

        <div class="query-page-controls">
          <button
            class="query-page-button"
            type="button"
            aria-label="Página anterior"
            :disabled="loading || response?.paginaAnterior == null"
            @click="irAPagina(response?.paginaAnterior)"
          >
            <AppIcon name="chevron" :size="15" class="query-previous" />
          </button>
          <span>
            Página <strong>{{ response?.pagina ?? params.pagina }}</strong> de {{ response?.paginas ?? 1 }}
          </span>
          <button
            class="query-page-button"
            type="button"
            aria-label="Página siguiente"
            :disabled="loading || response?.paginaSiguiente == null"
            @click="irAPagina(response?.paginaSiguiente)"
          >
            <AppIcon name="chevron" :size="15" />
          </button>
        </div>
      </footer>
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.query-explorer {
  margin-top: 20px;
  min-width: 0;
}

.query-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.query-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}

.query-tab:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.query-tab--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-text);
}

.query-tab--active:hover {
  background: var(--color-primary-soft);
}

.query-tab-title {
  font-size: 12px;
  font-weight: 500;
}

.query-id {
  flex-shrink: 0;
}

.query-tab-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.query-panel {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  min-width: 0;
}

.query-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  padding: 23px 24px 19px;
}

.query-panel-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.query-panel-title h3 {
  font-size: 16px;
  font-weight: 600;
}

.query-panel-heading p {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.query-scope {
  border: 1px solid var(--color-border);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10px;
  color: var(--color-text-muted);
}

.query-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 24px 20px;
}

.query-search {
  display: flex;
  align-items: center;
  gap: 9px;
  width: min(100%, 340px);
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.query-search:focus-within {
  border-color: var(--color-primary);
}

.query-search input {
  min-width: 0;
  width: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
}

.query-search input::placeholder {
  color: var(--color-text-muted);
}

.query-page-size {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.query-page-size select {
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.query-table-wrap {
  border-top: 1px solid var(--color-border);
}

.query-table {
  min-width: 520px;
}

.query-table th {
  padding: 0;
}

.query-table td {
  padding: 15px 24px;
}

.query-table td:not(.query-numeric) {
  min-width: 180px;
}

.query-sort {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  padding: 13px 24px;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 11px;
  white-space: nowrap;
  text-align: inherit;
}

.query-sort:hover {
  color: var(--color-text);
}

.query-sort-icon {
  opacity: 0.4;
}

.query-sort-icon--active {
  opacity: 1;
  color: var(--color-primary);
}

.query-table .query-numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.query-numeric .query-sort {
  justify-content: flex-end;
}

.query-table tbody tr:hover {
  background: var(--color-surface-muted);
}

.query-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.query-page-controls {
  display: flex;
  align-items: center;
  gap: 13px;
}

.query-page-controls strong {
  font-weight: 500;
  color: var(--color-text);
}

.query-page-button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface);
  color: var(--color-text);
}

.query-page-button:hover:not(:disabled) {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.query-page-button:disabled {
  opacity: 0.35;
}

.query-previous {
  transform: rotate(180deg);
}

@media (max-width: 1000px) {
  .query-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .query-table td {
    padding: 13px 16px;
  }

  .query-sort {
    padding: 13px 16px;
  }
}

@media (max-width: 540px) {
  .query-tab {
    flex-wrap: wrap;
    gap: 7px;
    padding: 11px;
  }

  .query-tab-title {
    width: 100%;
    order: 1;
    font-size: 11px;
  }

  .query-panel-heading {
    padding: 18px 16px;
  }

  .query-toolbar {
    padding: 0 16px 16px;
  }

  .query-search {
    width: 100%;
  }

  .query-pagination {
    padding: 14px 16px;
  }
}
</style>
