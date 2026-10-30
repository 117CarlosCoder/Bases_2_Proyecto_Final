export type TipoNodoGrafo =
  | 'Aspirante'
  | 'Evaluacion'
  | 'Materia'
  | 'Carrera'
  | 'Establecimiento'
  | 'Municipio'
  | 'Departamento'
  | 'TipoInstitucion';

export type IdConsultaGrafo = 'g1' | 'g2' | 'g3' | 'g4' | 'g5';

export interface NodoGrafo {
  id: string;
  label: string;
  type: TipoNodoGrafo;
  properties: Record<string, string | number | boolean | null>;
}

export interface AristaGrafo {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ColumnaTablaGrafo {
  key: string;
  label: string;
}

export interface RespuestaConsultaGrafo {
  queryId: IdConsultaGrafo;
  title: string;
  description: string;
  cypher: string;
  nodes: NodoGrafo[];
  edges: AristaGrafo[];
  rows: Record<string, string | number | boolean | null>[];
  columns: ColumnaTablaGrafo[];
  truncated: boolean;
  limit: number;
}

export interface FiltrosDisponiblesGrafo {
  anios: number[];
  departamentos: string[];
  carreras: string[];
  materias: string[];
  tipos: string[];
  correlativos: string[];
}

export type IdEscenarioBenchmark = 'todos' | 'bm1' | 'bm2' | 'bm3' | 'bm4';

export interface MetricaMotorBenchmark {
  avgMs: number;
  minMs: number;
  maxMs: number;
  rowCount: number;
  runsMs: number[];
}

export interface ResultadoEscenarioBenchmark {
  scenarioId: 'bm1' | 'bm2' | 'bm3' | 'bm4';
  title: string;
  category: string;
  iterations: number;
  limit: number;
  mongodb: MetricaMotorBenchmark;
  neo4j: MetricaMotorBenchmark;
  winner: 'MongoDB' | 'Neo4j' | 'Empate';
  speedupFactor: number;
  explanation: string;
}

export interface RespuestaBenchmarkGrafo {
  executedAt: string;
  iterations: number;
  limit: number;
  anio: number | null;
  summary: {
    mongodbAvgMs: number;
    mongodbMinMs: number;
    mongodbMaxMs: number;
    mongodbTotalRows: number;
    neo4jAvgMs: number;
    neo4jMinMs: number;
    neo4jMaxMs: number;
    neo4jTotalRows: number;
  };
  scenarios: ResultadoEscenarioBenchmark[];
}
