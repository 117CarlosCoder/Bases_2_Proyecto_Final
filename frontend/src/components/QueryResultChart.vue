<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Chart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import 'hammerjs'
import type { ChartOptions } from 'chart.js'
import type { DashboardQuery, FilaConsulta, QueryColumn } from '@/types/analytics'

ChartJS.register(CategoryScale, LinearScale, LineController, BarController, DoughnutController, LineElement, PointElement, BarElement, ArcElement, Filler, Tooltip, Legend, zoomPlugin)

export type ModoVisualizacionConsulta = 'bar' | 'horizontalBar' | 'line' | 'area' | 'doughnut' | 'none'

const props = defineProps<{
  query: DashboardQuery
  rows: FilaConsulta[]
  scopeLabel?: string
}>()

const tipoGrafica = ref<ModoVisualizacionConsulta>('none')
const metricaSeleccionada = ref<string>('auto')
const graficaRef = ref<{ chart: ChartJS | null } | null>(null)

const paletaColores = [
  { border: '#3366ff', bg: 'rgba(51, 102, 255, 0.78)', area: 'rgba(51, 102, 255, 0.18)' },
  { border: '#00c98d', bg: 'rgba(0, 201, 141, 0.78)', area: 'rgba(0, 201, 141, 0.18)' },
  { border: '#ff7a59', bg: 'rgba(255, 122, 89, 0.78)', area: 'rgba(255, 122, 89, 0.18)' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.78)', area: 'rgba(139, 92, 246, 0.18)' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.78)', area: 'rgba(245, 158, 11, 0.18)' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.78)', area: 'rgba(6, 182, 212, 0.18)' },
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.78)', area: 'rgba(236, 72, 153, 0.18)' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.78)', area: 'rgba(16, 185, 129, 0.18)' },
]

const columnasDimension = computed<QueryColumn[]>(() => {
  return props.query.columns.filter(
    col => !col.format || col.format === 'year' || (col.format === 'age' && props.query.key === 'p13') || (col.key === 'mes_asignacion' && props.query.key === 'p9'),
  )
})

const columnasMetricas = computed<QueryColumn[]>(() => {
  if (props.query.key === 'p11') {
    return [
      { key: '__aprobados_p11', label: 'Aprobados (página)', format: 'number' },
      { key: '__reprobados_p11', label: 'No aprobados (página)', format: 'number' },
      { key: 'numero_evaluacion', label: 'Intento por fila', format: 'number' },
    ]
  }
  return props.query.columns.filter(
    col => Boolean(col.format) && col.format !== 'year' && !(col.format === 'age' && props.query.key === 'p13') && !(col.key === 'mes_asignacion' && props.query.key === 'p9'),
  )
})

const columnasConteoComparables = computed<QueryColumn[]>(() => {
  if (props.query.key === 'p11') {
    return columnasMetricas.value.slice(0, 2)
  }
  return columnasMetricas.value.filter(col => col.format === 'number')
})

const permiteModoAuto = computed(() => columnasConteoComparables.value.length > 1)

watch(
  () => props.query.key,
  () => {
    tipoGrafica.value = 'none'
    metricaSeleccionada.value = permiteModoAuto.value ? 'auto' : (columnasMetricas.value[0]?.key ?? 'auto')
  },
  { immediate: true },
)

function truncarTexto(texto: string, max = 28): string {
  if (texto.length <= max) return texto
  return `${texto.slice(0, max - 1)}…`
}

function construirEtiquetaFila(fila: FilaConsulta, indice: number): string {
  const dims = columnasDimension.value
  if (!dims.length) return `Fila ${indice + 1}`

  const partes = dims
    .map(col => {
      const val = fila[col.key]
      if (val == null || val === '') return null
      if (col.format === 'age') return `${val} años`
      if (col.key === 'mes_asignacion') return `Mes ${val}`
      return String(val)
    })
    .filter((val): val is string => Boolean(val))

  if (!partes.length) return `Fila ${indice + 1}`
  return truncarTexto(partes.join(' · '), 34)
}

const datosAgrupadosP11 = computed(() => {
  const mapa = new Map<string, { aprobados: number; reprobados: number }>()
  for (const fila of props.rows) {
    const materia = String(fila.materia_evaluada ?? 'SIN MATERIA')
    const actual = mapa.get(materia) ?? { aprobados: 0, reprobados: 0 }
    const resultado = String(fila.resultado_evaluacion ?? '').toUpperCase()
    if (resultado === 'APROBADO') {
      actual.aprobados += 1
    } else {
      actual.reprobados += 1
    }
    mapa.set(materia, actual)
  }
  return Array.from(mapa.entries()).map(([materia, conteos]) => ({
    label: materia,
    __aprobados_p11: conteos.aprobados,
    __reprobados_p11: conteos.reprobados,
  }))
})

const etiquetasEje = computed<string[]>(() => {
  if (props.query.key === 'p11' && metricaSeleccionada.value !== 'numero_evaluacion') {
    return datosAgrupadosP11.value.map(item => item.label)
  }
  return props.rows.map((fila, idx) => construirEtiquetaFila(fila, idx))
})

const columnasActivasGrafica = computed<QueryColumn[]>(() => {
  if (tipoGrafica.value === 'doughnut') {
    if (metricaSeleccionada.value !== 'auto') {
      const encontrada = columnasMetricas.value.find(c => c.key === metricaSeleccionada.value)
      if (encontrada) return [encontrada]
    }
    return columnasMetricas.value.slice(0, 1)
  }

  if (metricaSeleccionada.value === 'auto') {
    if (columnasConteoComparables.value.length > 0) {
      return columnasConteoComparables.value
    }
    return columnasMetricas.value.slice(0, 1)
  }

  const seleccionada = columnasMetricas.value.find(col => col.key === metricaSeleccionada.value)
  return seleccionada ? [seleccionada] : columnasMetricas.value.slice(0, 1)
})

function extraerValoresColumna(claveColumna: string): number[] {
  if (props.query.key === 'p11' && (claveColumna === '__aprobados_p11' || claveColumna === '__reprobados_p11')) {
    return datosAgrupadosP11.value.map(item => Number(item[claveColumna] ?? 0))
  }
  return props.rows.map(fila => {
    const bruto = fila[claveColumna]
    const numero = typeof bruto === 'number' ? bruto : Number(bruto ?? 0)
    return Number.isFinite(numero) ? numero : 0
  })
}

const tipoChartJs = computed<'bar' | 'line' | 'doughnut'>(() => {
  if (tipoGrafica.value === 'doughnut') return 'doughnut'
  if (tipoGrafica.value === 'line' || tipoGrafica.value === 'area') return 'line'
  return 'bar'
})

const claveRenderGrafica = computed(() => {
  const primera = etiquetasEje.value[0] ?? ''
  const ultima = etiquetasEje.value[etiquetasEje.value.length - 1] ?? ''
  return `${props.query.key}-${tipoGrafica.value}-${metricaSeleccionada.value}-${etiquetasEje.value.length}-${primera}-${ultima}`
})

const datosChartJs = computed(() => {
  const labels = etiquetasEje.value
  const esArea = tipoGrafica.value === 'area'
  const esDona = tipoGrafica.value === 'doughnut'
  const esBarra = tipoGrafica.value === 'bar' || tipoGrafica.value === 'horizontalBar'

  if (esDona) {
    const col = columnasActivasGrafica.value[0]
    const data = col ? extraerValoresColumna(col.key) : []
    return {
      labels,
      datasets: [
        {
          label: col?.label ?? 'Valor',
          data,
          backgroundColor: labels.map((_, idx) => paletaColores[idx % paletaColores.length]!.bg),
          borderColor: labels.map((_, idx) => paletaColores[idx % paletaColores.length]!.border),
          borderWidth: 1.5,
        },
      ],
    }
  }

  return {
    labels,
    datasets: columnasActivasGrafica.value.map((col, idx) => {
      const tono = paletaColores[idx % paletaColores.length]!
      return {
        label: col.label,
        data: extraerValoresColumna(col.key),
        borderColor: tono.border,
        backgroundColor: esArea ? tono.area : (esBarra ? tono.bg : tono.border),
        fill: esArea,
        tension: 0.3,
        borderWidth: esBarra ? 1 : 2,
        borderRadius: esBarra ? 4 : 0,
        maxBarThickness: 28,
      }
    }),
  }
})

const opcionesChartJs = computed<ChartOptions>(() => {
  void claveRenderGrafica.value
  if (tipoGrafica.value === 'doughnut') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      locale: 'es-GT',
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { boxWidth: 12, font: { size: 11 } },
        },
      },
    }
  }

  const esHorizontal = tipoGrafica.value === 'horizontalBar'
  return {
    responsive: true,
    maintainAspectRatio: false,
    locale: 'es-GT',
    indexAxis: esHorizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: esHorizontal },
        beginAtZero: esHorizontal,
        ticks: {
          autoSkip: !esHorizontal && etiquetasEje.value.length > 10,
          maxRotation: esHorizontal ? 0 : 25,
          font: { size: 11 },
        },
      },
      y: {
        grid: { display: !esHorizontal },
        beginAtZero: !esHorizontal,
        ticks: {
          font: { size: 11 },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      zoom: {
        limits: {
          x: { min: 'original', max: 'original' },
        },
        pan: { enabled: !esHorizontal, mode: 'x' },
        zoom: {
          wheel: { enabled: !esHorizontal },
          pinch: { enabled: !esHorizontal },
          mode: 'x',
        },
      },
    },
  }
})

function restablecerZoom() {
  graficaRef.value?.chart?.resetZoom()
}
</script>

<template>
  <div class="query-chart-wrapper">
    <div class="query-chart-header">
      <div class="query-chart-legend">
        <strong class="query-chart-subtitle">Representación visual ({{ etiquetasEje.length }} elementos en vista)</strong>
        <template v-if="tipoGrafica !== 'none' && tipoGrafica !== 'doughnut'">
          <span
            v-for="(col, idx) in columnasActivasGrafica"
            :key="col.key"
            class="legend-item"
          >
            <i class="legend-dot" :style="{ background: paletaColores[idx % paletaColores.length]?.border }" />
            {{ col.label }}
          </span>
        </template>
      </div>

      <div class="query-chart-controls">
        <label v-if="columnasMetricas.length > 1 && tipoGrafica !== 'none'" class="chart-control-label">
          <span>Métrica</span>
          <select v-model="metricaSeleccionada">
            <option v-if="permiteModoAuto && tipoGrafica !== 'doughnut'" value="auto">
              Comparar conteos
            </option>
            <option v-for="col in columnasMetricas" :key="col.key" :value="col.key">
              {{ col.label }}
            </option>
          </select>
        </label>

        <button
          v-if="tipoGrafica !== 'none' && tipoGrafica !== 'doughnut' && tipoGrafica !== 'horizontalBar'"
          class="zoom-reset-btn"
          type="button"
          @click="restablecerZoom"
        >
          Restablecer zoom
        </button>

        <label class="chart-control-label">
          <span>Vista</span>
          <select v-model="tipoGrafica">
            <option value="none">Solo tabla</option>
            <option value="bar">Barras verticales</option>
            <option value="horizontalBar">Barras horizontales</option>
            <option value="line">Líneas</option>
            <option value="area">Áreas</option>
            <option value="doughnut">Dona / Proporción</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="tipoGrafica !== 'none' && etiquetasEje.length > 0" class="query-chart-canvas">
      <Chart
        ref="graficaRef"
        :key="claveRenderGrafica"
        :type="tipoChartJs"
        :data="datosChartJs"
        :options="opcionesChartJs"
      />
    </div>
  </div>
</template>

<style scoped>
.query-chart-wrapper {
  padding: 16px 24px 18px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.query-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.query-chart-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.query-chart-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.query-chart-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-control-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.zoom-reset-btn,
.chart-control-label select {
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 11px;
  cursor: pointer;
}

.query-chart-canvas {
  position: relative;
  height: 270px;
  width: 100%;
  margin-top: 14px;
}

@media (max-width: 540px) {
  .query-chart-wrapper {
    padding: 14px 16px;
  }
}
</style>
