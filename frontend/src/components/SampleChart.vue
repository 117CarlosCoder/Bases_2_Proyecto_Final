<script setup lang="ts">
import { computed, ref } from 'vue'
import { Chart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, LineController, BarController, LineElement, PointElement, BarElement, Filler, Tooltip } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import 'hammerjs'
import type { ChartOptions } from 'chart.js'
import type { PuntoSerieDashboard, ResumenMensualDashboard } from '@/types/analytics'

ChartJS.register(CategoryScale, LinearScale, LineController, BarController, LineElement, PointElement, BarElement, Filler, Tooltip, zoomPlugin)

const props = defineProps<{
  months: ResumenMensualDashboard[]
  year: string
  points?: PuntoSerieDashboard[]
  title?: string
  periodLabel?: string
}>()

const etiquetasMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const tipoGrafica = ref<'line' | 'bar' | 'area'>('line')
const graficaRef = ref<{ chart: ChartJS | null } | null>(null)

const puntosSerie = computed<PuntoSerieDashboard[]>(() => {
  if (props.points && props.points.length > 0) return props.points
  return props.months.map((mes, idx) => ({
    label: etiquetasMeses[idx] ?? `Mes ${idx + 1}`,
    total: mes.total,
    approved: mes.approved,
  }))
})

const modoChartJs = computed(() => (tipoGrafica.value === 'bar' ? 'bar' : 'line'))

const claveGrafica = computed(() => {
  const primera = puntosSerie.value[0]?.label ?? ''
  const ultima = puntosSerie.value[puntosSerie.value.length - 1]?.label ?? ''
  return `${modoChartJs.value}-${props.year}-${props.periodLabel ?? ''}-${puntosSerie.value.length}-${primera}-${ultima}`
})

function construirSerie(label: string, data: number[], borderColor: string, fillRgba: string) {
  const esArea = tipoGrafica.value === 'area'
  const esBarra = tipoGrafica.value === 'bar'
  return {
    label,
    data,
    borderColor,
    backgroundColor: esArea ? fillRgba : borderColor,
    fill: esArea,
    tension: 0.3,
    borderWidth: esBarra ? 0 : 2,
    borderRadius: 3,
    maxBarThickness: 26,
  }
}

const datosGrafica = computed(() => ({
  labels: puntosSerie.value.map(p => p.label),
  datasets: [
    construirSerie('Total', puntosSerie.value.map(p => p.total), '#3366ff', 'rgba(51, 102, 255, 0.16)'),
    construirSerie('Aprobadas', puntosSerie.value.map(p => p.approved), '#00c98d', 'rgba(0, 201, 141, 0.16)'),
  ],
}))

const opcionesGrafica = computed<ChartOptions<'line' | 'bar'>>(() => {
  void claveGrafica.value
  const totalPuntos = puntosSerie.value.length
  return {
    responsive: true,
    maintainAspectRatio: false,
    locale: 'es-GT',
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: totalPuntos > 12,
          maxRotation: 0,
        },
      },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
    plugins: {
      zoom: {
        limits: {
          x: { min: 'original', max: 'original' },
        },
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
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
  <div class="chart">
    <div class="chart-subheading">
      <strong>{{ title ?? 'Evaluaciones por mes' }}</strong>
      <div class="chart-display-controls">
        <div class="legend">
          <span><i class="dot dot--blue" />Total</span>
          <span><i class="dot dot--green" />Aprobadas</span>
        </div>
        <button class="zoom-reset-btn" type="button" @click="restablecerZoom">
          Restablecer zoom
        </button>
        <label class="chart-type">
          <span class="sr-only">Tipo de gráfica</span>
          <select v-model="tipoGrafica">
            <option value="line">Líneas</option>
            <option value="bar">Barras</option>
            <option value="area">Áreas</option>
          </select>
        </label>
      </div>
    </div>

    <div class="chart-canvas">
      <Chart ref="graficaRef" :key="claveGrafica" :type="modoChartJs" :data="datosGrafica" :options="opcionesGrafica" />
    </div>
  </div>
</template>

<style scoped>
.chart-subheading {
  flex-wrap: wrap;
}

.chart-display-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.zoom-reset-btn,
.chart-type select {
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 11px;
  cursor: pointer;
}

.chart-canvas {
  position: relative;
  height: 280px;
  width: 100%;
  margin-top: 14px;
}
</style>
