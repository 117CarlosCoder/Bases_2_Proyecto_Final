<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  badge?: string
}>()
</script>

<template>
  <section class="card">
    <header v-if="$slots.header || title" class="card__header">
      <slot name="header">
        <div>
          <h3 class="card__title">{{ title }}</h3>
          <p v-if="description" class="card__description">{{ description }}</p>
        </div>
        <span v-if="badge" class="badge">{{ badge }}</span>
      </slot>
    </header>

    <div class="card__body">
      <slot />
    </div>
  </section>
</template>
