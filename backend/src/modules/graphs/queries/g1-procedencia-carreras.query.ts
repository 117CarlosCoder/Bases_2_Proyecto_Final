import { Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../../database/database.constants';
import type { ConsultaGrafoDto } from '../dto/graphs.dto';
import type { RespuestaConsultaGrafo } from '../entities/graph.entity';
import { ArmadorSubgrafo, aNumero, aTexto, ejecutarConsultaCypher } from '../utils/subgrafo.util';

const CYPHER_G1 = `
MATCH (dep:Departamento)<-[:PERTENECE_A]-(mun:Municipio)<-[:PROCEDE_DE_MUNICIPIO]-(e:Evaluacion)-[:ASPIRA_A]->(c:Carrera)
WHERE ($departamento IS NULL OR dep.nombre = $departamento)
  AND ($anio IS NULL OR e.anio_evaluacion = toInteger($anio))
  AND NOT (e.correlativo STARTS WITH 'SINT-' OR e.correlativo STARTS WITH 'ASP-')
WITH dep.nombre AS departamento,
     mun.municipio_uid AS municipio_uid,
     mun.nombre AS municipio,
     c.nombre AS carrera,
     count(DISTINCT e.correlativo) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado THEN 1 ELSE 0 END) AS aprobadas
ORDER BY aspirantes DESC, evaluaciones DESC, departamento ASC, municipio ASC, carrera ASC
LIMIT toInteger($limiteMasUno)
RETURN departamento,
       municipio_uid,
       municipio,
       carrera,
       aspirantes,
       evaluaciones,
       aprobadas,
       round(toFloat(aprobadas) * 100.0 / evaluaciones, 2) AS porcentaje_aprobacion
`.trim();

@Injectable()
export class G1ProcedenciaCarrerasQuery {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  async ejecutar(query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    const { registros, truncated, limit } = await ejecutarConsultaCypher(
      this.neo4jDriver,
      CYPHER_G1,
      {
        departamento: query.departamento?.trim() || null,
        anio: query.anio ?? null,
      },
      query.limite ?? 35,
    );

    const grafo = new ArmadorSubgrafo();
    const rows: Record<string, string | number | boolean | null>[] = [];

    for (const rec of registros) {
      const departamento = aTexto(rec.get('departamento'));
      const municipioUid = aTexto(rec.get('municipio_uid'));
      const municipio = aTexto(rec.get('municipio'));
      const carrera = aTexto(rec.get('carrera'));
      const aspirantes = aNumero(rec.get('aspirantes'));
      const evaluaciones = aNumero(rec.get('evaluaciones'));
      const aprobadas = aNumero(rec.get('aprobadas'));
      const porcentajeAprobacion = aNumero(rec.get('porcentaje_aprobacion'));

      const idDep = grafo.nodo('Departamento', departamento, departamento, { departamento });
      const idMun = grafo.nodo('Municipio', municipioUid, municipio, { municipio, departamento, municipio_uid: municipioUid });
      const idCar = grafo.nodo('Carrera', carrera, carrera, { carrera });

      grafo.arista(idMun, idDep, 'PERTENECE_A');
      grafo.arista(idMun, idCar, `DEMANDA (${aspirantes})`);

      rows.push({
        departamento,
        municipio,
        carrera,
        aspirantes,
        evaluaciones,
        aprobadas,
        porcentaje_aprobacion: porcentajeAprobacion,
      });
    }

    return {
      queryId: 'g1',
      title: 'G1 · Red de procedencia educativa hacia carreras destino',
      description: 'Recorrido Departamento ← Municipio ← Evaluación → Carrera contando aspirantes distintos y tasa de aprobación.',
      cypher: CYPHER_G1,
      ...grafo.resultado(),
      rows,
      columns: [
        { key: 'departamento', label: 'Departamento' },
        { key: 'municipio', label: 'Municipio' },
        { key: 'carrera', label: 'Carrera objetivo' },
        { key: 'aspirantes', label: 'Aspirantes' },
        { key: 'evaluaciones', label: 'Evaluaciones' },
        { key: 'aprobadas', label: 'Aprobadas' },
        { key: 'porcentaje_aprobacion', label: '% Aprobación' },
      ],
      truncated,
      limit,
    };
  }
}
