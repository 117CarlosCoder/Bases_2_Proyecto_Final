<script setup lang="ts">
import { computed, ref } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { useDebounceFn } from '@vueuse/core'
import AppIcon from './AppIcon.vue'
import { queries } from '@/config/dashboard-queries'
import type { QueryColumn } from '@/types/dashboard-query'
import type { ConsultaDashboard, ResultadoConsulta, ParametrosTabla } from '@/types/analytics'

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

const number = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 })
const active = computed(() => queries.find(query => query.key === props.selected)!)

const rows = computed<Record<string, unknown>[]>(() =>
  props.response?.items.map(row => ({ ...row })) ?? [],
)

const search = ref(props.params.buscar)
const submitSearch = useDebounceFn((value: string, consulta: ConsultaDashboard) => {
  if (consulta === props.selected && value === search.value && value !== props.params.buscar) {
    emit('search', value)
  }
}, 300)

function select(consulta: string | number) {
  if (consulta === props.selected) return
  search.value = ''
  emit('select', consulta as ConsultaDashboard)
}

function direction(column: QueryColumn) {
  if (props.params.ordenarPor === column.key) return props.params.direccion
  if (props.response?.ordenarPor === column.key) return props.response.direccion
}

function sort(column: QueryColumn) {
  emit('sort', column.key, direction(column) === 'asc' ? 'desc' : 'asc')
}

function goToPage(pagina: number | null | undefined) {
  if (pagina == null) return
  emit('page', pagina)
}

function changePageSize(event: Event) {
  const select = event.target as HTMLSelectElement
  emit('page-size', Number(select.value))
}

function format(value: unknown, column: QueryColumn): string {
  if (value == null) return '—'
  if (typeof value !== 'number' || column.format === 'year') return String(value)

  const text = number.format(value)
  if (column.format === 'percent') return `${text}%`
  if (column.format === 'age') return `${text} años`
  return text
}

</script>

<template>
  <TabsRoot :model-value="selected" class="query-explorer" @update:model-value="select">
    <TabsList class="query-tabs" aria-label="Consultas analíticas">
      <TabsTrigger
        v-for="(query, index) in queries" :key="query.key" :value="query.key"
        class="query-tab" :class="{ 'query-tab--active': selected === query.key }"
      >
        <span class="query-id">P{{ index + 1 }}</span>
        <span class="query-tab-title">{{ query.title }}</span>
        <span v-if="selected === query.key && response" class="query-tab-count">{{ number.format(response.total) }}</span>
      </TabsTrigger>
    </TabsList>

    <TabsContent :value="selected" class="query-panel" :aria-busy="loading">
      <header class="query-panel-heading">
        <div>
          <div class="query-panel-title"><h3>{{ active.title }}</h3><span class="query-scope">{{ response?.scopeLabel ?? 'Cargando alcance…' }}</span></div>
          <p>{{ active.description }}</p>
        </div>
        <button v-if="selected === 'p6'" class="btn btn--ghost" type="button" :disabled="materializing || loading" @click="$emit('recalculate')">
          <AppIcon name="refresh" :size="15" />{{ materializing ? 'Recalculando…' : 'Recalcular resumen' }}
        </button>
      </header>

      <div class="query-toolbar">
        <label class="query-search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <span class="sr-only">Buscar en esta consulta</span>
          <input v-model="search" type="search" placeholder="Buscar en esta consulta…" @input="submitSearch(search, selected)" />
        </label>
        <label class="query-page-size">Filas por página<select :value="params.limite" @change="changePageSize"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label>
      </div>

      <div class="table-wrap query-table-wrap" role="region" :aria-label="`Resultados: ${active.title}`" tabindex="0">
        <table class="table query-table">
          <caption class="sr-only">{{ active.description }} {{ response?.scopeLabel }}</caption>
          <thead>
            <tr>
              <th v-for="column in active.columns" :key="column.label" scope="col" :class="{ 'query-numeric': column.format }" :aria-sort="direction(column) === 'desc' ? 'descending' : direction(column) === 'asc' ? 'ascending' : 'none'">
                <button class="query-sort" type="button" @click="sort(column)">
                  {{ column.label }}<span class="query-sort-icon" :class="{ 'query-sort-icon--active': !!direction(column) }" aria-hidden="true">{{ !!direction(column) ? (direction(column) === 'desc' ? '↓' : '↑') : '↕' }}</span>
                  <span class="sr-only">: ordenar {{ direction(column) === 'asc' ? 'de mayor a menor' : 'de menor a mayor' }}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in rows" :key="`${selected}-${response?.pagina}-${rowIndex}`">
              <td v-for="column in active.columns" :key="column.key" :class="{ 'query-numeric': column.format }">{{ format(row[column.key], column) }}</td>
            </tr>
            <tr v-if="!rows.length"><td :colspan="active.columns.length" class="table__empty">
              {{ loading ? 'Cargando resultados…' : search.trim() ? 'No hay resultados para esta búsqueda.' : selected === 'p6' ? 'Todavía no hay un resumen. Usa «Recalcular resumen» para generarlo.' : 'Sin datos disponibles para esta consulta.' }}
            </td></tr>
          </tbody>
        </table>
      </div>

      <footer class="query-pagination">
        <p role="status" aria-live="polite">{{ number.format(response?.desde ?? 0) }}–{{ number.format(response?.hasta ?? 0) }} de {{ number.format(response?.total ?? 0) }} resultados<span v-if="search.trim()"> · {{ number.format(response?.totalSinBusqueda ?? 0) }} en total</span></p>
        <div class="query-page-controls">
          <button class="query-page-button" type="button" aria-label="Página anterior" :disabled="loading || response?.paginaAnterior == null" @click="goToPage(response?.paginaAnterior)"><AppIcon name="chevron" :size="15" class="query-previous" /></button>
          <span>Página <strong>{{ response?.pagina ?? params.pagina }}</strong> de {{ response?.paginas ?? 1 }}</span>
          <button class="query-page-button" type="button" aria-label="Página siguiente" :disabled="loading || response?.paginaSiguiente == null" @click="goToPage(response?.paginaSiguiente)"><AppIcon name="chevron" :size="15" /></button>
        </div>
      </footer>
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.query-explorer { margin-top: 20px; min-width: 0; }
.query-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
.query-tab { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 14px; border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text-muted); background: var(--color-surface); text-align: left; transition: background .15s, border-color .15s; }
.query-tab:hover { background: var(--color-surface-muted); color: var(--color-text); }
.query-tab--active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-text); }
.query-tab--active:hover { background: var(--color-primary-soft); }
.query-tab-title { font-size: 12px; font-weight: 500; }
.query-id { flex-shrink: 0; }
.query-tab-count { margin-left: auto; font-size: 11px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.query-panel { border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); min-width: 0; }
.query-panel-heading { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; padding: 23px 24px 19px; }
.query-panel-title { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.query-panel-title h3 { font-size: 16px; font-weight: 600; }
.query-panel-heading p { margin-top: 6px; font-size: 12px; color: var(--color-text-muted); }
.query-scope { border: 1px solid var(--color-border); padding: 3px 8px; border-radius: 5px; font-size: 10px; color: var(--color-text-muted); }
.query-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 0 24px 20px; }
.query-search { display: flex; align-items: center; gap: 9px; width: min(100%, 340px); padding: 9px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface-muted); color: var(--color-text-muted); }
.query-search:focus-within { border-color: var(--color-primary); }
.query-search input { min-width: 0; width: 100%; padding: 0; border: 0; outline: none; background: transparent; color: var(--color-text); font-size: 12px; }
.query-search input::placeholder { color: var(--color-text-muted); }
.query-page-size { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--color-text-muted); }
.query-page-size select { padding: 6px 9px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-surface-muted); color: var(--color-text); }
.query-table-wrap { border-top: 1px solid var(--color-border); }
.query-table { min-width: 520px; }
.query-table th { padding: 0; }
.query-table td { padding: 15px 24px; }
.query-table td:not(.query-numeric) { min-width: 180px; }
.query-sort { display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: 100%; padding: 13px 24px; border: 0; background: transparent; color: inherit; font-size: 11px; white-space: nowrap; text-align: inherit; }
.query-sort:hover { color: var(--color-text); }
.query-sort-icon { opacity: .4; }
.query-sort-icon--active { opacity: 1; color: var(--color-primary); }
.query-table .query-numeric { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.query-numeric .query-sort { justify-content: flex-end; }
.query-table tbody tr:hover { background: var(--color-surface-muted); }
.query-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 16px 24px; font-size: 11px; color: var(--color-text-muted); }
.query-page-controls { display: flex; align-items: center; gap: 13px; }
.query-page-controls strong { font-weight: 500; color: var(--color-text); }
.query-page-button { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-surface); color: var(--color-text); }
.query-page-button:hover:not(:disabled) { background: var(--color-primary-soft); color: var(--color-primary); }
.query-page-button:disabled { opacity: .35; }
.query-previous { transform: rotate(180deg); }
@media (max-width: 1000px) {
  .query-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .query-table td { padding: 13px 16px; }
  .query-sort { padding: 13px 16px; }
}
@media (max-width: 540px) {
  .query-tab { flex-wrap: wrap; gap: 7px; padding: 11px; }
  .query-tab-title { width: 100%; order: 1; font-size: 11px; }
  .query-panel-heading { padding: 18px 16px; }
  .query-toolbar { padding: 0 16px 16px; }
  .query-search { width: 100%; }
  .query-pagination { padding: 14px 16px; }
}
</style>
