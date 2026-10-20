<script setup lang="ts">
import BaseCard from '@/components/BaseCard.vue'

const historyColumns = ['Año', 'Materia', 'Oportunidad', 'Resultado', 'Carrera objetivo', 'Institución', 'Municipio']
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Aspirantes y evaluaciones</h1>
        <p class="page-subtitle">
          Búsqueda por correlativo con filtros de carrera, materia, tipo de institución y ubicación;
          historial completo de evaluaciones y gestión (CRUD) de los registros.
        </p>
      </div>
      <span class="badge">Búsqueda y detalle</span>
    </header>

    <BaseCard
      title="Buscador de aspirantes"
      description="El correlativo es el identificador anónimo; una fila del CSV representa una evaluación."
      badge="Pendiente de conexión"
    >
      <div class="field-grid">
        <label class="field">
          Correlativo
          <input type="text" placeholder="Ej. 123456" disabled />
        </label>
        <label class="field">
          Carrera
          <select disabled>
            <option>Todas</option>
          </select>
        </label>
        <label class="field">
          Materia
          <select disabled>
            <option>Todas</option>
          </select>
        </label>
        <label class="field">
          Tipo de institución
          <select disabled>
            <option>Todos</option>
          </select>
        </label>
        <label class="field">
          Departamento / municipio
          <select disabled>
            <option>Todos</option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="btn btn--primary" type="button" disabled>Buscar</button>
        <button class="btn btn--ghost" type="button" disabled>Limpiar filtros</button>
      </div>
    </BaseCard>

    <div class="split-grid">
      <BaseCard
        title="Perfil del aspirante"
        description="Historial de desempeño y contexto disponible por evaluación (Q11 y Q15)."
        badge="Q11 / Q15"
      >
        <div class="placeholder">
          <p class="placeholder__title">Sin aspirante seleccionado</p>
          <p>Realiza una búsqueda para ver el detalle y su historial cronológico.</p>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th v-for="column in historyColumns" :key="column" scope="col">{{ column }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td :colspan="historyColumns.length" class="table__empty">Sin evaluaciones para mostrar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <BaseCard
        title="Gestión de registros"
        description="Alta, edición y eliminación de aspirantes y evaluaciones."
        badge="Pendiente de conexión"
      >
        <div class="actions">
          <button class="btn btn--primary" type="button" disabled>Nuevo aspirante</button>
          <button class="btn btn--ghost" type="button" disabled>Registrar evaluación</button>
        </div>
        <div class="placeholder">
          <p class="placeholder__title">Formulario pendiente</p>
          <p>
            Los formularios de alta y edición se conectarán a los endpoints del backend respetando las
            reglas ETL (normalización, faltantes y duplicados).
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
