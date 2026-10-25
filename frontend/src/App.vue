<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { RouterLink, RouterView } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import HealthBanner from '@/components/HealthBanner.vue'
import { useHealth } from '@/composables/useHealth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/carga', label: 'Importaciones', icon: 'upload' },
  { to: '/aspirantes', label: 'Aspirantes', icon: 'graduation' },
  { to: '/grafos', label: 'Explorador de grafos', icon: 'graph' },
  { to: '/comparacion', label: 'Comparación', icon: 'chart' },
]
const expanded = ref(false)
const dark = useDark({ selector: 'html', attribute: 'data-theme', valueDark: 'dark', valueLight: 'light', storageKey: 'usac-theme', initialValue: 'light' })
const toggleTheme = useToggle(dark)
const health = useHealth()

onMounted(() => {
  health.startAutoRefresh()
})
onBeforeUnmount(() => health.stopAutoRefresh())
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--expanded': expanded }">
    <aside id="main-navigation" class="app-sidebar">
      <RouterLink to="/dashboard" class="brand" aria-label="USAC · Inicio">
        <img class="brand__mark usac-logo" src="/images/usac-escudo.png" alt="" width="44" height="44" />
        <span class="rail-label brand__name">USAC <small>Pruebas específicas</small></span>
      </RouterLink>
      <nav class="nav" aria-label="Navegación principal">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav__link" :title="item.label" :aria-label="item.label">
          <span class="nav__icon"><AppIcon :name="item.icon" /></span>
          <span class="rail-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-signature" title="Universidad de San Carlos de Guatemala">US<span class="rail-label">AC · Guatemala</span></div>
      </div>
    </aside>
    <div class="app-main">
      <header class="topbar">
        <div class="topbar__intro">
          <button class="icon-button menu-button" type="button" :aria-expanded="expanded" aria-controls="main-navigation" aria-label="Mostrar u ocultar nombres del menú" @click="expanded = !expanded"><AppIcon name="menu" :size="21" /></button>
          <p class="topbar__greeting">Sistema de Análisis Académicos</p>
          <span class="topbar__context">Tu espacio de análisis académico</span>
        </div>
        <div class="topbar__actions">
          <button class="icon-button theme-button" type="button" :aria-label="dark ? 'Activar modo claro' : 'Activar modo oscuro'" :title="dark ? 'Modo claro' : 'Modo oscuro'" @click="toggleTheme()"><AppIcon :name="dark ? 'sun' : 'moon'" /></button>
          <HealthBanner />
          <img class="user-avatar usac-logo" src="/images/usac-escudo.png" alt="Escudo de la USAC" width="38" height="38" />
        </div>
      </header>
      <main class="app-content"><RouterView /></main>
      <footer class="app-footer"><span>Pruebas específicas · USAC</span><span>Bases de Datos 2</span></footer>
    </div>
  </div>
</template>
