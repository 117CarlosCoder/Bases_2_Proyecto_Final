<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SampleChart from '@/components/SampleChart.vue'
import DashboardQueryExplorer from '@/components/DashboardQueryExplorer.vue'
import DashboardPeriodFilter from '@/components/DashboardPeriodFilter.vue'
import { getAnalyticsQuery, getDashboardPeriod, getDashboardSummary, materializeCareerSummary } from '@/services/analytics.service'
import type { CalendarioDashboard, ConsultaDashboard, DashboardPeriod, ParametrosTabla, ResultadoConsulta, ResumenAnualDashboard, ResumenPeriodoDashboard, SeleccionPeriodo } from '@/types/analytics'

const aniosDisponibles = ref<string[]>([])
const anioSeleccionado = ref('')
const periodo = ref<DashboardPeriod>('year')
const mes = ref(1)
const semana = ref('')
const dia = ref('')
const calendario = ref<CalendarioDashboard | null>(null)

const resumenAnual = ref<ResumenAnualDashboard>({
  year: 'Sin datos',
  total: 0,
  approved: 0,
  applicants: 0,
  careers: 0,
  approvalPercentage: 0,
  periodLabel: 'Sin datos',
  months: Array.from({ length: 12 }, () => ({ total: 0, approved: 0 })),
})

const resumenPeriodo = ref<ResumenPeriodoDashboard | null>(null)

const cargandoDashboard = ref(false)
const cargandoPeriodo = ref(false)
const cargandoConsultas = ref(false)
const materializandoResumen = ref(false)
const error = ref('')

const consultaSeleccionada = ref<ConsultaDashboard>('p1')
const resultadoConsulta = ref<ResultadoConsulta>()
const parametrosTabla = ref<ParametrosTabla>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

function reiniciarParametrosTabla() {
  parametrosTabla.value = {
    buscar: '',
    pagina: 1,
    limite: 10,
  }
}

function obtenerAnioNumerico(): number | undefined {
  if (!anioSeleccionado.value || anioSeleccionado.value === 'all') {
    return undefined
  }
  return Number(anioSeleccionado.value)
}

function construirFiltroPeriodo(): SeleccionPeriodo {
  const anioEspecifico = obtenerAnioNumerico()
  const ultimoAnio = aniosDisponibles.value.length > 0
    ? Number(aniosDisponibles.value[aniosDisponibles.value.length - 1])
    : undefined

  let fechaActiva: string | undefined
  if (periodo.value === 'week') {
    fechaActiva = semana.value
  } else if (periodo.value === 'day') {
    fechaActiva = dia.value
  }

  return {
    anio: anioEspecifico ?? ultimoAnio,
    periodo: periodo.value,
    mes: periodo.value === 'month' ? mes.value : undefined,
    fecha: fechaActiva,
  }
}

const datosActivos = computed(() => resumenPeriodo.value ?? resumenAnual.value)
const etiquetaPeriodo = computed(() => datosActivos.value.periodLabel)
const puntosGrafica = computed(() => resumenPeriodo.value?.points ?? resumenAnual.value.points)

const tituloGrafica = computed(() => {
  if (!resumenPeriodo.value) {
    return 'Evaluaciones por mes'
  }
  if (resumenPeriodo.value.points.length === 1) {
    return 'Evaluaciones del día'
  }
  return 'Evaluaciones por día'
})

const accesosRapidos = [
  { title: 'Importaciones', subtitle: 'Tus archivos CSV', to: '/carga', tone: 'blue', icon: 'folder' },
  { title: 'Aspirantes', subtitle: 'Perfiles e historial', to: '/aspirantes', tone: 'coral', icon: 'graduation' },
  { title: 'Grafos', subtitle: 'Explora las relaciones', to: '/grafos', tone: 'orange', icon: 'graph' },
  { title: 'Comparación', subtitle: 'Rendimiento de motores', to: '/comparacion', tone: 'green', icon: 'chart' },
]

const tarjetasResumen = computed(() => [
  {
    title: 'Aspirantes',
    value: datosActivos.value.applicants,
    description: 'Identificadores distintos en MongoDB',
    tone: 'orange',
    icon: 'users',
  },
  {
    title: 'Evaluaciones',
    value: datosActivos.value.total,
    description: 'Documentos válidos en evaluaciones',
    tone: 'coral',
    icon: 'book',
  },
  {
    title: 'Aprobación',
    value: `${datosActivos.value.approvalPercentage}%`,
    description: `${datosActivos.value.approved} evaluaciones con resultado aprobado`,
    tone: 'violet',
    icon: 'check',
  },
  {
    title: 'Carreras',
    value: datosActivos.value.careers,
    description: 'Carreras objetivo registradas',
    tone: 'green',
    icon: 'graduation',
  },
])

async function cargarDashboard() {
  cargandoDashboard.value = true
  error.value = ''

  try {
    const respuesta = await getDashboardSummary(obtenerAnioNumerico())
    const cambioRangoCalendario = calendario.value?.min !== respuesta.calendar?.min

    aniosDisponibles.value = respuesta.years
    anioSeleccionado.value = respuesta.selectedYear
    calendario.value = respuesta.calendar
    resumenAnual.value = respuesta.summary

    if (cambioRangoCalendario || !dia.value) {
      const fechaInicial = respuesta.calendar?.initialDate ?? ''
      dia.value = fechaInicial
      semana.value = fechaInicial
    }

    if (periodo.value !== 'year' && anioSeleccionado.value && anioSeleccionado.value !== 'all') {
      await actualizarPeriodo()
    } else {
      resumenPeriodo.value = null
    }

    await actualizarConsultas()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el dashboard.'
  } finally {
    cargandoDashboard.value = false
  }
}

async function actualizarPeriodo() {
  if (!anioSeleccionado.value) return

  if (periodo.value !== 'year' && anioSeleccionado.value === 'all' && aniosDisponibles.value.length > 0) {
    anioSeleccionado.value = aniosDisponibles.value[aniosDisponibles.value.length - 1]!
  }

  if (periodo.value === 'year') {
    resumenPeriodo.value = null
    return
  }

  cargandoPeriodo.value = true
  error.value = ''

  try {
    resumenPeriodo.value = await getDashboardPeriod(construirFiltroPeriodo())
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el periodo.'
  } finally {
    cargandoPeriodo.value = false
  }
}

async function actualizarConsultas() {
  cargandoConsultas.value = true
  error.value = ''

  try {
    resultadoConsulta.value = await getAnalyticsQuery(
      consultaSeleccionada.value,
      obtenerAnioNumerico(),
      parametrosTabla.value,
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la consulta.'
  } finally {
    cargandoConsultas.value = false
  }
}

async function recalcularResumenCarrera() {
  if (materializandoResumen.value) return
  materializandoResumen.value = true
  error.value = ''

  try {
    await materializeCareerSummary()
    if (consultaSeleccionada.value === 'p6') {
      await actualizarConsultas()
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo materializar resumen_carrera.'
  } finally {
    materializandoResumen.value = false
  }
}

function alCambiarAnio() {
  if (anioSeleccionado.value === 'all') {
    periodo.value = 'year'
  }
  resumenPeriodo.value = null
  reiniciarParametrosTabla()
  void cargarDashboard()
}

async function seleccionarConsulta(consulta: ConsultaDashboard) {
  if (consulta === consultaSeleccionada.value) return
  consultaSeleccionada.value = consulta
  reiniciarParametrosTabla()
  await actualizarConsultas()
}

async function buscarEnConsulta(buscar: string) {
  parametrosTabla.value = { ...parametrosTabla.value, buscar, pagina: 1 }
  await actualizarConsultas()
}

async function ordenarConsulta(ordenarPor: string, direccion: 'asc' | 'desc') {
  parametrosTabla.value = { ...parametrosTabla.value, ordenarPor, direccion, pagina: 1 }
  await actualizarConsultas()
}

async function cambiarPaginaConsulta(pagina: number) {
  parametrosTabla.value = { ...parametrosTabla.value, pagina }
  await actualizarConsultas()
}

async function cambiarLimiteConsulta(limite: number) {
  parametrosTabla.value = { ...parametrosTabla.value, limite, pagina: 1 }
  await actualizarConsultas()
}

onMounted(() => {
  void cargarDashboard()
})
</script>

<template>
  <div class="page dashboard-page">
    <p v-if="error" class="dashboard-alert dashboard-alert--error" role="alert">
      {{ error }}
    </p>

    <div class="dashboard-layout">
      <section class="dashboard-primary" aria-labelledby="explore-title">
        <div class="section-heading">
          <div>
            <h1 id="explore-title">Dashboard</h1>
          </div>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="cargandoDashboard || cargandoPeriodo"
            @click="cargarDashboard"
          >
            <AppIcon name="refresh" :size="16" />
            {{ cargandoDashboard ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>

        <div class="shortcut-grid">
          <RouterLink
            v-for="acceso in accesosRapidos"
            :key="acceso.to"
            :to="acceso.to"
            class="shortcut"
            :class="`tone-${acceso.tone}`"
          >
            <AppIcon :name="acceso.icon" :size="29" />
            <div>
              <strong>{{ acceso.title }}</strong>
              <span>{{ acceso.subtitle }}</span>
            </div>
            <AppIcon name="chevron" :size="17" />
          </RouterLink>
        </div>

        <section class="statistics-card" aria-labelledby="statistics-title">
          <header class="section-heading">
            <h2 id="statistics-title">Estadísticas ({{ etiquetaPeriodo }})</h2>

            <label v-if="aniosDisponibles.length" class="year-select">
              <AppIcon name="calendar" :size="17" />
              <span class="sr-only">Año de evaluación</span>
              <select
                v-model="anioSeleccionado"
                :disabled="cargandoDashboard || cargandoPeriodo"
                @change="alCambiarAnio"
              >
                <option value="all">Todos los años</option>
                <option v-for="anio in aniosDisponibles" :key="anio" :value="anio">
                  {{ anio }}
                </option>
              </select>
            </label>
            <span v-else class="badge badge--muted">Sin registros</span>
          </header>

          <DashboardPeriodFilter
            v-model:period="periodo"
            v-model:month="mes"
            v-model:week="semana"
            v-model:day="dia"
            :year="anioSeleccionado"
            :calendar="calendario"
            :disabled="cargandoDashboard || cargandoPeriodo"
            @change="actualizarPeriodo()"
          />

          <SampleChart
            :months="resumenAnual.months"
            :points="puntosGrafica"
            :year="datosActivos.year"
            :period-label="etiquetaPeriodo"
            :title="tituloGrafica"
          />
        </section>
      </section>

      <aside class="dashboard-secondary" aria-labelledby="summary-title">
        <div class="section-heading">
          <h2 id="summary-title">Resumen académico</h2>
          <AppIcon name="graduation" :size="21" />
        </div>

        <div class="academic-profile">
          <img
            class="academic-avatar usac-logo"
            src="/images/usac-escudo.png"
            alt="Escudo de la USAC"
            width="45"
            height="45"
          />
          <div>
            <strong>Universidad de San Carlos</strong>
            <span>Pruebas específicas · Guatemala</span>
          </div>
          <span class="profile-year">{{ datosActivos.year }}</span>
        </div>

        <div class="summary-grid">
          <article v-for="tarjeta in tarjetasResumen" :key="tarjeta.title" class="summary-card">
            <span class="metric-icon" :class="`tone-${tarjeta.tone}`">
              <AppIcon :name="tarjeta.icon" :size="26" />
            </span>
            <strong class="summary-value">{{ tarjeta.value }}</strong>
            <h3>{{ tarjeta.title }}</h3>
            <p>{{ tarjeta.description }}</p>
          </article>
        </div>
      </aside>
    </div>

    <section class="query-catalog" aria-labelledby="catalog-title">
      <div class="section-heading">
        <div>
          <h2 id="catalog-title">Biblioteca de consultas</h2>
        </div>
      </div>

      <DashboardQueryExplorer
        :key="anioSeleccionado"
        :selected="consultaSeleccionada"
        :params="parametrosTabla"
        :response="resultadoConsulta"
        :loading="cargandoDashboard || cargandoPeriodo || cargandoConsultas"
        :materializing="materializandoResumen"
        @select="seleccionarConsulta"
        @search="buscarEnConsulta"
        @sort="ordenarConsulta"
        @page="cambiarPaginaConsulta"
        @page-size="cambiarLimiteConsulta"
        @recalculate="recalcularResumenCarrera"
      />
    </section>
  </div>
</template>

<style scoped>
.dashboard-alert {
  padding: 13px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--blue-soft);
  font-size: 12px;
}

.dashboard-alert--error {
  background: var(--coral-soft);
}

.query-catalog > .section-heading {
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
</style>
