<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SampleChart from '@/components/SampleChart.vue'
import sample from '@/data/sample-summary.json'

const selectedYear = ref(sample[sample.length - 1]!.year)
const data = computed(() => sample.find(item => item.year === selectedYear.value)!)
const shortcuts = [
  { title: 'Importaciones', subtitle: 'Tus archivos CSV', to: '/carga', tone: 'blue', icon: 'folder' },
  { title: 'Aspirantes', subtitle: 'Perfiles e historial', to: '/aspirantes', tone: 'coral', icon: 'graduation' },
  { title: 'Grafos', subtitle: 'Explora las relaciones', to: '/grafos', tone: 'orange', icon: 'graph' },
  { title: 'Comparación', subtitle: 'Rendimiento de motores', to: '/comparacion', tone: 'green', icon: 'chart' },
]
const metrics = computed(() => [
  { title: 'Aspirantes', value: data.value.applicants, description: 'Identificadores distintos', tone: 'orange', icon: 'users' },
  { title: 'Evaluaciones', value: data.value.total, description: 'Filas del archivo de muestra', tone: 'coral', icon: 'book' },
  { title: 'Aprobación', value: `${Math.round(data.value.approved / data.value.total * 100)}%`, description: `${data.value.approved} filas con resultado aprobado`, tone: 'violet', icon: 'check' },
  { title: 'Carreras', value: data.value.careers, description: 'Carreras registradas en la muestra', tone: 'green', icon: 'graduation' },
])
const queries = [
  { id: 'Q01', title: 'Tipo de institución', description: 'Aspirantes distintos por tipo de institución educativa.' },
  { id: 'Q02', title: 'Aprobados por materia', description: 'Evaluaciones aprobadas agrupadas por materia.' },
  { id: 'Q03', title: 'Carrera y año', description: 'Aspirantes aprobados por carrera y año de evaluación.' },
  { id: 'Q04', title: 'Tasa de aprobación', description: 'Proporción de evaluaciones aprobadas por materia.' },
  { id: 'Q05', title: 'Edad por carrera', description: 'Promedio de edad de los aspirantes por carrera.' },
  { id: 'Q06', title: 'Resumen por carrera', description: 'Indicadores agregados de la colección resumen_carrera.' },
]
</script>

<template>
  <div class="page dashboard-page">
    <div class="dashboard-layout">
      <section class="dashboard-primary" aria-labelledby="explore-title">
        <div class="section-heading"><h1 id="explore-title">Tu espacio de análisis</h1><span class="section-caption">Pruebas específicas</span></div>
        <div class="shortcut-grid">
          <RouterLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="shortcut" :class="`tone-${item.tone}`">
            <AppIcon :name="item.icon" :size="29" /><div><strong>{{ item.title }}</strong><span>{{ item.subtitle }}</span></div><AppIcon name="chevron" :size="17" />
          </RouterLink>
        </div>
        <section class="statistics-card" aria-labelledby="statistics-title">
          <header class="section-heading"><h2 id="statistics-title">Estadísticas</h2><label class="year-select"><AppIcon name="calendar" :size="17" /><span class="sr-only">Año de la muestra</span><select v-model="selectedYear"><option v-for="item in sample" :key="item.year" :value="item.year">{{ item.year }}</option></select></label></header>
          <SampleChart :months="data.months" :year="selectedYear" />
          <div class="sample-notice"><AppIcon name="info" :size="16" /><p><strong>CSV de muestra.</strong> Conteo de filas del archivo de referencia, antes de normalizar y deduplicar. No representa datos importados.</p></div>
        </section>
      </section>
      <aside class="dashboard-secondary" aria-labelledby="summary-title">
        <div class="section-heading"><h2 id="summary-title">Resumen académico</h2><AppIcon name="graduation" :size="21" /></div>
        <div class="academic-profile"><img class="academic-avatar usac-logo" src="/images/usac-escudo.png" alt="Escudo de la USAC" width="45" height="45" /><div><strong>Universidad de San Carlos</strong><span>Pruebas específicas · Guatemala</span></div><span class="profile-year">{{ selectedYear }}</span></div>
        <div class="summary-grid">
          <article v-for="metric in metrics" :key="metric.title" class="summary-card">
            <span class="metric-icon" :class="`tone-${metric.tone}`"><AppIcon :name="metric.icon" :size="26" /></span>
            <span class="metric-kicker">MUESTRA CSV</span><strong class="summary-value">{{ metric.value }}</strong><h3>{{ metric.title }}</h3><p>{{ metric.description }}</p>
          </article>
        </div>
      </aside>
    </div>
    <section class="query-catalog" aria-labelledby="catalog-title">
      <div class="section-heading"><div><h2 id="catalog-title">Biblioteca de consultas</h2><p class="section-caption">Una mirada más cercana a los resultados académicos.</p></div><span class="badge badge--muted">Próximamente</span></div>
      <div class="query-grid"><details v-for="query in queries" :key="query.id" class="query-card"><summary><span class="query-id">{{ query.id }}</span><strong>{{ query.title }}</strong><AppIcon name="chevron" :size="16" /></summary><p>{{ query.description }} La ejecución estará disponible cuando se conecte el servicio de consultas.</p></details></div>
    </section>
  </div>
</template>
