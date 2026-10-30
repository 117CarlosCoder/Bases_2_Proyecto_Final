export type TipoNodoGrafo =
  | 'Aspirante'
  | 'Evaluacion'
  | 'Materia'
  | 'Carrera'
  | 'Establecimiento'
  | 'Municipio'
  | 'Departamento'
  | 'TipoInstitucion'

export type IdConsultaGrafo = 'g1' | 'g2' | 'g3' | 'g4' | 'g5'

export interface NodoGrafo {
  id: string
  label: string
  type: TipoNodoGrafo
  properties: Record<string, string | number | boolean | null>
}

export interface AristaGrafo {
  id: string
  source: string
  target: string
  label: string
}

export interface ColumnaTablaGrafo {
  key: string
  label: string
}

export interface RespuestaConsultaGrafo {
  queryId: IdConsultaGrafo
  title: string
  description: string
  cypher: string
  nodes: NodoGrafo[]
  edges: AristaGrafo[]
  rows: Record<string, string | number | boolean | null>[]
  columns: ColumnaTablaGrafo[]
  truncated: boolean
  limit: number
}

export interface FiltrosDisponiblesGrafo {
  anios: number[]
  departamentos: string[]
  carreras: string[]
  materias: string[]
  tipos: string[]
  correlativos: string[]
}

export interface ParametrosConsultaGrafo {
  anio?: number
  correlativo?: string
  departamento?: string
  carrera?: string
  materia?: string
  tipo?: string
  limite?: number
}

export interface DefinicionConsultaGrafo {
  id: IdConsultaGrafo
  code: string
  title: string
  filtersLabel: string
  description: string
  campos: ('correlativo' | 'departamento' | 'carrera' | 'materia' | 'tipo')[]
}

export const COLORES_NODO_GRAFO: Record<TipoNodoGrafo, string> = {
  Departamento: '#0f766e',
  Municipio: '#16a34a',
  Establecimiento: '#ea580c',
  TipoInstitucion: '#dc2626',
  Aspirante: '#1d4ed8',
  Evaluacion: '#7c3aed',
  Materia: '#0891b2',
  Carrera: '#ca8a04',
}

export const CATALOGO_CONSULTAS_GRAFO: DefinicionConsultaGrafo[] = [
  {
    id: 'g1',
    code: 'G1',
    title: 'Red de procedencia hacia carreras',
    filtersLabel: 'Departamento · Año',
    description: 'Departamento ← Municipio ← Evaluación → Carrera, contando aspirantes distintos.',
    campos: ['departamento'],
  },
  {
    id: 'g2',
    code: 'G2',
    title: 'Trayectoria de superación de materias',
    filtersLabel: 'Materia · Año',
    description: 'Aspirantes con intento reprobado seguido de un intento aprobado en la misma materia.',
    campos: ['materia'],
  },
  {
    id: 'g3',
    code: 'G3',
    title: 'Rendimiento por sector, depto. y materia',
    filtersLabel: 'Tipo institución · Departamento · Año',
    description: 'Cruce en el grafo entre departamento, tipo de institución y aprobación por materia.',
    campos: ['tipo', 'departamento'],
  },
  {
    id: 'g4',
    code: 'G4',
    title: 'Cuellos de botella y reprobación',
    filtersLabel: 'Carrera · Materia · Año',
    description: 'Materias con mayor concentración de evaluaciones reprobadas por carrera objetivo.',
    campos: ['carrera', 'materia'],
  },
  {
    id: 'g5',
    code: 'G5',
    title: 'Ego-grafo y red de un aspirante',
    filtersLabel: 'Correlativo · Año',
    description: 'Recorrido completo de un aspirante, sus evaluaciones, carrera, centro y compañeros.',
    campos: ['correlativo'],
  },
]

export type IdEscenarioBenchmark = 'todos' | 'bm1' | 'bm2' | 'bm3' | 'bm4'

export interface MetricaMotorBenchmark {
  avgMs: number
  minMs: number
  maxMs: number
  rowCount: number
  runsMs: number[]
}

export interface ResultadoEscenarioBenchmark {
  scenarioId: 'bm1' | 'bm2' | 'bm3' | 'bm4'
  title: string
  category: string
  iterations: number
  limit: number
  mongodb: MetricaMotorBenchmark
  neo4j: MetricaMotorBenchmark
  winner: 'MongoDB' | 'Neo4j' | 'Empate'
  speedupFactor: number
  explanation: string
}

export interface RespuestaBenchmarkGrafo {
  executedAt: string
  iterations: number
  limit: number
  anio: number | null
  summary: {
    mongodbAvgMs: number
    mongodbMinMs: number
    mongodbMaxMs: number
    mongodbTotalRows: number
    neo4jAvgMs: number
    neo4jMinMs: number
    neo4jMaxMs: number
    neo4jTotalRows: number
  }
  scenarios: ResultadoEscenarioBenchmark[]
}

export interface ParametrosBenchmarkGrafo {
  escenario?: IdEscenarioBenchmark
  repeticiones?: number
  limite?: number
  anio?: number
}
