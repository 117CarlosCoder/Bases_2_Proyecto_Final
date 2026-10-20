<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ months: { total: number; approved: number }[]; year: string }>()
const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const active = ref<number | null>(null)
const max = computed(() => Math.max(4, ...props.months.map(m => m.total)))
const x = (i: number) => 38 + i * 61
const y = (n: number) => 236 - n / max.value * 196
const detail = computed(() => active.value === null ? null : props.months[active.value])

function curve(key: 'total' | 'approved') {
  return props.months.map((point, i) => {
    if (i === 0) return `M ${x(i)} ${y(point[key])}`
    const previous = props.months[i - 1]!
    const middle = (x(i - 1) + x(i)) / 2
    return `C ${middle} ${y(previous[key])}, ${middle} ${y(point[key])}, ${x(i)} ${y(point[key])}`
  }).join(' ')
}
watch(() => props.year, () => { active.value = null })
</script>

<template>
  <div class="chart" @mouseleave="active = null">
    <div class="chart-subheading"><strong>Evaluaciones por mes</strong><div class="legend"><span><i class="dot dot--blue" />Total</span><span><i class="dot dot--green" />Aprobadas</span></div></div>
    <svg class="line-chart" viewBox="0 0 750 286" role="group" :aria-label="`Evaluaciones del CSV de muestra en ${year}. Enfoca cada mes para ver sus valores.`">
      <g v-for="step in 5" :key="step" class="chart-grid">
        <line x1="38" x2="709" :y1="40 + (step - 1) * 49" :y2="40 + (step - 1) * 49" />
        <text x="20" :y="44 + (step - 1) * 49" text-anchor="end">{{ Math.round(max * (5 - step) / 4) }}</text>
      </g>
      <rect v-if="active !== null" :x="x(active) - 22" y="30" width="44" height="224" rx="6" class="chart-selection" />
      <path :d="curve('total')" class="chart-line chart-line--blue" />
      <path :d="curve('approved')" class="chart-line chart-line--green" />
      <g v-for="(month, i) in months" :key="i" tabindex="0" role="img" :aria-label="`${labels[i]} ${year}: ${month.total} evaluaciones, ${month.approved} aprobadas`" @focus="active = i" @blur="active = null" @mouseenter="active = i" @click="active = i">
        <rect :x="x(i) - 27" y="30" width="54" height="250" fill="transparent" />
        <circle v-if="active === i" :cx="x(i)" :cy="y(month.total)" r="5" class="chart-point chart-point--blue" />
        <circle v-if="active === i" :cx="x(i)" :cy="y(month.approved)" r="5" class="chart-point chart-point--green" />
        <text :x="x(i)" y="275" text-anchor="middle" class="chart-month">{{ labels[i] }}</text>
      </g>
    </svg>
    <div class="chart-detail" aria-live="polite"><template v-if="detail && active !== null"><strong>{{ labels[active] }} {{ year }}</strong><span>{{ detail.total }} evaluaciones</span><span>{{ detail.approved }} aprobadas</span></template><span v-else>Selecciona un mes para explorar la muestra.</span></div>
  </div>
</template>
