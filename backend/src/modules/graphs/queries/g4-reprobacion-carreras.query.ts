import { Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../../database/database.constants';
import type { ConsultaGrafoDto } from '../dto/graphs.dto';
import type { RespuestaConsultaGrafo } from '../entities/graph.entity';
import { ArmadorSubgrafo, aNumero, aTexto, ejecutarConsultaCypher } from '../utils/subgrafo.util';

const CYPHER_G4 = `
MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUA_MATERIA]->(m:Materia)
MATCH (e)-[:ASPIRA_A]->(c:Carrera)
WHERE ($carrera IS NULL OR c.nombre = $carrera)
  AND ($materia IS NULL OR m.nombre = $materia)
  AND ($anio IS NULL OR e.anio_evaluacion = toInteger($anio))
WITH c.nombre AS carrera,
     m.nombre AS materia,
     count(DISTINCT a.correlativo) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado = false THEN 1 ELSE 0 END) AS reprobadas,
     sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas
WHERE reprobadas > 0
ORDER BY reprobadas DESC, evaluaciones DESC, carrera ASC, materia ASC
LIMIT toInteger($limiteMasUno)
RETURN carrera,
       materia,
       aspirantes,
       evaluaciones,
       reprobadas,
       aprobadas,
       round(toFloat(reprobadas) * 100.0 / evaluaciones, 2) AS porcentaje_reprobacion
`.trim();

@Injectable()
export class G4ReprobacionCarrerasQuery {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  async ejecutar(query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    const { registros, truncated, limit } = await ejecutarConsultaCypher(
      this.neo4jDriver,
      CYPHER_G4,
      {
        carrera: query.carrera?.trim() || null,
        materia: query.materia?.trim() || null,
        anio: query.anio ?? null,
      },
      query.limite ?? 35,
    );

    const grafo = new ArmadorSubgrafo();
    const rows: Record<string, string | number | boolean | null>[] = [];

    for (const rec of registros) {
      const carrera = aTexto(rec.get('carrera'));
      const materia = aTexto(rec.get('materia'));
      const aspirantes = aNumero(rec.get('aspirantes'));
      const evaluaciones = aNumero(rec.get('evaluaciones'));
      const reprobadas = aNumero(rec.get('reprobadas'));
      const aprobadas = aNumero(rec.get('aprobadas'));
      const porcentajeReprobacion = aNumero(rec.get('porcentaje_reprobacion'));

      const idCar = grafo.nodo('Carrera', carrera, carrera, { carrera });
      const idMat = grafo.nodo('Materia', materia, materia, { materia });

      grafo.arista(idCar, idMat, `REPROBADAS (${reprobadas} · ${porcentajeReprobacion}%)`);

      rows.push({
        carrera,
        materia,
        aspirantes,
        evaluaciones,
        reprobadas,
        aprobadas,
        porcentaje_reprobacion: porcentajeReprobacion,
      });
    }

    return {
      queryId: 'g4',
      title: 'G4 · Patrones de reprobación y cuellos de botella por carrera',
      description: 'Identifica las materias con mayor concentración de evaluaciones no aprobadas para cada carrera objetivo.',
      cypher: CYPHER_G4,
      ...grafo.resultado(),
      rows,
      columns: [
        { key: 'carrera', label: 'Carrera objetivo' },
        { key: 'materia', label: 'Materia crítica' },
        { key: 'aspirantes', label: 'Aspirantes' },
        { key: 'evaluaciones', label: 'Evaluaciones' },
        { key: 'reprobadas', label: 'Reprobadas' },
        { key: 'aprobadas', label: 'Aprobadas' },
        { key: 'porcentaje_reprobacion', label: '% Reprobación' },
      ],
      truncated,
      limit,
    };
  }
}
