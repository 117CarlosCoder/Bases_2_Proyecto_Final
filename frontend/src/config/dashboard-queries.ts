import type { DashboardQuery } from '@/types/dashboard-query'

export const queries: DashboardQuery[] = [
  {
    key: 'p1',
    title: 'Tipo de institución',
    description: 'Aspirantes distintos por tipo de institución educativa.',
    columns: [
      { key: 'tipo_establecimiento', label: 'Tipo de institución' },
      { key: 'aspirantes', label: 'Aspirantes únicos', format: 'number' },
    ],
  },
  {
    key: 'p2',
    title: 'Aprobados por materia',
    description: 'Evaluaciones aprobadas agrupadas por materia.',
    columns: [
      { key: 'materia_evaluada', label: 'Materia' },
      { key: 'aprobados', label: 'Evaluaciones aprobadas', format: 'number' },
    ],
  },
  {
    key: 'p3',
    title: 'Carrera y año',
    description: 'Aspirantes aprobados por carrera objetivo y año de evaluación.',
    columns: [
      { key: 'anio_evaluacion', label: 'Año', format: 'year' },
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_aprobados', label: 'Aspirantes aprobados', format: 'number' },
    ],
  },
  {
    key: 'p4',
    title: 'Tasa de aprobación',
    description: 'Proporción de evaluaciones aprobadas por materia.',
    columns: [
      { key: 'materia_evaluada', label: 'Materia' },
      { key: 'aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
    ],
  },
  {
    key: 'p5',
    title: 'Edad por carrera',
    description: 'Promedio de edad de los aspirantes por carrera objetivo.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_con_edad', label: 'Aspirantes con edad', format: 'number' },
      { key: 'promedio_edad', label: 'Edad promedio', format: 'age' },
    ],
  },
  {
    key: 'p6',
    title: 'Resumen por carrera',
    description: 'Indicadores agregados de todas las carreras y años.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_distintos', label: 'Aspirantes', format: 'number' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'evaluaciones_aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
      { key: 'promedio_edad', label: 'Edad promedio', format: 'age' },
    ],
  },
]
