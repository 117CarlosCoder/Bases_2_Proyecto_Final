import { computed, ref } from 'vue'

import { getHealth, type HealthReport } from '@/services/api'

const AUTO_REFRESH_INTERVAL_MS = 30_000

const report = ref<HealthReport | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const overall = computed(() => report.value?.overall ?? 'unknown')
const reachable = computed(() => report.value?.reachable ?? false)

let timer: number | null = null

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

function stopAutoRefresh(): void {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
}

function startAutoRefresh(intervalMs: number = AUTO_REFRESH_INTERVAL_MS): void {
  stopAutoRefresh()
  void refresh()
  timer = window.setInterval(() => void refresh(), intervalMs)
}


export function useHealth() {
  return {
    report,
    loading,
    error,
    overall,
    reachable,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
  }
}
