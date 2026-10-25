<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMutationObserver, usePreferredReducedMotion } from '@vueuse/core'
import { Chart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, LineController, BarController, LineElement, PointElement, BarElement, Filler, Tooltip } from 'chart.js'
import type { ChartOptions } from 'chart.js'
import type { PuntoSerieDashboard, ResumenMensualDashboard } from '@/types/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  BarController,
  LineElement,
  PointElement,
  BarElement,
  Filler,
  Tooltip,
)

const props = defineProps<{
  months: ResumenMensualDashboard[]
  year: string
  points?: PuntoSerieDashboard[]
  title?: string
  periodLabel?: string
}>()

const etiquetasMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const puntosTotales = computed<PuntoSerieDashboard[]>(() => {
  if (props.points) {
    return props.points
  }
  return props.months.map((mes, indice) => ({
    label: etiquetasMeses[indice] ?? `Mes ${indice + 1}`,
    total: mes.total,
    approved: mes.approved,
  }))
})

const MINIMO_PUNTOS_VISIBLES = 4

const inicioVentana = ref(0)
const finVentana = ref(puntosTotales.value.length)
const indiceActivo = ref<number | null>(null)
const tipoGrafica = ref<'line' | 'bar' | 'area'>('line')

const puntosVisibles = computed(() => {
  return puntosTotales.value.slice(inicioVentana.value, finVentana.value)
})

const tieneZoomActivo = computed(() => {
  return inicioVentana.value > 0 || finVentana.value < puntosTotales.value.length
})

const etiquetaAlcance = computed(() => props.periodLabel ?? props.year)
const modoChartJs = computed(() => (tipoGrafica.value === 'bar' ? 'bar' : 'line'))

const nombreTipoGrafica = computed(() => {
  if (tipoGrafica.value === 'bar') return 'barras'
  if (tipoGrafica.value === 'area') return 'áreas'
  return 'líneas'
})

const puntoSeleccionado = computed(() => {
  if (indiceActivo.value === null) return null
  return puntosVisibles.value[indiceActivo.value] ?? null
})

const coloresTema = ref({
  text: '#78849d',
  grid: '#edf0f5',
  surface: '#ffffff',
  foreground: '#2e3a59',
})

const movimientoReducido = usePreferredReducedMotion()
const elementoRaizHtml = ref<HTMLElement>()

function ajustarVentanaZoom(nuevoInicio: number, nuevoFin: number) {
  const totalPuntos = puntosTotales.value.length
  const cantidadSolicitada = nuevoFin - nuevoInicio
  const anchoSeguro = Math.max(MINIMO_PUNTOS_VISIBLES, Math.min(totalPuntos, cantidadSolicitada))
  const inicioSeguro = Math.max(0, Math.min(totalPuntos - anchoSeguro, nuevoInicio))

  inicioVentana.value = inicioSeguro
  finVentana.value = inicioSeguro + anchoSeguro
  indiceActivo.value = null
}

function acercarZoom() {
  const anchoActual = finVentana.value - inicioVentana.value
  if (anchoActual <= MINIMO_PUNTOS_VISIBLES) return

  const reduccion = Math.max(2, Math.round(anchoActual * 0.25))
  const nuevoAncho = Math.max(MINIMO_PUNTOS_VISIBLES, anchoActual - reduccion)
  const centroLocal = indiceActivo.value ?? Math.floor(anchoActual / 2)
  const proporcionCentro = anchoActual > 0 ? centroLocal / anchoActual : 0.5
  const nuevoInicio = inicioVentana.value + Math.round((anchoActual - nuevoAncho) * proporcionCentro)

  ajustarVentanaZoom(nuevoInicio, nuevoInicio + nuevoAncho)
}

function alejarZoom() {
  const totalPuntos = puntosTotales.value.length
  const anchoActual = finVentana.value - inicioVentana.value
  if (anchoActual >= totalPuntos) return

  const aumento = Math.max(2, Math.round(anchoActual * 0.35))
  const nuevoAncho = Math.min(totalPuntos, anchoActual + aumento)
  const nuevoInicio = inicioVentana.value - Math.floor((nuevoAncho - anchoActual) / 2)

  ajustarVentanaZoom(nuevoInicio, nuevoInicio + nuevoAncho)
}

function desplazarVentana(paso: number) {
  ajustarVentanaZoom(inicioVentana.value + paso, finVentana.value + paso)
}

function restablecerZoom() {
  inicioVentana.value = 0
  finVentana.value = puntosTotales.value.length
  indiceActivo.value = null
}

function manejarRuedaMouse(event: WheelEvent) {
  if (puntosTotales.value.length <= MINIMO_PUNTOS_VISIBLES) return
  if (event.deltaY < 0) {
    acercarZoom()
  } else if (event.deltaY > 0) {
    alejarZoom()
  }
}

function crearConfiguracionSerie(
  etiqueta: string,
  valores: number[],
  colorBorde: string,
  colorRellenoArea: string,
) {
  const esArea = tipoGrafica.value === 'area'
  const esBarra = tipoGrafica.value === 'bar'
  const unSoloPunto = puntosVisibles.value.length === 1

  return {
    label: etiqueta,
    data: valores,
    borderColor: colorBorde,
    backgroundColor: esArea ? colorRellenoArea : colorBorde,
    fill: esArea,
    tension: 0.3,
    borderWidth: esBarra ? 0 : 2,
    borderRadius: 3,
    maxBarThickness: 26,
    pointRadius: unSoloPunto ? 4 : 0,
    pointHoverRadius: 5,
    pointHitRadius: 12,
  }
}

const datosGrafica = computed(() => {
  const etiquetas = puntosVisibles.value.map(punto => punto.label)
  const valoresTotales = puntosVisibles.value.map(punto => punto.total)
  const valoresAprobados = puntosVisibles.value.map(punto => punto.approved)

  return {
    labels: etiquetas,
    datasets: [
      crearConfiguracionSerie('Total', valoresTotales, '#3366ff', 'rgba(51, 102, 255, 0.16)'),
      crearConfiguracionSerie('Aprobadas', valoresAprobados, '#00c98d', 'rgba(0, 201, 141, 0.16)'),
    ],
  }
})

const opcionesGrafica = computed<ChartOptions<'line' | 'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  locale: 'es-GT',
  font: { family: "'General Sans', 'Segoe UI', sans-serif" },
  animation: movimientoReducido.value === 'reduce' ? false : { duration: 200 },
  interaction: { mode: 'index', intersect: false },
  onHover: (_event, elementos) => {
    indiceActivo.value = elementos[0]?.index ?? null
  },
  onClick: (_event, elementos) => {
    indiceActivo.value = elementos[0]?.index ?? null
  },
  plugins: {
    tooltip: {
      backgroundColor: coloresTema.value.surface,
      titleColor: coloresTema.value.foreground,
      bodyColor: coloresTema.value.text,
      borderColor: coloresTema.value.grid,
      borderWidth: 1,
      padding: 12,
      callbacks: {
        title: elementos => `${elementos[0]?.label ?? ''} · ${etiquetaAlcance.value}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: coloresTema.value.text,
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12,
        font: { size: 11 },
      },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 4,
      border: { display: false },
      grid: { color: coloresTema.value.grid },
      ticks: {
        color: coloresTema.value.text,
        precision: 0,
        maxTicksLimit: 5,
        font: { size: 11 },
      },
    },
  },
}))

function actualizarColoresTema() {
  const estilos = getComputedStyle(document.documentElement)
  coloresTema.value = {
    text: estilos.getPropertyValue('--color-text-muted').trim(),
    grid: estilos.getPropertyValue('--color-border').trim(),
    surface: estilos.getPropertyValue('--color-surface').trim(),
    foreground: estilos.getPropertyValue('--color-text').trim(),
  }
}

useMutationObserver(elementoRaizHtml, actualizarColoresTema, {
  attributes: true,
  attributeFilter: ['data-theme'],
})

onMounted(() => {
  elementoRaizHtml.value = document.documentElement
  actualizarColoresTema()
})

watch(
  puntosTotales,
  nuevaLista => {
    inicioVentana.value = 0
    finVentana.value = nuevaLista.length
    indiceActivo.value = null
  },
  { immediate: true },
)

watch([() => props.year, tipoGrafica], () => {
  indiceActivo.value = null
})
</script>

<template>
  <div class="chart" @mouseleave="indiceActivo = null">
    <div class="chart-subheading">
      <strong>{{ title ?? 'Evaluaciones por mes' }}</strong>

      <div class="chart-display-controls">
        <div class="legend">
          <span><i class="dot dot--blue" />Total</span>
          <span><i class="dot dot--green" />Aprobadas</span>
        </div>

        <div class="zoom-controls" role="group" aria-label="Controles de zoom de la gráfica">
          <button
            class="zoom-btn"
            type="button"
            title="Desplazar a la izquierda"
            :disabled="inicioVentana <= 0"
            @click="desplazarVentana(-3)"
          >
            ‹
          </button>
          <button
            class="zoom-btn"
            type="button"
            title="Acercar"
            :disabled="finVentana - inicioVentana <= MINIMO_PUNTOS_VISIBLES"
            @click="acercarZoom"
          >
            +
          </button>
          <button
            class="zoom-btn"
            type="button"
            title="Alejar"
            :disabled="!tieneZoomActivo"
            @click="alejarZoom"
          >
            −
          </button>
          <button
            class="zoom-btn"
            type="button"
            title="Desplazar a la derecha"
            :disabled="finVentana >= puntosTotales.length"
            @click="desplazarVentana(3)"
          >
            ›
          </button>
          <button
            v-if="tieneZoomActivo"
            class="zoom-btn zoom-btn--reset"
            type="button"
            @click="restablecerZoom"
          >
            Ver todo
          </button>
        </div>

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

    <div class="chart-canvas" @wheel.prevent="manejarRuedaMouse">
      <Chart
        :key="modoChartJs"
        :type="modoChartJs"
        :data="datosGrafica"
        :options="opcionesGrafica"
        role="img"
        :aria-label="`Gráfica de ${nombreTipoGrafica}. Evaluaciones: ${etiquetaAlcance}. Los valores están disponibles en Ver datos de la gráfica.`"
      />
    </div>

    <div class="chart-detail" aria-live="polite">
      <template v-if="puntoSeleccionado">
        <strong>{{ puntoSeleccionado.label }} · {{ etiquetaAlcance }}</strong>
        <span>{{ puntoSeleccionado.total.toLocaleString('es-GT') }} evaluaciones</span>
        <span>{{ puntoSeleccionado.approved.toLocaleString('es-GT') }} aprobadas</span>
      </template>
    </div>

    <details class="chart-values">
      <summary>Ver datos de la gráfica</summary>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Evaluaciones: {{ etiquetaAlcance }}</caption>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col">Total</th>
              <th scope="col">Aprobadas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(punto, indice) in puntosVisibles" :key="indice">
              <th scope="row">{{ punto.label }}</th>
              <td>{{ punto.total.toLocaleString('es-GT') }}</td>
              <td>{{ punto.approved.toLocaleString('es-GT') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
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

.zoom-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.zoom-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.zoom-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.zoom-btn--reset {
  padding: 4px 9px;
  font-size: 11px;
}

.chart-type select {
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 11px;
}

.chart-canvas {
  position: relative;
  height: 280px;
  width: 100%;
  margin-top: 14px;
}

.chart-values {
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.chart-values summary {
  width: fit-content;
  cursor: pointer;
}

.chart-values .table-wrap {
  margin-top: 10px;
  max-height: 280px;
  overflow: auto;
}

.chart-values .table th[scope='row'] {
  font-weight: 400;
  color: var(--color-text);
  background: transparent;
}

@media (max-width: 700px) {
  .chart-display-controls {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }

  .chart-canvas {
    height: 240px;
  }
}
</style>
