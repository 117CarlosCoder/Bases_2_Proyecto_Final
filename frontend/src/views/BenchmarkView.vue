<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import { getGraphFilters, runGraphBenchmark } from '@/services/graphs.service'
import type { IdEscenarioBenchmark, RespuestaBenchmarkGrafo } from '@/types/graphs'

const escenario = ref<IdEscenarioBenchmark>('todos')
const repeticiones = ref<number>(5)
const limite = ref<number>(100)
const anio = ref<string>('')
const aniosDisponibles = ref<number[]>([])
const cargando = ref(false)
const errorMensaje = ref<string | null>(null)
const resultado = ref<RespuestaBenchmarkGrafo | null>(null)

const opcionesEscenario: { id: IdEscenarioBenchmark; label: string }[] = [
  { id: 'todos', label: 'Todos los escenarios (BM-01 a BM-04)' },
  { id: 'bm1', label: 'BM-01 · Rendimiento por tipo de institución' },
  { id: 'bm2', label: 'BM-02 · Flujo geográfico hacia carreras objetivo' },
  { id: 'bm3', label: 'BM-03 · Trayectoria de superación de materia' },
  { id: 'bm4', label: 'BM-04 · Vecindario y compañeros de establecimiento' },
]

const mongoMetrics = computed(() => {
  const s = resultado.value?.summary
  return [
    { label: 'Tiempo promedio', value: s ? `${s.mongodbAvgMs} ms` : '—' },
    { label: 'Tiempo mínimo', value: s ? `${s.mongodbMinMs} ms` : '—' },
    { label: 'Tiempo máximo', value: s ? `${s.mongodbMaxMs} ms` : '—' },
    { label: 'Registros devueltos', value: s ? s.mongodbTotalRows.toLocaleString('es-GT') : '—' },
  ]
})

const neo4jMetrics = computed(() => {
  const s = resultado.value?.summary
  return [
    { label: 'Tiempo promedio', value: s ? `${s.neo4jAvgMs} ms` : '—' },
    { label: 'Tiempo mínimo', value: s ? `${s.neo4jMinMs} ms` : '—' },
    { label: 'Tiempo máximo', value: s ? `${s.neo4jMaxMs} ms` : '—' },
    { label: 'Registros / nodos leídos', value: s ? s.neo4jTotalRows.toLocaleString('es-GT') : '—' },
  ]
})

async function ejecutarComparacion() {
  cargando.value = true
  errorMensaje.value = null
  try {
    resultado.value = await runGraphBenchmark({
      escenario: escenario.value,
      repeticiones: repeticiones.value,
      limite: limite.value,
      anio: anio.value ? Number(anio.value) : undefined,
    })
  } catch (err) {
    errorMensaje.value = err instanceof Error ? err.message : 'Error al ejecutar benchmark.'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  try {
    const filtros = await getGraphFilters()
    aniosDisponibles.value = filtros.anios
  } catch {
    aniosDisponibles.value = []
  }
  await ejecutarComparacion()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Comparativa de rendimiento MongoDB vs Neo4j</h1>
      </div>
      <span class="badge">Rendimiento</span>
    </header>

    <BaseCard
      title="Configuración del benchmark"
      :badge="cargando ? 'Midiendo...' : 'Conectado'"
    >
      <div class="field-grid">
        <label class="field">
          Escenario
          <select v-model="escenario" :disabled="cargando">
            <option v-for="op in opcionesEscenario" :key="op.id" :value="op.id">{{ op.label }}</option>
          </select>
        </label>
        <label class="field">
          Repeticiones por motor
          <select v-model.number="repeticiones" :disabled="cargando">
            <option :value="3">3 repeticiones</option>
            <option :value="5">5 repeticiones</option>
            <option :value="10">10 repeticiones</option>
            <option :value="15">15 repeticiones</option>
          </select>
        </label>
        <label class="field">
          Límite de resultados
          <select v-model.number="limite" :disabled="cargando">
            <option :value="50">50 registros</option>
            <option :value="100">100 registros</option>
            <option :value="500">500 registros</option>
            <option :value="1000">1000 registros</option>
          </select>
        </label>
        <label class="field">
          Año de evaluación
          <select v-model="anio" :disabled="cargando">
            <option value="">Todos los años</option>
            <option v-for="a in aniosDisponibles" :key="a" :value="String(a)">{{ a }}</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="btn btn--primary" type="button" :disabled="cargando" @click="ejecutarComparacion">
          {{ cargando ? 'Ejecutando mediciones...' : 'Ejecutar comparación' }}
        </button>
      </div>
      <p v-if="errorMensaje" class="error-banner">{{ errorMensaje }}</p>
      <p v-else class="hint">
        Cada escenario ejecuta exactamente la misma cantidad de iteraciones consecutivas sobre MongoDB y Neo4j.
      </p>
    </BaseCard>

    <div class="split-grid">
      <BaseCard title="MongoDB" description="Pipelines de agregación sobre la colección documental de evaluaciones.">
        <ul class="metric-list">
          <li v-for="metric in mongoMetrics" :key="metric.label" class="metric">
            <span class="metric__label">{{ metric.label }}</span>
            <span class="metric__value">{{ metric.value }}</span>
          </li>
        </ul>
      </BaseCard>

      <BaseCard title="Neo4j" description="Recorridos Cypher sobre nodos y relaciones del grafo académico.">
        <ul class="metric-list">
          <li v-for="metric in neo4jMetrics" :key="metric.label" class="metric">
            <span class="metric__label">{{ metric.label }}</span>
            <span class="metric__value">{{ metric.value }}</span>
          </li>
        </ul>
      </BaseCard>
    </div>

    <BaseCard
      title="Resultados comparativos por escenario"
      description="Tiempos medidos en milisegundos (promedio, mínimo, máximo) y factor de velocidad."
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Categoría</th>
              <th>MongoDB Prom. (Min/Máx)</th>
              <th>Neo4j Prom. (Min/Máx)</th>
              <th>Filas (Mongo / Neo4j)</th>
              <th>Más rápido</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!resultado || resultado.scenarios.length === 0">
              <td colspan="6" class="table__empty">
                {{ cargando ? 'Ejecutando pruebas de rendimiento...' : 'Aún no se han ejecutado comparaciones.' }}
              </td>
            </tr>
            <tr v-for="item in resultado?.scenarios" :key="item.scenarioId">
              <td>
                <strong>{{ item.title }}</strong>
                <div class="scenario-note">{{ item.explanation }}</div>
              </td>
              <td>{{ item.category }}</td>
              <td>
                <strong>{{ item.mongodb.avgMs }} ms</strong>
                <span class="muted"> ({{ item.mongodb.minMs }}–{{ item.mongodb.maxMs }} ms)</span>
              </td>
              <td>
                <strong>{{ item.neo4j.avgMs }} ms</strong>
                <span class="muted"> ({{ item.neo4j.minMs }}–{{ item.neo4j.maxMs }} ms)</span>
              </td>
              <td>{{ item.mongodb.rowCount }} / {{ item.neo4j.rowCount }}</td>
              <td>
                <span class="winner-pill" :class="`winner-pill--${item.winner.toLowerCase()}`">
                  {{ item.winner }} ({{ item.speedupFactor }}x)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.error-banner {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
}

.scenario-note {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.winner-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.winner-pill--mongodb {
  background: #dcfce7;
  color: #166534;
}

.winner-pill--neo4j {
  background: #dbeafe;
  color: #1e40af;
}

.winner-pill--empate {
  background: #f1f5f9;
  color: #475569;
}
</style>
