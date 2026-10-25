<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMutationObserver, usePreferredReducedMotion } from '@vueuse/core'
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineController, BarController,
  LineElement, PointElement, BarElement, Filler, Tooltip,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, LineController, BarController, LineElement, PointElement, BarElement, Filler, Tooltip)

const props = defineProps<{
  months: { total: number; approved: number }[]
  year: string
  points?: { label: string; total: number; approved: number }[]
  title?: string
  periodLabel?: string
}>()
const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const points = computed(() => props.points ?? props.months.map((point, i) => ({ ...point, label: monthLabels[i]! })))
const scope = computed(() => props.periodLabel ?? props.year)
const chartType = ref<'line' | 'bar' | 'area'>('line')
const chartKind = computed(() => chartType.value === 'bar' ? 'bar' : 'line')
const typeLabel = computed(() => ({ line: 'líneas', bar: 'barras', area: 'áreas' })[chartType.value])
const active = ref<number | null>(null)
const detail = computed(() => active.value === null ? null : points.value[active.value])
const palette = ref({ text: '#78849d', grid: '#edf0f5', surface: '#ffffff', foreground: '#2e3a59' })
const reducedMotion = usePreferredReducedMotion()
const htmlRoot = ref<HTMLElement>()

const chartData = computed(() => ({
  labels: points.value.map(point => point.label),
  datasets: (['total', 'approved'] as const).map((key, index) => ({
    label: index === 0 ? 'Total' : 'Aprobadas',
    data: points.value.map(point => point[key]),
    borderColor: index === 0 ? '#3366ff' : '#00c98d',
    backgroundColor: chartType.value === 'area'
      ? (index === 0 ? 'rgba(51, 102, 255, .16)' : 'rgba(0, 201, 141, .16)')
      : (index === 0 ? '#3366ff' : '#00c98d'),
    fill: chartType.value === 'area',
    tension: .3,
    borderWidth: chartType.value === 'bar' ? 0 : 2,
    borderRadius: 3,
    maxBarThickness: 26,
    pointRadius: points.value.length === 1 ? 4 : 0,
    pointHoverRadius: 5,
    pointHitRadius: 12,
  })),
}))

const chartOptions = computed<ChartOptions<'line' | 'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  locale: 'es-GT',
  font: { family: "'General Sans', 'Segoe UI', sans-serif" },
  animation: reducedMotion.value === 'reduce' ? false : { duration: 200 },
  interaction: { mode: 'index', intersect: false },
  onHover: (_event, elements) => { active.value = elements[0]?.index ?? null },
  onClick: (_event, elements) => { active.value = elements[0]?.index ?? null },
  plugins: {
    tooltip: {
      backgroundColor: palette.value.surface,
      titleColor: palette.value.foreground,
      bodyColor: palette.value.text,
      borderColor: palette.value.grid,
      borderWidth: 1,
      padding: 12,
      callbacks: { title: items => `${items[0]?.label ?? ''} · ${scope.value}` },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: palette.value.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 12, font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 4,
      border: { display: false },
      grid: { color: palette.value.grid },
      ticks: { color: palette.value.text, precision: 0, maxTicksLimit: 5, font: { size: 11 } },
    },
  },
}))

function readTheme() {
  const styles = getComputedStyle(document.documentElement)
  palette.value = {
    text: styles.getPropertyValue('--color-text-muted').trim(),
    grid: styles.getPropertyValue('--color-border').trim(),
    surface: styles.getPropertyValue('--color-surface').trim(),
    foreground: styles.getPropertyValue('--color-text').trim(),
  }
}
useMutationObserver(htmlRoot, readTheme, { attributes: true, attributeFilter: ['data-theme'] })
onMounted(() => {
  htmlRoot.value = document.documentElement
  readTheme()
})
watch([() => props.year, () => props.points, chartType], () => { active.value = null })
</script>

<template>
  <div class="chart" @mouseleave="active = null">
    <div class="chart-subheading">
      <strong>{{ title ?? 'Evaluaciones por mes' }}</strong>
      <div class="chart-display-controls">
        <div class="legend"><span><i class="dot dot--blue" />Total</span><span><i class="dot dot--green" />Aprobadas</span></div>
        <label class="chart-type">
          <span class="sr-only">Tipo de gráfica</span>
          <select v-model="chartType"><option value="line">Líneas</option><option value="bar">Barras</option><option value="area">Áreas</option></select>
        </label>
      </div>
    </div>
    <div class="chart-canvas">
      <Chart :key="chartKind" :type="chartKind" :data="chartData" :options="chartOptions" role="img" :aria-label="`Gráfica de ${typeLabel}. Evaluaciones: ${scope}. Los valores están disponibles en Ver datos de la gráfica.`" />
    </div>
    <div class="chart-detail" aria-live="polite"><template v-if="detail"><strong>{{ detail.label }} · {{ scope }}</strong><span>{{ detail.total.toLocaleString('es-GT') }} evaluaciones</span><span>{{ detail.approved.toLocaleString('es-GT') }} aprobadas</span></template><span v-else>Pasa sobre la gráfica para ver los valores del periodo.</span></div>
    <details class="chart-values">
      <summary>Ver datos de la gráfica</summary>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Evaluaciones: {{ scope }}</caption>
          <thead><tr><th scope="col">Periodo</th><th scope="col">Total</th><th scope="col">Aprobadas</th></tr></thead>
          <tbody><tr v-for="(point, index) in points" :key="index"><th scope="row">{{ point.label }}</th><td>{{ point.total.toLocaleString('es-GT') }}</td><td>{{ point.approved.toLocaleString('es-GT') }}</td></tr></tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style scoped>
.chart-subheading { flex-wrap: wrap; }
.chart-display-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; }
.chart-type select { padding: 6px 9px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-surface-muted); color: var(--color-text); font-size: 11px; }
.chart-canvas { position: relative; height: 280px; width: 100%; margin-top: 14px; }
.chart-values { margin-top: 8px; font-size: 11px; color: var(--color-text-muted); }
.chart-values summary { width: fit-content; cursor: pointer; }
.chart-values .table-wrap { margin-top: 10px; max-height: 280px; overflow: auto; }
.chart-values .table th[scope='row'] { font-weight: 400; color: var(--color-text); background: transparent; }
@media (max-width: 700px) {
  .chart-display-controls { width: 100%; justify-content: space-between; gap: 10px; }
  .chart-canvas { height: 240px; }
}
</style>
