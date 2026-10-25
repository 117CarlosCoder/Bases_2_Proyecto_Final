<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { getHealth } from '@/services/health.service'
import type { HealthReport, ServiceStatus } from '@/types/health'

const report = ref<HealthReport | null>(null)
const loading = ref(false)
let temporizador: number | undefined

async function consultarEstado() {
  if (loading.value) return
  loading.value = true
  try {
    report.value = await getHealth()
  } finally {
    loading.value = false
  }
}

const textoEstadoGeneral = computed(() => {
  const estado = report.value?.overall ?? 'offline'
  if (estado === 'ok') return 'Sistema operativo'
  if (estado === 'degraded') return 'Sistema degradado'
  return 'Sin conexión'
})

const listaServicios = computed(() => {
  const servicios = report.value?.services
  if (!servicios) return []

  return [
    { nombre: 'API', status: servicios.api.status, error: servicios.api.error },
    { nombre: 'MongoDB', status: servicios.mongodb.status, error: servicios.mongodb.error },
    { nombre: 'Neo4j', status: servicios.neo4j.status, error: servicios.neo4j.error },
  ]
})

function textoEstadoServicio(status: ServiceStatus): string {
  if (status === 'up') return 'Disponible'
  if (status === 'down') return 'No disponible'
  return 'Sin verificar'
}

onMounted(() => {
  void consultarEstado()
  temporizador = window.setInterval(consultarEstado, 30_000)
})

onBeforeUnmount(() => {
  if (temporizador !== undefined) {
    window.clearInterval(temporizador)
  }
})
</script>

<template>
  <details class="health-menu">
    <summary
      class="icon-button health-trigger"
      :title="report ? textoEstadoGeneral : 'Consultando el sistema'"
      :aria-label="report ? textoEstadoGeneral : 'Consultando el sistema'"
    >
      <AppIcon name="pulse" />
      <span class="health-dot" :class="`health-dot--${report?.overall ?? 'unknown'}`" />
    </summary>

    <section class="health-popover" aria-label="Estado de los servicios">
      <div class="section-heading">
        <h2>Estado del sistema</h2>
        <button
          class="icon-button"
          type="button"
          :disabled="loading"
          aria-label="Actualizar estado"
          @click="consultarEstado"
        >
          <AppIcon name="refresh" :size="18" />
        </button>
      </div>

      <p class="hint">{{ report ? textoEstadoGeneral : 'Consultando los servicios…' }}</p>

      <div v-for="servicio in listaServicios" :key="servicio.nombre" class="health-service">
        <div>
          <strong>{{ servicio.nombre }}</strong>
          <p v-if="servicio.error" class="health-error">{{ servicio.error }}</p>
        </div>
        <span class="badge" :class="servicio.status === 'up' ? 'badge--success' : 'badge--warning'">
          {{ textoEstadoServicio(servicio.status) }}
        </span>
      </div>

      <p v-if="report?.error" class="health-error">{{ report.error }}</p>
      <p class="hint">Actualización automática cada 30 segundos.</p>
    </section>
  </details>
</template>
