import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document } from 'mongodb';
import { Driver, int } from 'neo4j-driver';
import { performance } from 'perf_hooks';
import { MONGODB_DB, NEO4J_DRIVER } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { BenchmarkGrafoDto } from '../dto/graphs.dto';
import type { MetricaMotorBenchmark, RespuestaBenchmarkGrafo, ResultadoEscenarioBenchmark } from '../entities/graph.entity';

interface DefinicionEscenario {
  id: 'bm1' | 'bm2' | 'bm3' | 'bm4';
  title: string;
  category: string;
  explanation: string;
  mongoPipeline: (anio: number | null, limite: number, correlativoSemilla: string) => Document[];
  cypherQuery: string;
}

@Injectable()
export class BenchmarkMotoresQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(
    @Inject(MONGODB_DB) mongoDb: Db,
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
  ) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(dto: BenchmarkGrafoDto): Promise<RespuestaBenchmarkGrafo> {
    const repeticiones = Math.min(Math.max(dto.repeticiones ?? 5, 1), 20);
    const limite = Math.min(Math.max(dto.limite ?? 100, 10), 5000);
    const anio = dto.anio ?? null;
    const filtroEscenario = (dto.escenario ?? 'todos').trim().toLowerCase();

    const docSemilla = await this.evaluaciones.findOne(
      anio ? { anio_evaluacion: anio } : {},
      { projection: { correlativo: 1 } },
    );
    const correlativoSemilla = docSemilla?.correlativo ?? '';

    const catalogo = this.obtenerCatalogoEscenarios();
    const seleccionados =
      filtroEscenario === 'todos'
        ? catalogo
        : catalogo.filter(item => item.id === filtroEscenario);

    const escenariosAEjecutar = seleccionados.length > 0 ? seleccionados : catalogo;
    const resultados: ResultadoEscenarioBenchmark[] = [];

    for (const escenario of escenariosAEjecutar) {
      const pipeline = escenario.mongoPipeline(anio, limite, correlativoSemilla);
      const metricaMongo = await this.medirMongo(pipeline, repeticiones);
      const metricaNeo4j = await this.medirNeo4j(
        escenario.cypherQuery,
        { anio, limite: int(limite), correlativo: correlativoSemilla },
        repeticiones,
      );

      let winner: 'MongoDB' | 'Neo4j' | 'Empate' = 'Empate';
      let speedupFactor = 1;

      if (metricaMongo.avgMs > 0 && metricaNeo4j.avgMs > 0) {
        if (Math.abs(metricaMongo.avgMs - metricaNeo4j.avgMs) >= 0.05) {
          if (metricaMongo.avgMs < metricaNeo4j.avgMs) {
            winner = 'MongoDB';
            speedupFactor = Number((metricaNeo4j.avgMs / metricaMongo.avgMs).toFixed(2));
          } else {
            winner = 'Neo4j';
            speedupFactor = Number((metricaMongo.avgMs / metricaNeo4j.avgMs).toFixed(2));
          }
        }
      }

      resultados.push({
        scenarioId: escenario.id,
        title: escenario.title,
        category: escenario.category,
        iterations: repeticiones,
        limit: limite,
        mongodb: metricaMongo,
        neo4j: metricaNeo4j,
        winner,
        speedupFactor,
        explanation: escenario.explanation,
      });
    }

    const mongoAvgs = resultados.map(r => r.mongodb.avgMs);
    const neo4jAvgs = resultados.map(r => r.neo4j.avgMs);

    return {
      executedAt: new Date().toISOString(),
      iterations: repeticiones,
      limit: limite,
      anio,
      summary: {
        mongodbAvgMs: this.promedio(mongoAvgs),
        mongodbMinMs: resultados.length ? Number(Math.min(...resultados.map(r => r.mongodb.minMs)).toFixed(2)) : 0,
        mongodbMaxMs: resultados.length ? Number(Math.max(...resultados.map(r => r.mongodb.maxMs)).toFixed(2)) : 0,
        mongodbTotalRows: resultados.reduce((acc, r) => acc + r.mongodb.rowCount, 0),
        neo4jAvgMs: this.promedio(neo4jAvgs),
        neo4jMinMs: resultados.length ? Number(Math.min(...resultados.map(r => r.neo4j.minMs)).toFixed(2)) : 0,
        neo4jMaxMs: resultados.length ? Number(Math.max(...resultados.map(r => r.neo4j.maxMs)).toFixed(2)) : 0,
        neo4jTotalRows: resultados.reduce((acc, r) => acc + r.neo4j.rowCount, 0),
      },
      scenarios: resultados,
    };
  }

  private async medirMongo(pipeline: Document[], repeticiones: number): Promise<MetricaMotorBenchmark> {
    const runsMs: number[] = [];
    let rowCount = 0;

    for (let i = 0; i < repeticiones; i++) {
      const inicio = performance.now();
      const filas = await this.evaluaciones.aggregate(pipeline).toArray();
      const duracion = Number((performance.now() - inicio).toFixed(2));
      runsMs.push(duracion);
      rowCount = filas.length;
    }

    return {
      avgMs: this.promedio(runsMs),
      minMs: Number(Math.min(...runsMs).toFixed(2)),
      maxMs: Number(Math.max(...runsMs).toFixed(2)),
      rowCount,
      runsMs,
    };
  }

  private async medirNeo4j(
    cypher: string,
    params: Record<string, unknown>,
    repeticiones: number,
  ): Promise<MetricaMotorBenchmark> {
    const runsMs: number[] = [];
    let rowCount = 0;
    const session = this.neo4jDriver.session();

    try {
      for (let i = 0; i < repeticiones; i++) {
        const inicio = performance.now();
        const res = await session.run(cypher, params);
        const duracion = Number((performance.now() - inicio).toFixed(2));
        runsMs.push(duracion);
        rowCount = res.records.length;
      }
    } finally {
      await session.close();
    }

    return {
      avgMs: this.promedio(runsMs),
      minMs: Number(Math.min(...runsMs).toFixed(2)),
      maxMs: Number(Math.max(...runsMs).toFixed(2)),
      rowCount,
      runsMs,
    };
  }

  private promedio(valores: number[]): number {
    if (valores.length === 0) return 0;
    const suma = valores.reduce((acc, val) => acc + val, 0);
    return Number((suma / valores.length).toFixed(2));
  }

  private obtenerCatalogoEscenarios(): DefinicionEscenario[] {
    return [
      {
        id: 'bm1',
        title: 'BM-01 · Rendimiento por tipo de institución',
        category: 'Agregación tabular directa',
        explanation: 'MongoDB agrupa campos embebidos en un solo documento, mientras Neo4j atraviesa 3 relaciones entre TipoInstitucion, Establecimiento, Aspirante y Evaluacion.',
        mongoPipeline: (anio, limite) => [
          ...(anio ? [{ $match: { anio_evaluacion: anio } }] : []),
          {
            $group: {
              _id: '$tipo_establecimiento',
              evaluaciones: { $sum: 1 },
              aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } },
            },
          },
          { $sort: { evaluaciones: -1 } },
          { $limit: limite },
        ],
        cypherQuery: `
          MATCH (t:TipoInstitucion)<-[:PROCEDE_DE_TIPO]-(e:Evaluacion)
          WHERE ($anio IS NULL OR e.anio_evaluacion = $anio)
          RETURN t.nombre AS tipo, count(e) AS evaluaciones, sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas
          ORDER BY evaluaciones DESC
          LIMIT $limite
        `,
      },
      {
        id: 'bm2',
        title: 'BM-02 · Flujo geográfico hacia carreras objetivo',
        category: 'Cruce multidimensional (4 saltos)',
        explanation: 'Evalúa el conteo de aspirantes distintos desde departamento de origen hasta carrera objetivo.',
        mongoPipeline: (anio, limite) => [
          ...(anio ? [{ $match: { anio_evaluacion: anio } }] : []),
          {
            $group: {
              _id: {
                dep: '$departamento_establecimiento',
                carrera: '$carrera_objetivo',
                correlativo: '$correlativo',
              },
            },
          },
          {
            $group: {
              _id: { dep: '$_id.dep', carrera: '$_id.carrera' },
              aspirantes: { $sum: 1 },
            },
          },
          { $sort: { aspirantes: -1 } },
          { $limit: limite },
        ],
        cypherQuery: `
          MATCH (d:Departamento)<-[:PERTENECE_A]-(:Municipio)<-[:PROCEDE_DE_MUNICIPIO]-(e:Evaluacion)-[:ASPIRA_A]->(c:Carrera)
          WHERE ($anio IS NULL OR e.anio_evaluacion = $anio)
            AND NOT (e.correlativo STARTS WITH 'SINT-' OR e.correlativo STARTS WITH 'ASP-')
          RETURN d.nombre AS dep, c.nombre AS carrera, count(DISTINCT e.correlativo) AS aspirantes
          ORDER BY aspirantes DESC
          LIMIT $limite
        `,
      },
      {
        id: 'bm3',
        title: 'BM-03 · Trayectoria de superación (reprobado → aprobado)',
        category: 'Patrón secuencial de intentos',
        explanation: 'Compara emparejamiento de patrones de intentos (e1 reprobado antes que e2 aprobado) frente a agrupación con acumuladores condicionales.',
        mongoPipeline: (anio, limite) => [
          ...(anio ? [{ $match: { anio_evaluacion: anio } }] : []),
          {
            $group: {
              _id: { correlativo: '$correlativo', materia: '$materia_evaluada' },
              minReprobado: {
                $min: { $cond: [{ $eq: ['$aprobado', false] }, '$numero_evaluacion', null] },
              },
              maxAprobado: {
                $max: { $cond: [{ $eq: ['$aprobado', true] }, '$numero_evaluacion', null] },
              },
            },
          },
          {
            $match: {
              minReprobado: { $ne: null },
              maxAprobado: { $ne: null },
              $expr: { $gt: ['$maxAprobado', '$minReprobado'] },
            },
          },
          { $limit: limite },
        ],
        cypherQuery: `
          MATCH (a:Aspirante)-[:REALIZO]->(e1:Evaluacion {aprobado: false})-[:EVALUA_MATERIA]->(m:Materia)<-[:EVALUA_MATERIA]-(e2:Evaluacion {aprobado: true})<-[:REALIZO]-(a)
          WHERE e2.numero_evaluacion > e1.numero_evaluacion
            AND ($anio IS NULL OR e1.anio_evaluacion = $anio OR e2.anio_evaluacion = $anio)
          RETURN a.correlativo AS correlativo, m.nombre AS materia, min(e1.numero_evaluacion) AS minReprobado, max(e2.numero_evaluacion) AS maxAprobado
          LIMIT $limite
        `,
      },
      {
        id: 'bm4',
        title: 'BM-04 · Vecindario y compañeros de establecimiento',
        category: 'Navegación de red local (Ego-Grafo)',
        explanation: 'Neo4j navega por adyacencia libre de índices desde el nodo Aspirante hacia su Establecimiento y compañeros; MongoDB requiere $lookup sobre la colección.',
        mongoPipeline: (_anio, limite, correlativoSemilla) => [
          { $match: { correlativo: correlativoSemilla } },
          { $limit: 1 },
          {
            $lookup: {
              from: 'evaluaciones',
              localField: 'establecimiento',
              foreignField: 'establecimiento',
              pipeline: [
                { $limit: limite * 4 },
                {
                  $group: {
                    _id: '$correlativo',
                    evaluaciones: { $sum: 1 },
                  },
                },
                { $limit: limite },
              ],
              as: 'companeros',
            },
          },
          { $unwind: '$companeros' },
          {
            $project: {
              _id: '$companeros._id',
              establecimiento: 1,
              evaluaciones: '$companeros.evaluaciones',
            },
          },
          { $limit: limite },
        ],
        cypherQuery: `
          MATCH (a:Aspirante {correlativo: $correlativo})-[:ESTUDIO_EN]->(est:Establecimiento)<-[:ESTUDIO_EN]-(comp:Aspirante)
          WITH est, comp
          LIMIT $limite
          MATCH (comp)-[:REALIZO]->(ev:Evaluacion)
          RETURN comp.correlativo AS correlativo, est.nombre AS establecimiento, count(ev) AS evaluaciones
          LIMIT $limite
        `,
      },
    ];
  }
}
