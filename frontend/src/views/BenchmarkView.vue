<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'

const engineMetrics = [
  { label: 'Tiempo promedio', value: '—' },
  { label: 'Tiempo mínimo', value: '—' },
  { label: 'Tiempo máximo', value: '—' },
  { label: 'Registros / nodos leídos', value: '—' },
]

const resultColumns = ['Motor', 'Consulta', 'Repeticiones', 'Tiempo (ms)', 'Registros procesados', 'Estado']
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Comparativa de rendimiento MongoDB vs Neo4j</h1>
        <p class="page-subtitle">
          Medición del tiempo de respuesta de cada motor sobre el mismo escenario, con repeticiones
          controladas y registro de resultados para el análisis de conclusiones.
        </p>
      </div>
      <span class="badge">Rendimiento</span>
    </header>

    <BaseCard
      title="Configuración del benchmark"
      description="Selección de consulta equivalente, repeticiones y ejecución controlada."
      badge="Pendiente de conexión"
    >
      <div class="field-grid">
        <label class="field">
          Escenario
          <select disabled>
            <option>Sin seleccionar</option>
          </select>
        </label>
        <label class="field">
          Repeticiones
          <select disabled>
            <option>5</option>
          </select>
        </label>
        <label class="field">
          Límite de resultados
          <select disabled>
            <option>1000</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="btn btn--primary" type="button" disabled>Ejecutar comparación</button>
      </div>
      <p class="hint">
        El escenario define el mismo conjunto de datos para ambos motores antes de medir tiempos.
      </p>
    </BaseCard>

    <div class="split-grid">
      <BaseCard title="MongoDB" description="Consultas agregadas sobre la colección de evaluaciones.">
        <ul class="metric-list">
          <li v-for="metric in engineMetrics" :key="metric.label" class="metric">
            <span class="metric__label">{{ metric.label }}</span>
            <span class="metric__value">{{ metric.value }}</span>
          </li>
        </ul>
      </BaseCard>

      <BaseCard title="Neo4j" description="Recorridos Cypher sobre el grafo de relaciones.">
        <ul class="metric-list">
          <li v-for="metric in engineMetrics" :key="metric.label" class="metric">
            <span class="metric__label">{{ metric.label }}</span>
            <span class="metric__value">{{ metric.value }}</span>
          </li>
        </ul>
      </BaseCard>
    </div>

    <BaseCard
      title="Resultados por corrida"
      description="Detalle de cada ejecución para sustentar las conclusiones del proyecto."
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th v-for="column in resultColumns" :key="column" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :colspan="resultColumns.length" class="table__empty">
                Aún no se han ejecutado comparaciones.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseCard title="Conclusión comparativa" badge="Documentación">
      <p class="hint">
        Con los resultados medidos se redactará la comparación de ambos motores (fortalezas por tipo de
        consulta, tiempos y volumen), sin adelantar hallazgos antes de ejecutar las mediciones.
      </p>
    </BaseCard>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
