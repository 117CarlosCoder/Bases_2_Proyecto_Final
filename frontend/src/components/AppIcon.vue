<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 })

const paths: Record<string, string> = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 15h7 M14 20h7',
  upload: 'M12 16V3 M7 8l5-5 5 5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  book: 'M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z M12 6v15 M6 8h3 M6 12h3 M15 8h3 M15 12h3',
  graduation: 'm2 9 10-5 10 5-10 5z M6 11v6c4 3 8 3 12 0v-6 M22 9v8',
  graph: 'M9 6h6 M6 9v6 M9 18h6 M18 9v6 M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z',
  chart: 'M4 3v18h17 M8 16v-4 M13 16V7 M18 16v-7',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2z M7 3v4 M17 3v4 M3 10h18 M7 14h2 M15 14h2 M7 17h2 M15 17h2',
  folder: 'M3 7V5h6l2 2h10v13H3z M3 10h18 M10 15h4',
  chevron: 'm9 5 7 7-7 7',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
  sun: 'M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  pulse: 'M2 12h4l3-8 6 16 3-8h4',
  refresh: 'M20 7a9 9 0 1 0 1 8 M20 2v5h-5',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
  check: 'm5 12 4 4L19 6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-4 M17 3a4 4 0 0 1 0 8',
  info: 'M12 11v6 M12 7v.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] ?? paths.dashboard" />
  </svg>
</template>
