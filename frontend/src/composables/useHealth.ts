import { computed, ref } from 'vue'
import { createSharedComposable, useIntervalFn } from '@vueuse/core'

import { getHealth } from '@/services/health.service'
import type { HealthReport } from '@/types/health'

const AUTO_REFRESH_INTERVAL_MS = 30_000

export const useHealth = createSharedComposable(() => {
  const report = ref<HealthReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const overall = computed(() => report.value?.overall ?? 'unknown')
  const reachable = computed(() => report.value?.reachable ?? false)

  const interval = ref(AUTO_REFRESH_INTERVAL_MS)
  const { pause, resume } = useIntervalFn(() => void refresh(), interval, { immediate: false, immediateCallback: true })

  async function refresh(): Promise<void> {
    if (loading.value) {
      return
    }
    loading.value = true
    try {
      const nextReport = await getHealth()
      report.value = nextReport
      error.value = nextReport.error
    } finally {
      loading.value = false
    }
  }

  function startAutoRefresh(intervalMs: number = AUTO_REFRESH_INTERVAL_MS): void {
    pause()
    interval.value = intervalMs
    resume()
  }

  return {
    report,
    loading,
    error,
    overall,
    reachable,
    refresh,
    startAutoRefresh,
    stopAutoRefresh: pause,
  }
})
