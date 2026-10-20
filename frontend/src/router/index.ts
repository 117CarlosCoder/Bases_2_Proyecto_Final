import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'dashboard' } },
  {
    path: '/carga',
    name: 'carga',
    component: () => import('@/views/ImportView.vue'),
    meta: { title: 'Carga de CSV e historial' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Consultas analíticas Q1–Q6' },
  },
  {
    path: '/aspirantes',
    name: 'aspirantes',
    component: () => import('@/views/ApplicantsView.vue'),
    meta: { title: 'Aspirantes y evaluaciones' },
  },
  {
    path: '/grafos',
    name: 'grafos',
    component: () => import('@/views/GraphExplorerView.vue'),
    meta: { title: 'Explorador de grafos Neo4j' },
  },
  {
    path: '/comparacion',
    name: 'comparacion',
    component: () => import('@/views/BenchmarkView.vue'),
    meta: { title: 'Comparativa MongoDB vs Neo4j' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'no-encontrada',
    redirect: { name: 'carga' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  linkActiveClass: 'is-active',
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : null
  document.title = title ? `${title} · Pruebas Específicas USAC` : 'Pruebas Específicas USAC · Panel Analítico'
})

export default router
