<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'

interface GraphQuery {
  id: string
  title: string
  filters: string
  description: string
}

const queries: GraphQuery[] = [
  {
    id: 'G1',
    title: 'Recorrido de un aspirante',
    filters: 'Correlativo · año de ingreso',
    description: 'Aspirante → evaluaciones → materias y carreras asociadas.',
  },
  {
    id: 'G2',
    title: 'Procedencia y demanda',
    filters: 'Departamento · año',
    description: 'Departamento ← municipio ← evaluación → carrera, contando aspirantes distintos.',
  },
  {
    id: 'G3',
    title: 'Trayectoria de resultados',
    filters: 'Materia · año de ingreso',
    description: 'Aspirantes con una evaluación no aprobada seguida de una aprobada en la misma materia.',
  },
]

const legendItems = [
  { label: 'Aspirante', color: '#1d4ed8' },
  { label: 'Evaluación', color: '#7c3aed' },
  { label: 'Materia', color: '#0891b2' },
  { label: 'Carrera', color: '#ca8a04' },
  { label: 'Municipio', color: '#16a34a' },
  { label: 'Tipo de institución', color: '#dc2626' },
]
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Explorador de grafos Neo4j G1–G3</h1>
        <p class="page-subtitle">
          Selección de consulta Cypher, filtros obligatorios, leyenda por tipo de nodo, detalle al
          seleccionar un nodo y aviso de límite de expansión.
        </p>
      </div>
      <span class="badge">Consultas Cypher</span>
    </header>

    <div class="graph-layout">
      <BaseCard title="Consultas disponibles" description="Cada consulta exige al menos un filtro." badge="G1 – G3">
        <ul class="query-list">
          <li v-for="query in queries" :key="query.id">
            <button class="query-option" type="button" disabled>
              <span class="query-option__title">{{ query.id }} · {{ query.title }}</span>
              <span class="query-option__meta">{{ query.description }}</span>
              <span class="query-option__filters">Filtros: {{ query.filters }}</span>
            </button>
          </li>
        </ul>
        <p class="hint">La selección se conectará a los endpoints del servicio correspondiente.</p>
      </BaseCard>

      <BaseCard
        title="Visualización del grafo"
        description="Nodos y aristas con identificadores estables; sin dibujar el grafo completo."
        badge="Límite de nodos"
      >
        <div class="field-grid">
          <label class="field">
            Valor del filtro principal
            <input type="text" placeholder="Correlativo, departamento o materia" disabled />
          </label>
          <label class="field">
            Año de ingreso
            <select disabled>
              <option>Todos</option>
            </select>
          </label>
          <label class="field">
            Límite de nodos
            <select disabled>
              <option>50</option>
            </select>
          </label>
        </div>

        <div class="placeholder placeholder--graph">
          <p class="placeholder__title">Lienzo del grafo</p>
          <p>La visualización interactiva se conectará al conectar el servicio.</p>
        </div>

        <ul class="legend">
          <li v-for="item in legendItems" :key="item.label" class="legend__item">
            <span class="legend__swatch" :style="{ backgroundColor: item.color }" aria-hidden="true" />
            {{ item.label }}
          </li>
        </ul>

        <p class="hint">
          Si el resultado supera el límite configurado, se mostrará un aviso de resultados truncados.
        </p>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.graph-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
}

@media (max-width: 1000px) {
  .graph-layout {
    grid-template-columns: minmax(0, 1fr);
  }
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

.query-option:disabled {
  opacity: 0.8;
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

.placeholder--graph {
  min-height: 320px;
}
</style>
