<script setup lang="ts">
import DateCalendarPicker from './DateCalendarPicker.vue'
import type { CalendarioDashboard, DashboardPeriod } from '@/types/analytics'

const props = defineProps<{
  year: string
  calendar: CalendarioDashboard | null
  disabled: boolean
}>()

const period = defineModel<DashboardPeriod>('period', { required: true })
const month = defineModel<number>('month', { required: true })
const week = defineModel<string>('week', { required: true })
const day = defineModel<string>('day', { required: true })
const emit = defineEmits<{ change: [] }>()

const opcionesPeriodo: { value: DashboardPeriod; label: string }[] = [
  { value: 'year', label: 'Año completo' },
  { value: 'month', label: 'Mes' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Día' },
]

const nombresMeses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function cambiarPeriodo(nuevoPeriodo: DashboardPeriod) {
  if (period.value === nuevoPeriodo) return
  period.value = nuevoPeriodo
  emit('change')
}
</script>

<template>
  <div class="period-controls">
    <div class="period-options" role="group" aria-label="Periodo de las estadísticas">
      <button
        v-for="opcion in opcionesPeriodo"
        :key="opcion.value"
        type="button"
        :aria-pressed="period === opcion.value"
        :disabled="disabled || !props.year"
        @click="cambiarPeriodo(opcion.value)"
      >
        {{ opcion.label }}
      </button>
    </div>

    <label v-if="period === 'month'" class="period-choice">
      <span class="sr-only">Mes del año seleccionado</span>
      <select v-model.number="month" :disabled="disabled" @change="emit('change')">
        <option v-for="(nombreMes, index) in nombresMeses" :key="index" :value="index + 1">
          {{ nombreMes }}
        </option>
      </select>
    </label>

    <div v-else-if="calendar && period === 'week'" class="period-choice">
      <DateCalendarPicker
        v-model="week"
        :calendar="calendar"
        :disabled="disabled"
        mode="week"
        @change="emit('change')"
      />
    </div>

    <div v-else-if="calendar && period === 'day'" class="period-choice">
      <DateCalendarPicker
        v-model="day"
        :calendar="calendar"
        :disabled="disabled"
        mode="day"
        @change="emit('change')"
      />
    </div>
  </div>
</template>

<style scoped>
.period-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin: 5px 0 12px;
}

.period-options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface-muted);
}

.period-options button {
  padding: 6px 11px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
}

.period-options button[aria-pressed='true'] {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary-soft);
}

.period-options button:hover:not(:disabled) {
  color: var(--color-text);
}

.period-options button:disabled {
  opacity: 0.5;
}

.period-choice {
  min-width: 0;
  max-width: 100%;
}

.period-choice select,
.period-choice input {
  width: 100%;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 11px;
}

@media (max-width: 540px) {
  .period-options {
    width: 100%;
  }

  .period-options button {
    flex: 1;
    padding: 6px 5px;
  }

  .period-choice {
    width: 100%;
  }
}
</style>
