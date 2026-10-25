import type { DashboardQuery } from '@/types/analytics'

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
    title: 'Tasa por materia',
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
    title: 'Resumen carrera',
    description: 'Indicadores agregados en resumen_carrera.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_distintos', label: 'Aspirantes', format: 'number' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'evaluaciones_aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
      { key: 'promedio_edad', label: 'Edad promedio', format: 'age' },
    ],
  },
  {
    key: 'p7',
    title: 'Edad aprobados (carrera/tipo)',
    description: 'Promedio de edad de aspirantes aprobados por carrera y tipo de institución.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'tipo_establecimiento', label: 'Tipo de institución' },
      { key: 'aspirantes_aprobados', label: 'Aprobados', format: 'number' },
      { key: 'promedio_edad', label: 'Edad promedio', format: 'age' },
    ],
  },
  {
    key: 'p8',
    title: 'Aprobados por municipio',
    description: 'Distribución de aspirantes aprobados por municipio y carrera.',
    columns: [
      { key: 'departamento_establecimiento', label: 'Departamento' },
      { key: 'municipio_establecimiento', label: 'Municipio' },
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_aprobados', label: 'Aprobados', format: 'number' },
    ],
  },
  {
    key: 'p9',
    title: 'Evaluaciones mes (público)',
    description: 'Cantidad de evaluaciones por mes y materia en instituciones públicas.',
    columns: [
      { key: 'anio_asignacion', label: 'Año', format: 'year' },
      { key: 'mes_asignacion', label: 'Mes', format: 'number' },
      { key: 'materia_evaluada', label: 'Materia' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
    ],
  },
  {
    key: 'p10',
    title: 'Top 5 carreras (16-18 años)',
    description: 'Las 5 carreras más demandadas por aspirantes entre 16 y 18 años.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes', label: 'Aspirantes (16-18)', format: 'number' },
    ],
  },
  {
    key: 'p11',
    title: 'Desempeño por aspirante',
    description: 'Historial de evaluaciones por aspirante (correlativo o carnet).',
    columns: [
      { key: 'correlativo', label: 'Correlativo' },
      { key: 'carnet', label: 'Carnet' },
      { key: 'anio_evaluacion', label: 'Año', format: 'year' },
      { key: 'materia_evaluada', label: 'Materia' },
      { key: 'numero_evaluacion', label: 'Intento', format: 'number' },
      { key: 'resultado_evaluacion', label: 'Resultado' },
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
    ],
  },
  {
    key: 'p12',
    title: 'Sexo y tipo institución',
    description: 'Distribución de aspirantes únicos por sexo y tipo de institución.',
    columns: [
      { key: 'sexo', label: 'Sexo' },
      { key: 'tipo_establecimiento', label: 'Tipo de institución' },
      { key: 'aspirantes', label: 'Aspirantes', format: 'number' },
    ],
  },
  {
    key: 'p13',
    title: 'Aprobación por edad',
    description: 'Tasa de aprobación agrupada por edad del aspirante.',
    columns: [
      { key: 'edad', label: 'Edad', format: 'age' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
    ],
  },
  {
    key: 'p14',
    title: 'Promedio intentos materia',
    description: 'Promedio de intentos realizados por aspirante en cada materia.',
    columns: [
      { key: 'materia_evaluada', label: 'Materia' },
      { key: 'aspirantes', label: 'Aspirantes', format: 'number' },
      { key: 'promedio_intentos', label: 'Intentos promedio', format: 'number' },
    ],
  },
  {
    key: 'p15',
    title: 'Resumen por aspirante',
    description: 'Perfil consolidado y conteo de evaluaciones por aspirante.',
    columns: [
      { key: 'correlativo', label: 'Correlativo' },
      { key: 'carnet', label: 'Carnet' },
      { key: 'anio_evaluacion', label: 'Año', format: 'year' },
      { key: 'sexo', label: 'Sexo' },
      { key: 'edad', label: 'Edad', format: 'age' },
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'establecimiento', label: 'Establecimiento' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'aprobadas', label: 'Aprobadas', format: 'number' },
    ],
  },
  {
    key: 'p16',
    title: 'Reprobados 1er intento',
    description: 'Carreras con más aspirantes reprobados en su primer intento.',
    columns: [
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes_reprobados', label: 'Reprobados (intento 1)', format: 'number' },
    ],
  },
  {
    key: 'p17',
    title: 'Top 5 municipios',
    description: 'Los 5 municipios con mayor cantidad de aspirantes únicos.',
    columns: [
      { key: 'departamento_establecimiento', label: 'Departamento' },
      { key: 'municipio_establecimiento', label: 'Municipio' },
      { key: 'aspirantes', label: 'Aspirantes', format: 'number' },
    ],
  },
  {
    key: 'p18',
    title: 'Aprobación por institución',
    description: 'Tasa de aprobación agrupada por tipo de institución educativa.',
    columns: [
      { key: 'tipo_establecimiento', label: 'Tipo de institución' },
      { key: 'evaluaciones', label: 'Evaluaciones', format: 'number' },
      { key: 'aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
    ],
  },
  {
    key: 'p19',
    title: 'Carreras por departamento',
    description: 'Demanda de carreras objetivo por departamento del establecimiento.',
    columns: [
      { key: 'departamento_establecimiento', label: 'Departamento' },
      { key: 'carrera_objetivo', label: 'Carrera objetivo' },
      { key: 'aspirantes', label: 'Aspirantes', format: 'number' },
    ],
  },
  {
    key: 'p20',
    title: 'Evolución anual',
    description: 'Comparativa de evaluaciones aprobadas y no aprobadas por año.',
    columns: [
      { key: 'anio_evaluacion', label: 'Año', format: 'year' },
      { key: 'evaluaciones', label: 'Total', format: 'number' },
      { key: 'aprobadas', label: 'Aprobadas', format: 'number' },
      { key: 'no_aprobadas', label: 'No aprobadas', format: 'number' },
      { key: 'porcentaje_aprobacion', label: 'Aprobación', format: 'percent' },
    ],
  },
]
