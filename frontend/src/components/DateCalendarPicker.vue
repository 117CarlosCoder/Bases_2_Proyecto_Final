<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parseDate, type DateValue } from '@internationalized/date'
import { CalendarRoot, CalendarHeader, CalendarHeading, CalendarPrev, CalendarNext, CalendarGrid, CalendarGridHead, CalendarGridBody, CalendarGridRow, CalendarHeadCell, CalendarCell, CalendarCellTrigger, PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import AppIcon from './AppIcon.vue'
import type { CalendarioDashboard } from '@/types/analytics'

const props = defineProps<{
  calendar: CalendarioDashboard
  disabled: boolean
  mode: 'day' | 'week'
}>()

const fechaSeleccionada = defineModel<string>({ required: true })
const emit = defineEmits<{ change: [] }>()

const abierto = ref(false)

const fechaMinima = computed(() => parseDate(props.calendar.min))
const fechaMaxima = computed(() => parseDate(props.calendar.max))
const fechaCalendario = computed(() => {
  const textoFecha = fechaSeleccionada.value || props.calendar.initialDate
  return parseDate(textoFecha)
})

const semanaActual = computed(() => {
  return props.calendar.weeks.find(
    semana => semana.desde <= fechaSeleccionada.value && semana.hasta >= fechaSeleccionada.value,
  )
})

const formateadorFecha = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const etiquetaBoton = computed(() => {
  if (props.mode === 'week') {
    return semanaActual.value?.label ?? 'Seleccionar semana'
  }
  return formateadorFecha.format(fechaCalendario.value.toDate('UTC'))
})

function perteneceASemanaActual(dia: DateValue): boolean {
  if (props.mode !== 'week' || !semanaActual.value) {
    return false
  }
  const fechaIso = dia.toString()
  return fechaIso >= semanaActual.value.desde && fechaIso <= semanaActual.value.hasta
}

function seleccionarFecha(nuevaFecha: DateValue | undefined) {
  if (!nuevaFecha) {
    abierto.value = false
    return
  }
  fechaSeleccionada.value = nuevaFecha.toString()
  abierto.value = false
  emit('change')
}

watch(
  [() => props.calendar.min, () => props.disabled],
  () => {
    abierto.value = false
  },
)
</script>

<template>
  <PopoverRoot v-model:open="abierto">
    <PopoverTrigger as-child>
      <button
        class="calendar-trigger"
        type="button"
        :disabled="disabled"
        :aria-label="`Seleccionar ${mode === 'week' ? 'semana' : 'día'}: ${etiquetaBoton}`"
      >
        <AppIcon name="calendar" :size="15" />
        <span>{{ etiquetaBoton }}</span>
        <AppIcon name="chevron" :size="13" class="calendar-trigger-chevron" />
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent as-child align="end" :side-offset="8" :collision-padding="20">
        <div
          class="calendar-popover"
          :aria-label="`Calendario: ${mode === 'week' ? 'seleccionar semana' : 'seleccionar día'}`"
        >
          <CalendarRoot
            :key="calendar.min"
            v-slot="{ grid, weekDays }"
            :model-value="fechaCalendario"
            :min-value="fechaMinima"
            :max-value="fechaMaxima"
            :week-starts-on="1"
            locale="es-GT"
            weekday-format="narrow"
            initial-focus
            @update:model-value="seleccionarFecha"
          >
            <CalendarHeader class="calendar-header">
              <CalendarPrev class="calendar-nav" aria-label="Mes anterior">
                <AppIcon name="chevron" :size="15" class="calendar-previous" />
              </CalendarPrev>
              <CalendarHeading as="strong" />
              <CalendarNext class="calendar-nav" aria-label="Mes siguiente">
                <AppIcon name="chevron" :size="15" />
              </CalendarNext>
            </CalendarHeader>

            <CalendarGrid
              v-for="mes in grid"
              :key="mes.value.toString()"
              class="calendar-grid"
              :class="{ 'calendar-grid--week': mode === 'week' }"
            >
              <CalendarGridHead>
                <CalendarGridRow>
                  <CalendarHeadCell
                    v-for="(nombreDia, index) in weekDays"
                    :key="index"
                    class="calendar-weekday"
                  >
                    {{ nombreDia }}
                  </CalendarHeadCell>
                </CalendarGridRow>
              </CalendarGridHead>

              <CalendarGridBody>
                <CalendarGridRow
                  v-for="(diasSemana, rowIndex) in mes.rows"
                  :key="rowIndex"
                  class="calendar-row"
                >
                  <CalendarCell
                    v-for="dia in diasSemana"
                    :key="dia.toString()"
                    :date="dia"
                    class="calendar-cell"
                  >
                    <CalendarCellTrigger
                      as="button"
                      type="button"
                      :day="dia"
                      :month="mes.value"
                      class="calendar-date"
                      :class="{ 'calendar-date--range': perteneceASemanaActual(dia) }"
                    />
                  </CalendarCell>
                </CalendarGridRow>
              </CalendarGridBody>
            </CalendarGrid>
          </CalendarRoot>

          <p class="calendar-hint">
            {{ mode === 'week' ? 'Selecciona una semana · lunes a domingo' : 'Selecciona un día del calendario' }}
          </p>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped src="./calendar-picker.css"></style>
