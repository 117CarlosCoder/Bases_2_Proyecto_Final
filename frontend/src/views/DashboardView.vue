<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SampleChart from '@/components/SampleChart.vue'
import DashboardQueryExplorer from '@/components/DashboardQueryExplorer.vue'
import { getDashboardSummary } from '@/services/analytics.service'
import { getP1, getP2, getP3, getP4, getP5, getP6, materializeCareerSummary } from '@/services/analytics-queries.service'
import type {
  ConsultaDashboard,
  ResultadoConsulta,
  ResumenAnualDashboard,
  ParametrosTabla,
} from '@/types/analytics'

const years = ref<string[]>([])
const selectedYear = ref('')
const resumen = ref<ResumenAnualDashboard>({
  year: 'Sin datos',
  total: 0,
  approved: 0,
  applicants: 0,
  careers: 0,
  approvalPercentage: 0,
  periodLabel: 'Sin datos',
  months: Array.from({ length: 12 }, () => ({ total: 0, approved: 0 })),
})

const filtrarConsultasPorAnio = ref(false)
const cargando = ref(false)
const cargandoConsultas = ref(false)
const materializando = ref(false)
const error = ref('')
const consultaSeleccionada = ref<ConsultaDashboard>('p1')

const parametrosIniciales = (): ParametrosTabla => ({ buscar: '', pagina: 1, limite: 10 })
const parametrosTabla = ref<ParametrosTabla>(parametrosIniciales())
const resultadoConsulta = ref<ResultadoConsulta>()

const shortcuts = [
  { title: 'Importaciones', subtitle: 'Tus archivos CSV', to: '/carga', tone: 'blue', icon: 'folder' },
  { title: 'Aspirantes', subtitle: 'Perfiles e historial', to: '/aspirantes', tone: 'coral', icon: 'graduation' },
  { title: 'Grafos', subtitle: 'Explora las relaciones', to: '/grafos', tone: 'orange', icon: 'graph' },
  { title: 'Comparación', subtitle: 'Rendimiento de motores', to: '/comparacion', tone: 'green', icon: 'chart' },
]

const metrics = computed(() => [
  {
    title: 'Aspirantes',
    value: resumen.value.applicants,
    description: 'Identificadores distintos en MongoDB',
    tone: 'orange',
    icon: 'users',
  },
  {
    title: 'Evaluaciones',
    value: resumen.value.total,
    description: 'Documentos válidos en evaluaciones',
    tone: 'coral',
    icon: 'book',
  },
  {
    title: 'Aprobación',
    value: `${resumen.value.approvalPercentage}%`,
    description: `${resumen.value.approved} evaluaciones con resultado aprobado`,
    tone: 'violet',
    icon: 'check',
  },
  {
    title: 'Carreras',
    value: resumen.value.careers,
    description: 'Carreras objetivo registradas',
    tone: 'green',
    icon: 'graduation',
  },
])

async function cargarDashboard() {
  cargando.value = true
  error.value = ''
  try {
    const anio = selectedYear.value ? Number(selectedYear.value) : undefined
    const respuesta = await getDashboardSummary(anio)
    years.value = respuesta.years
    selectedYear.value = respuesta.selectedYear
    resumen.value = respuesta.summary
    await actualizarConsultas()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el dashboard.'
  } finally {
    cargando.value = false
  }
}

async function actualizarConsultas() {
  cargandoConsultas.value = true
  error.value = ''
  try {
    const anio = filtrarConsultasPorAnio.value && selectedYear.value
      ? Number(selectedYear.value)
      : undefined

    switch (consultaSeleccionada.value) {
      case 'p1':
        resultadoConsulta.value = await getP1(anio, parametrosTabla.value)
        break
      case 'p2':
        resultadoConsulta.value = await getP2(anio, parametrosTabla.value)
        break
      case 'p3':
        resultadoConsulta.value = await getP3(anio, parametrosTabla.value)
        break
      case 'p4':
        resultadoConsulta.value = await getP4(anio, parametrosTabla.value)
        break
      case 'p5':
        resultadoConsulta.value = await getP5(anio, parametrosTabla.value)
        break
      case 'p6':
        resultadoConsulta.value = await getP6(parametrosTabla.value)
        break
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar la consulta.'
  } finally {
    cargandoConsultas.value = false
  }
}

async function recargarConsulta() {
  parametrosTabla.value = { ...parametrosTabla.value, pagina: 1 }
  await actualizarConsultas()
}

async function recalcularResumenCarrera() {
  if (materializando.value) return
  materializando.value = true
  error.value = ''
  try {
    await materializeCareerSummary()
    if (consultaSeleccionada.value === 'p6') await actualizarConsultas()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo materializar resumen_carrera.'
  } finally {
    materializando.value = false
  }
}

function alCambiarAnio() {
  parametrosTabla.value = parametrosIniciales()
  void cargarDashboard()
}

async function seleccionarConsulta(consulta: ConsultaDashboard) {
  if (consulta === consultaSeleccionada.value) return
  consultaSeleccionada.value = consulta
  parametrosTabla.value = parametrosIniciales()
  await actualizarConsultas()
}

async function buscarConsulta(buscar: string) {
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
    <p v-if="error" class="dashboard-alert dashboard-alert--error" role="alert">{{ error }}</p>

    <div class="dashboard-layout">
      <section class="dashboard-primary" aria-labelledby="explore-title">
        <div class="section-heading">
          <div>
            <h1 id="explore-title">Dashboard</h1>
          </div>
          <button class="btn btn--ghost" type="button" :disabled="cargando" @click="cargarDashboard">
            <AppIcon name="refresh" :size="16" />
            {{ cargando ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>

        <div class="shortcut-grid">
          <RouterLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="shortcut" :class="`tone-${item.tone}`">
            <AppIcon :name="item.icon" :size="29" />
            <div><strong>{{ item.title }}</strong><span>{{ item.subtitle }}</span></div>
            <AppIcon name="chevron" :size="17" />
          </RouterLink>
        </div>

        <section class="statistics-card" aria-labelledby="statistics-title">
          <header class="section-heading">
            <h2 id="statistics-title">Estadísticas anuales ({{ resumen.periodLabel }})</h2>
            <label v-if="years.length" class="year-select">
              <AppIcon name="calendar" :size="17" />
              <span class="sr-only">Año de evaluación</span>
              <select v-model="selectedYear" :disabled="cargando" @change="alCambiarAnio">
                <option v-for="item in years" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <span v-else class="badge badge--muted">Sin registros</span>
          </header>

          <SampleChart
            :months="resumen.months"
            :year="resumen.year"
            :period-label="resumen.periodLabel"
            title="Evaluaciones por mes de asignación"
          />
        </section>
      </section>

      <aside class="dashboard-secondary" aria-labelledby="summary-title">
        <div class="section-heading">
          <h2 id="summary-title">Resumen académico</h2>
          <AppIcon name="graduation" :size="21" />
        </div>
        <div class="academic-profile">
          <img class="academic-avatar usac-logo" src="/images/usac-escudo.png" alt="Escudo de la USAC" width="45" height="45" />
          <div>
            <strong>Universidad de San Carlos</strong>
            <span>Pruebas específicas · Guatemala</span>
          </div>
          <span class="profile-year">{{ resumen.year }}</span>
        </div>
        <div class="summary-grid">
          <article v-for="metric in metrics" :key="metric.title" class="summary-card">
            <span class="metric-icon" :class="`tone-${metric.tone}`"><AppIcon :name="metric.icon" :size="26" /></span>
            <span class="metric-kicker">MONGODB</span>
            <strong class="summary-value">{{ metric.value }}</strong>
            <h3>{{ metric.title }}</h3>
            <p>{{ metric.description }}</p>
          </article>
        </div>
      </aside>
    </div>

    <section class="query-catalog" aria-labelledby="catalog-title">
      <div class="section-heading">
        <div>
          <h2 id="catalog-title">Biblioteca de consultas</h2>
          <p class="section-caption">Resultados ejecutados en tiempo real sobre MongoDB (P1–P6).</p>
        </div>
        <div class="catalog-controls">
          <label v-if="years.length" class="catalog-filter">
            <span>Filtrar por año</span>
            <span class="catalog-filter-year">{{ selectedYear }}</span>
            <span class="catalog-switch">
              <input
                v-model="filtrarConsultasPorAnio"
                type="checkbox"
                role="switch"
                :aria-label="`Filtrar consultas P1–P5 por año ${selectedYear}`"
                :disabled="cargando || cargandoConsultas"
                @change="recargarConsulta"
              />
              <span class="catalog-switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <span class="catalog-connection"><span aria-hidden="true"></span>Conectado a MongoDB</span>
        </div>
      </div>

      <DashboardQueryExplorer
        :key="selectedYear"
        :selected="consultaSeleccionada"
        :params="parametrosTabla"
        :response="resultadoConsulta"
        @select="seleccionarConsulta"
        @search="buscarConsulta"
        @sort="ordenarConsulta"
        @page="cambiarPaginaConsulta"
        @page-size="cambiarLimiteConsulta"
        :loading="cargando || cargandoConsultas"
        :materializing="materializando"
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

.notice-link {
  color: var(--color-primary);
  text-decoration: underline;
}

.catalog-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.query-catalog > .section-heading {
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.catalog-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 11px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  font-size: 11px;
  color: var(--color-text-muted);
  cursor: pointer;
}

.catalog-filter-year {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.catalog-switch {
  position: relative;
  display: inline-flex;
  width: 30px;
  height: 18px;
  flex-shrink: 0;
}

.catalog-switch input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.catalog-switch-track {
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-text-muted);
  border-radius: 20px;
  background: var(--color-surface-muted);
  transition: background .15s, border-color .15s;
  pointer-events: none;
}

.catalog-switch-track::after {
  content: '';
  display: block;
  width: 10px;
  height: 10px;
  margin: 3px;
  border-radius: 50%;
  background: var(--color-text-muted);
  transition: transform .15s, background .15s;
}

.catalog-switch input:checked + .catalog-switch-track {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.catalog-switch input:checked + .catalog-switch-track::after {
  transform: translateX(12px);
  background: var(--color-surface);
}

.catalog-switch input:focus-visible + .catalog-switch-track {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.catalog-connection {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-muted);
  font-size: 11px;
}

.catalog-connection > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-up);
}
</style>
