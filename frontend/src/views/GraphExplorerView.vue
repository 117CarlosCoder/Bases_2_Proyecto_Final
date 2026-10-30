<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Network } from 'vis-network/standalone'
import BaseCard from '@/components/BaseCard.vue'
import { getGraphFilters, runGraphQuery } from '@/services/graphs.service'
import { CATALOGO_CONSULTAS_GRAFO, COLORES_NODO_GRAFO } from '@/types/graphs'
import type { FiltrosDisponiblesGrafo, IdConsultaGrafo, NodoGrafo, RespuestaConsultaGrafo } from '@/types/graphs'

const route = useRoute()

const filtrosDisponibles = ref<FiltrosDisponiblesGrafo>({
  anios: [],
  departamentos: [],
  carreras: [],
  materias: [],
  tipos: [],
  correlativos: [],
})

const consultaActiva = ref<IdConsultaGrafo>('g1')
const anio = ref('')
const correlativo = ref('')
const departamento = ref('')
const carrera = ref('')
const materia = ref('')
const tipo = ref('')
const limite = ref(25)

const cargando = ref(false)
const error = ref('')
const mostrarCypher = ref(false)
const respuesta = ref<RespuestaConsultaGrafo | null>(null)
const nodoSeleccionado = ref<NodoGrafo | null>(null)
const contenedorRef = ref<HTMLElement | null>(null)
let instanciaRed: Network | null = null

const legendItems = Object.entries(COLORES_NODO_GRAFO).map(([label, color]) => ({ label, color }))

const camposActivos = computed(() => {
  const actual = CATALOGO_CONSULTAS_GRAFO.find(q => q.id === consultaActiva.value)
  return new Set(actual?.campos ?? [])
})

function renderizarGrafo() {
  const nodos = respuesta.value?.nodes ?? []
  const aristas = respuesta.value?.edges ?? []

  if (!contenedorRef.value || nodos.length === 0) {
    instanciaRed?.destroy()
    instanciaRed = null
    return
  }

  const data = {
    nodes: nodos.map(n => ({
      id: n.id,
      label: n.label,
      color: {
        background: COLORES_NODO_GRAFO[n.type] ?? '#475569',
        border: '#ffffff',
        highlight: {
          background: COLORES_NODO_GRAFO[n.type] ?? '#475569',
          border: '#0f172a',
        },
      },
    })),
    edges: aristas.map(e => ({
      id: e.id,
      from: e.source,
      to: e.target,
      label: e.label,
    })),
  }

  if (!instanciaRed) {
    instanciaRed = new Network(contenedorRef.value, data, {
      autoResize: true,
      height: '440px',
      interaction: { hover: true, zoomView: true, dragView: true },
      physics: {
        stabilization: { iterations: 120 },
        barnesHut: { gravitationalConstant: -2600, springLength: 135 },
      },
      nodes: {
        shape: 'dot',
        size: 18,
        borderWidth: 2,
        font: { size: 11, color: '#1e293b', face: 'Segoe UI, sans-serif' },
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.65 } },
        color: { color: '#94a3b8', highlight: '#2563eb' },
        font: { size: 9, color: '#64748b', align: 'top' },
        smooth: { enabled: true, type: 'dynamic', roundness: 0.3 },
      },
    })

    instanciaRed.on('click', params => {
      const id = params.nodes[0] as string | undefined
      nodoSeleccionado.value = id ? ((respuesta.value?.nodes ?? []).find(n => n.id === id) ?? null) : null
    })
  } else {
    instanciaRed.setData(data)
  }

  if (nodoSeleccionado.value && nodos.some(n => n.id === nodoSeleccionado.value?.id)) {
    instanciaRed.selectNodes([nodoSeleccionado.value.id])
  }
}

async function cargarFiltros() {
  try {
    filtrosDisponibles.value = await getGraphFilters()
    if (!correlativo.value && filtrosDisponibles.value.correlativos.length > 0) {
      correlativo.value = filtrosDisponibles.value.correlativos[0] ?? ''
    }
  } catch {
    filtrosDisponibles.value = { anios: [], departamentos: [], carreras: [], materias: [], tipos: [], correlativos: [] }
  }
}

async function ejecutarConsulta() {
  cargando.value = true
  error.value = ''
  try {
    const res = await runGraphQuery(consultaActiva.value, {
      anio: anio.value ? Number(anio.value) : undefined,
      correlativo: camposActivos.value.has('correlativo') ? correlativo.value : undefined,
      departamento: camposActivos.value.has('departamento') ? departamento.value : undefined,
      carrera: camposActivos.value.has('carrera') ? carrera.value : undefined,
      materia: camposActivos.value.has('materia') ? materia.value : undefined,
      tipo: camposActivos.value.has('tipo') ? tipo.value : undefined,
      limite: limite.value,
    })
    respuesta.value = res
    nodoSeleccionado.value = res.nodes[0] ?? null
    await nextTick()
    renderizarGrafo()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo ejecutar la consulta en Neo4j.'
  } finally {
    cargando.value = false
  }
}

async function seleccionarConsulta(id: IdConsultaGrafo) {
  consultaActiva.value = id
  await ejecutarConsulta()
}

async function limpiarFiltros() {
  anio.value = ''
  departamento.value = ''
  carrera.value = ''
  materia.value = ''
  tipo.value = ''
  correlativo.value = filtrosDisponibles.value.correlativos[0] ?? ''
  await ejecutarConsulta()
}

watch(
  () => route.query.correlativo,
  async nuevoCorrelativo => {
    if (typeof nuevoCorrelativo === 'string' && nuevoCorrelativo.trim()) {
      correlativo.value = nuevoCorrelativo.trim().toUpperCase()
      consultaActiva.value = 'g5'
      await ejecutarConsulta()
    }
  },
)

onMounted(async () => {
  await cargarFiltros()
  const paramCorrelativo = route.query.correlativo
  if (typeof paramCorrelativo === 'string' && paramCorrelativo.trim()) {
    correlativo.value = paramCorrelativo.trim().toUpperCase()
    consultaActiva.value = 'g5'
  }
  await ejecutarConsulta()
})

onBeforeUnmount(() => {
  instanciaRed?.destroy()
  instanciaRed = null
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Explorador de grafos Neo4j (G1–G5)</h1>
        <p class="page-subtitle">
          Cinco consultas Cypher sobre el grafo de aspirantes, evaluaciones, carreras, materias e instituciones educativas.
        </p>
      </div>
      <span class="badge">Neo4j · Cypher</span>
    </header>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

    <div class="graph-layout">
      <BaseCard
        title="Catálogo de consultas Cypher"
        description="Selecciona una de las 5 consultas obligatorias de Neo4j."
        badge="G1 – G5"
      >
        <ul class="query-list">
          <li v-for="query in CATALOGO_CONSULTAS_GRAFO" :key="query.id">
            <button
              class="query-option"
              :class="{ 'query-option--active': consultaActiva === query.id }"
              type="button"
              :disabled="cargando"
              @click="seleccionarConsulta(query.id)"
            >
              <span class="query-option__title">{{ query.code }} · {{ query.title }}</span>
              <span class="query-option__meta">{{ query.description }}</span>
              <span class="query-option__filters">Filtros: {{ query.filtersLabel }}</span>
            </button>
          </li>
        </ul>

        <div v-if="nodoSeleccionado" class="node-inspector">
          <div class="node-inspector__header">
            <span class="legend__swatch" :style="{ backgroundColor: COLORES_NODO_GRAFO[nodoSeleccionado.type] }" />
            <strong>{{ nodoSeleccionado.type }}</strong>
          </div>
          <p class="node-inspector__label">{{ nodoSeleccionado.label }}</p>
          <dl class="node-inspector__props">
            <div v-for="(val, key) in nodoSeleccionado.properties" :key="key" class="node-inspector__row">
              <dt>{{ key }}</dt>
              <dd>{{ val === null || val === '' ? '—' : String(val) }}</dd>
            </div>
          </dl>
        </div>
      </BaseCard>

      <BaseCard
        :title="respuesta?.title ?? 'Visualización del grafo'"
        :description="respuesta?.description ?? 'Subgrafo proyectado desde Neo4j con identificadores estables.'"
        :badge="respuesta ? `${respuesta.nodes.length} nodos · ${respuesta.edges.length} relaciones` : 'Grafo'"
      >
        <div class="field-grid">
          <label v-if="camposActivos.has('correlativo')" class="field">
            Correlativo del aspirante
            <input
              v-model="correlativo"
              type="text"
              list="lista-correlativos"
              placeholder="Ej. ASP-001"
              @keyup.enter="ejecutarConsulta()"
            />
            <datalist id="lista-correlativos">
              <option v-for="item in filtrosDisponibles.correlativos" :key="item" :value="item" />
            </datalist>
          </label>

          <label v-if="camposActivos.has('departamento')" class="field">
            Departamento
            <select v-model="departamento" @change="ejecutarConsulta()">
              <option value="">Todos</option>
              <option v-for="item in filtrosDisponibles.departamentos" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label v-if="camposActivos.has('carrera')" class="field">
            Carrera objetivo
            <select v-model="carrera" @change="ejecutarConsulta()">
              <option value="">Todas</option>
              <option v-for="item in filtrosDisponibles.carreras" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label v-if="camposActivos.has('materia')" class="field">
            Materia evaluada
            <select v-model="materia" @change="ejecutarConsulta()">
              <option value="">Todas</option>
              <option v-for="item in filtrosDisponibles.materias" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label v-if="camposActivos.has('tipo')" class="field">
            Tipo de institución
            <select v-model="tipo" @change="ejecutarConsulta()">
              <option value="">Todos</option>
              <option v-for="item in filtrosDisponibles.tipos" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label class="field">
            Año de evaluación
            <select v-model="anio" @change="ejecutarConsulta()">
              <option value="">Todos</option>
              <option v-for="item in filtrosDisponibles.anios" :key="item" :value="String(item)">{{ item }}</option>
            </select>
          </label>

          <label class="field">
            Límite de filas
            <select v-model.number="limite" @change="ejecutarConsulta()">
              <option :value="15">15</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="80">80</option>
            </select>
          </label>
        </div>

        <div class="actions">
          <button class="btn btn--primary" type="button" :disabled="cargando" @click="ejecutarConsulta()">
            {{ cargando ? 'Consultando Neo4j…' : 'Ejecutar consulta' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="cargando" @click="limpiarFiltros()">
            Limpiar filtros
          </button>
          <button class="btn btn--ghost" type="button" @click="mostrarCypher = !mostrarCypher">
            {{ mostrarCypher ? 'Ocultar Cypher' : 'Ver sentencia Cypher' }}
          </button>
        </div>

        <pre v-if="mostrarCypher && respuesta" class="cypher-box"><code>{{ respuesta.cypher }}</code></pre>

        <p v-if="respuesta?.truncated" class="truncation-banner">
          Se alcanzó el límite de {{ respuesta.limit }} registros. Usa los filtros superiores para acotar el subgrafo.
        </p>

        <div v-show="(respuesta?.nodes.length ?? 0) > 0" ref="contenedorRef" class="canvas-wrapper" />

        <div v-if="(respuesta?.nodes.length ?? 0) === 0" class="placeholder placeholder--graph">
          <p class="placeholder__title">
            {{ cargando ? 'Ejecutando recorrido Cypher…' : 'Sin nodos para los filtros seleccionados' }}
          </p>
          <p>Importa datos en la pestaña Carga o ajusta los filtros de la consulta actual.</p>
        </div>

        <ul class="legend">
          <li v-for="item in legendItems" :key="item.label" class="legend__item">
            <span class="legend__swatch" :style="{ backgroundColor: item.color }" aria-hidden="true" />
            {{ item.label }}
          </li>
        </ul>
      </BaseCard>
    </div>

    <BaseCard
      v-if="respuesta"
      title="Resultados tabulares de la consulta Cypher"
      :description="`${respuesta.rows.length} filas proyectadas por Neo4j para ${respuesta.queryId.toUpperCase()}`"
      :badge="respuesta.queryId.toUpperCase()"
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th v-for="col in respuesta.columns" :key="col.key" scope="col">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in respuesta.rows" :key="idx">
              <td v-for="col in respuesta.columns" :key="col.key">
                {{ row[col.key] === null || row[col.key] === undefined ? '—' : row[col.key] }}
              </td>
            </tr>
            <tr v-if="!respuesta.rows.length">
              <td :colspan="respuesta.columns.length || 1" class="table__empty">Sin registros devueltos por Neo4j.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.graph-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(290px, 350px) minmax(0, 1fr);
}

@media (max-width: 1000px) {
  .graph-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert--error {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--coral-soft);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.query-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.query-option--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.query-option:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.query-option__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.query-option__meta {
  font-size: 12px;
  color: var(--color-text-muted);
}

.query-option__filters {
  font-size: 11px;
  color: var(--color-primary);
}

.node-inspector {
  margin-top: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.node-inspector__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.node-inspector__label {
  margin: 6px 0 10px;
  font-size: 13px;
  font-weight: 600;
  word-break: break-word;
}

.node-inspector__props {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-inspector__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  border-top: 1px dashed var(--color-border);
  padding-top: 4px;
}

.node-inspector__row dt {
  color: var(--color-text-muted);
}

.node-inspector__row dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.cypher-box {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-md);
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  overflow-x: auto;
}

.truncation-banner {
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: rgba(234, 179, 8, 0.14);
  border: 1px solid rgba(234, 179, 8, 0.35);
  font-size: 12px;
}

.canvas-wrapper {
  width: 100%;
  height: 440px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface-muted);
}

.placeholder--graph {
  min-height: 280px;
}
</style>
