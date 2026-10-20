<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useHealth } from '@/composables/useHealth'

const { report, loading, refresh } = useHealth()
const label = computed(() => ({ ok: 'Sistema operativo', degraded: 'Sistema degradado', offline: 'Sin conexión' })[report.value?.overall ?? 'offline'])
const services = computed(() => Object.entries(report.value?.services ?? {}).map(([name, service]) => ({ name: name === 'api' ? 'API' : name === 'mongodb' ? 'MongoDB' : 'Neo4j', ...service })))
</script>

<template>
  <details class="health-menu">
    <summary class="icon-button health-trigger" :title="report ? label : 'Consultando el sistema'" :aria-label="report ? label : 'Consultando el sistema'">
      <AppIcon name="pulse" /><span class="health-dot" :class="`health-dot--${report?.overall ?? 'unknown'}`" />
    </summary>
    <section class="health-popover" aria-label="Estado de los servicios">
      <div class="section-heading"><h2>Estado del sistema</h2><button class="icon-button" type="button" :disabled="loading" aria-label="Actualizar estado" @click="refresh"><AppIcon name="refresh" :size="18" /></button></div>
      <p class="hint">{{ report ? label : 'Consultando los servicios…' }}</p>
      <div v-for="service in services" :key="service.name" class="health-service">
        <div><strong>{{ service.name }}</strong><p v-if="service.error" class="health-error">{{ service.error }}</p></div>
        <span class="badge" :class="service.status === 'up' ? 'badge--success' : 'badge--warning'">{{ service.status === 'up' ? 'Disponible' : service.status === 'down' ? 'No disponible' : 'Sin verificar' }}</span>
      </div>
      <p v-if="report?.error" class="health-error">{{ report.error }}</p>
      <p class="hint">Actualización automática cada 30 segundos.</p>
    </section>
  </details>
</template>
