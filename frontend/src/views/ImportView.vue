<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'

const summaryChips = [
  { label: 'Importaciones', value: '—' },
  { label: 'Registros procesados', value: '—' },
  { label: 'Filas rechazadas', value: '—' },
  { label: 'Sincronización Neo4j', value: '—' },
]

const historyColumns = ['Archivo', 'Año', 'Leídos', 'Válidos', 'Rechazados', 'Duración', 'Estado', 'Neo4j']
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Carga de CSV e historial</h1>
        <p class="page-subtitle">
          Carga de uno o varios archivos de pruebas específicas, resultado por archivo, registro de filas
          rechazadas con su causa e historial de importaciones con el estado de sincronización hacia Neo4j.
        </p>
      </div>
      <span class="badge">ETL</span>
    </header>

    <ul class="stat-grid">
      <li v-for="chip in summaryChips" :key="chip.label" class="stat">
        <span class="stat__value">{{ chip.value }}</span>
        <span class="stat__label">{{ chip.label }}</span>
      </li>
    </ul>

    <div class="split-grid">
      <BaseCard
        title="Carga de archivos CSV"
        description="Selección múltiple con límite de tamaño y validación de encabezados."
        badge="Pendiente de conexión"
      >
        <div class="placeholder placeholder--dropzone">
          <p class="placeholder__title">Zona de carga</p>
          <p>Arrastra los CSV o usa el selector. Se habilitará al conectar el endpoint de importaciones.</p>
          <button class="btn btn--primary" type="button" disabled>Seleccionar archivos</button>
        </div>
        <p class="hint">
          El progreso por archivo y el estado de sincronización con Neo4j se mostrarán en esta tarjeta.
        </p>
      </BaseCard>

      <BaseCard
        title="Errores y rechazos"
        description="Detalle por fila de los registros rechazados y sus causas."
        badge="Pendiente de conexión"
      >
        <div class="placeholder">
          <p class="placeholder__title">Sin datos</p>
          <p>Aquí se listarán fila, causa y valores relevantes de cada rechazo.</p>
        </div>
      </BaseCard>
    </div>

    <BaseCard
      title="Historial de importaciones"
      description="Resultado por archivo: leídos, válidos, rechazados, duración y estado final."
    >
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th v-for="column in historyColumns" :key="column" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :colspan="historyColumns.length" class="table__empty">
                Aún no hay importaciones registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>
