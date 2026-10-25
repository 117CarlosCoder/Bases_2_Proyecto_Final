<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BaseCard from '@/components/BaseCard.vue'
import { getApplicantDetail, getApplicants, getApplicantsFilters } from '@/services/applicants.service'
import type { DetalleAspirante, FiltrosDisponiblesAspirantes, RespuestaListaAspirantes } from '@/types/applicants'

const filtrosDisponibles = ref<FiltrosDisponiblesAspirantes>({
  anios: [],
  carreras: [],
  materias: [],
  tipos: [],
  departamentos: [],
})

const buscar = ref('')
const anio = ref('')
const carrera = ref('')
const materia = ref('')
const tipo = ref('')
const departamento = ref('')
const pagina = ref(1)
const limite = ref(10)

const cargandoLista = ref(false)
const cargandoDetalle = ref(false)
const error = ref('')

const lista = ref<RespuestaListaAspirantes>()
const detalle = ref<DetalleAspirante | null>(null)
const correlativoSeleccionado = ref('')

const historyColumns = [
  'Año',
  'Mes',
  'Materia',
  'Oportunidad',
  'Resultado',
  'Carrera objetivo',
  'Institución',
  'Municipio',
]

async function cargarFiltros() {
  try {
    filtrosDisponibles.value = await getApplicantsFilters()
  } catch {
    filtrosDisponibles.value = { anios: [], carreras: [], materias: [], tipos: [], departamentos: [] }
  }
}

async function buscarAspirantes(reiniciarPagina = true) {
  if (reiniciarPagina) pagina.value = 1
  cargandoLista.value = true
  error.value = ''
  try {
    const respuesta = await getApplicants({
      buscar: buscar.value,
      anio: anio.value ? Number(anio.value) : undefined,
      carrera: carrera.value,
      materia: materia.value,
      tipo: tipo.value,
      departamento: departamento.value,
      pagina: pagina.value,
      limite: limite.value,
    })
    lista.value = respuesta

    const primero = respuesta.items[0]
    if (primero && !correlativoSeleccionado.value) {
      await seleccionarAspirante(primero.correlativo)
    } else if (!respuesta.items.length) {
      detalle.value = null
      correlativoSeleccionado.value = ''
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo consultar el listado de aspirantes.'
  } finally {
    cargandoLista.value = false
  }
}

async function seleccionarAspirante(correlativo: string) {
  correlativoSeleccionado.value = correlativo
  cargandoDetalle.value = true
  error.value = ''
  try {
    detalle.value = await getApplicantDetail(correlativo)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el detalle del aspirante.'
  } finally {
    cargandoDetalle.value = false
  }
}

async function limpiarFiltros() {
  buscar.value = ''
  anio.value = ''
  carrera.value = ''
  materia.value = ''
  tipo.value = ''
  departamento.value = ''
  correlativoSeleccionado.value = ''
  await buscarAspirantes(true)
}

async function cambiarPagina(nuevaPagina: number | null | undefined) {
  if (!nuevaPagina) return
  pagina.value = nuevaPagina
  await buscarAspirantes(false)
}

onMounted(async () => {
  await Promise.all([cargarFiltros(), buscarAspirantes(true)])
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Aspirantes y evaluaciones</h1>
      </div>
    </header>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

    <BaseCard
      title="Buscador de aspirantes"
      description="Filtra los aspirantes registrados y selecciona uno para inspeccionar su historial completo."
      badge="Filtros dinámicos"
    >
      <div class="field-grid">
        <label class="field">
          Correlativo o carnet
          <input
            v-model="buscar"
            type="text"
            placeholder="Ej. 123456"
            @keyup.enter="buscarAspirantes(true)"
          />
        </label>
        <label class="field">
          Año
          <select v-model="anio" @change="buscarAspirantes(true)">
            <option value="">Todos</option>
            <option v-for="item in filtrosDisponibles.anios" :key="item" :value="String(item)">
              {{ item }}
            </option>
          </select>
        </label>
        <label class="field">
          Carrera
          <select v-model="carrera" @change="buscarAspirantes(true)">
            <option value="">Todas</option>
            <option v-for="item in filtrosDisponibles.carreras" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
        <label class="field">
          Materia
          <select v-model="materia" @change="buscarAspirantes(true)">
            <option value="">Todas</option>
            <option v-for="item in filtrosDisponibles.materias" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
        <label class="field">
          Tipo de institución
          <select v-model="tipo" @change="buscarAspirantes(true)">
            <option value="">Todos</option>
            <option v-for="item in filtrosDisponibles.tipos" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
        <label class="field">
          Departamento
          <select v-model="departamento" @change="buscarAspirantes(true)">
            <option value="">Todos</option>
            <option v-for="item in filtrosDisponibles.departamentos" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          type="button"
          :disabled="cargandoLista"
          @click="buscarAspirantes(true)"
        >
          {{ cargandoLista ? 'Buscando…' : 'Buscar' }}
        </button>
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="cargandoLista"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>
    </BaseCard>

    <div class="split-grid">
      <BaseCard
        title="Listado de aspirantes (P15)"
        :description="lista ? `${lista.total} aspirantes encontrados` : 'Resultados agregados por aspirante'"
        badge="P15"
      >
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Correlativo</th>
                <th scope="col">Carnet</th>
                <th scope="col">Año</th>
                <th scope="col">Carrera objetivo</th>
                <th scope="col">Institución</th>
                <th scope="col">Eval.</th>
                <th scope="col">Aprobación</th>
                <th scope="col">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in lista?.items ?? []"
                :key="item.correlativo"
                :class="{ 'row--selected': item.correlativo === correlativoSeleccionado }"
              >
                <td><strong>{{ item.correlativo }}</strong></td>
                <td>{{ item.carnet ?? '—' }}</td>
                <td>{{ item.anio_evaluacion }}</td>
                <td>{{ item.carrera_objetivo }}</td>
                <td>{{ item.establecimiento }} ({{ item.tipo_establecimiento }})</td>
                <td>{{ item.aprobadas }} / {{ item.evaluaciones }}</td>
                <td>{{ item.porcentaje_aprobacion }}%</td>
                <td>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="seleccionarAspirante(item.correlativo)"
                  >
                    Ver perfil
                  </button>
                </td>
              </tr>
              <tr v-if="!lista?.items?.length">
                <td colspan="8" class="table__empty">
                  {{ cargandoLista ? 'Consultando aspirantes…' : 'Sin aspirantes para los filtros seleccionados.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="lista && lista.paginas > 1" class="pagination-bar">
          <span>
            Página <strong>{{ lista.pagina }}</strong> de {{ lista.paginas }} ({{ lista.total }} aspirantes)
          </span>
          <div class="actions">
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!lista.paginaAnterior || cargandoLista"
              @click="cambiarPagina(lista.paginaAnterior)"
            >
              Anterior
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!lista.paginaSiguiente || cargandoLista"
              @click="cambiarPagina(lista.paginaSiguiente)"
            >
              Siguiente
            </button>
          </div>
        </div>
      </BaseCard>

      <BaseCard
        title="Perfil e historial del aspirante (P11 / P15)"
        description="Resumen demográfico, carrera objetivo e historial cronológico de evaluaciones."
        badge="P11 / P15"
      >
        <div v-if="detalle" class="profile-box">
          <div class="profile-header">
            <div>
              <h3 class="profile-title">Aspirante {{ detalle.perfil.correlativo }}</h3>
              <p class="profile-meta">
                Carnet: <strong>{{ detalle.perfil.carnet ?? 'Sin carnet' }}</strong> ·
                Sexo: <strong>{{ detalle.perfil.sexo }}</strong> ·
                Edad: <strong>{{ detalle.perfil.edad ?? 'N/D' }}</strong>
              </p>
              <p class="profile-meta">
                Carrera: <strong>{{ detalle.perfil.carrera_objetivo }}</strong> ·
                Institución: <strong>{{ detalle.perfil.establecimiento }}</strong>
                ({{ detalle.perfil.municipio_establecimiento }}, {{ detalle.perfil.departamento_establecimiento }})
              </p>
            </div>
            <RouterLink
              :to="`/grafos?correlativo=${encodeURIComponent(detalle.perfil.correlativo)}`"
              class="btn btn--ghost btn--sm"
            >
              Ver en Grafos
            </RouterLink>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th v-for="column in historyColumns" :key="column" scope="col">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ev in detalle.historial" :key="ev.evaluacion_uid">
                  <td>{{ ev.anio_evaluacion }}</td>
                  <td>{{ ev.mes_asignacion }}</td>
                  <td>{{ ev.materia_evaluada }}</td>
                  <td>{{ ev.numero_evaluacion }}</td>
                  <td>
                    <span class="badge" :class="ev.aprobado ? 'badge--ok' : 'badge--muted'">
                      {{ ev.aprobado ? 'APROBADO' : 'REPROBADO' }}
                    </span>
                  </td>
                  <td>{{ ev.carrera_objetivo }}</td>
                  <td>{{ ev.establecimiento }}</td>
                  <td>{{ ev.municipio_establecimiento }}</td>
                </tr>
                <tr v-if="!detalle.historial.length">
                  <td :colspan="historyColumns.length" class="table__empty">Sin evaluaciones registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="placeholder">
          <p class="placeholder__title">
            {{ cargandoDetalle ? 'Cargando perfil del aspirante…' : 'Sin aspirante seleccionado' }}
          </p>
          <p>Selecciona un aspirante del listado izquierdo para consultar su resumen y su historial de evaluaciones.</p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert--error {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--coral-soft);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}

.row--selected {
  background: var(--color-primary-soft);
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  font-size: 12px;
}

.profile-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.profile-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.profile-meta {
  margin: 2px 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.badge--ok {
  background: var(--green-soft, rgba(16, 185, 129, 0.15));
  color: var(--color-up, #059669);
}
</style>
