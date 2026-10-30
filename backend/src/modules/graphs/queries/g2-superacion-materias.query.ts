import { Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../../database/database.constants';
import type { ConsultaGrafoDto } from '../dto/graphs.dto';
import type { RespuestaConsultaGrafo } from '../entities/graph.entity';
import { ArmadorSubgrafo, aNumero, aTexto, ejecutarConsultaCypher } from '../utils/subgrafo.util';

const CYPHER_G2 = `
MATCH (a:Aspirante)-[:REALIZO]->(e1:Evaluacion)-[:EVALUA_MATERIA]->(m:Materia)
MATCH (a)-[:REALIZO]->(e2:Evaluacion)-[:EVALUA_MATERIA]->(m)
MATCH (e2)-[:ASPIRA_A]->(c:Carrera)
WHERE e1.aprobado = false
  AND e2.aprobado = true
  AND (
    e2.anio_evaluacion > e1.anio_evaluacion
    OR (e2.anio_evaluacion = e1.anio_evaluacion AND e2.numero_evaluacion > e1.numero_evaluacion)
  )
  AND ($materia IS NULL OR m.nombre = $materia)
  AND ($anio IS NULL OR e2.anio_evaluacion = toInteger($anio))
RETURN a.correlativo AS correlativo,
       m.nombre AS materia,
       c.nombre AS carrera,
       e1.evaluacion_uid AS eval_inicial_uid,
       e1.numero_evaluacion AS intento_reprobado,
       e1.anio_evaluacion AS anio_reprobado,
       e2.evaluacion_uid AS eval_superada_uid,
       e2.numero_evaluacion AS intento_aprobado,
       e2.anio_evaluacion AS anio_aprobado
ORDER BY a.correlativo ASC, m.nombre ASC, intento_aprobado ASC
LIMIT toInteger($limiteMasUno)
`.trim();

@Injectable()
export class G2SuperacionMateriasQuery {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  async ejecutar(query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    const { registros, truncated, limit } = await ejecutarConsultaCypher(
      this.neo4jDriver,
      CYPHER_G2,
      {
        materia: query.materia?.trim() || null,
        anio: query.anio ?? null,
      },
      query.limite ?? 35,
    );

    const grafo = new ArmadorSubgrafo();
    const rows: Record<string, string | number | boolean | null>[] = [];

    for (const rec of registros) {
      const correlativo = aTexto(rec.get('correlativo'));
      const materia = aTexto(rec.get('materia'));
      const carrera = aTexto(rec.get('carrera'));
      const evalInicialUid = aTexto(rec.get('eval_inicial_uid'));
      const intentoReprobado = aNumero(rec.get('intento_reprobado'));
      const anioReprobado = aNumero(rec.get('anio_reprobado'));
      const evalSuperadaUid = aTexto(rec.get('eval_superada_uid'));
      const intentoAprobado = aNumero(rec.get('intento_aprobado'));
      const anioAprobado = aNumero(rec.get('anio_aprobado'));

      const idAsp = grafo.nodo('Aspirante', correlativo, correlativo, { correlativo, carrera_objetivo: carrera });
      const idMat = grafo.nodo('Materia', materia, materia, { materia });
      const idCar = grafo.nodo('Carrera', carrera, carrera, { carrera });
      const idEv1 = grafo.nodo(
        'Evaluacion',
        evalInicialUid,
        `Intento #${intentoReprobado} (Reprobado)`,
        { evaluacion_uid: evalInicialUid, intento: intentoReprobado, anio: anioReprobado, aprobado: false, materia },
      );
      const idEv2 = grafo.nodo(
        'Evaluacion',
        evalSuperadaUid,
        `Intento #${intentoAprobado} (Aprobado)`,
        { evaluacion_uid: evalSuperadaUid, intento: intentoAprobado, anio: anioAprobado, aprobado: true, materia },
      );

      grafo.arista(idAsp, idEv1, 'REALIZO');
      grafo.arista(idAsp, idEv2, 'REALIZO');
      grafo.arista(idEv1, idEv2, 'SUPERO_EN');
      grafo.arista(idEv2, idMat, 'EVALUA_MATERIA');
      grafo.arista(idEv2, idCar, 'ASPIRA_A');

      rows.push({
        correlativo,
        materia,
        carrera,
        intento_reprobado: `${anioReprobado} · #${intentoReprobado}`,
        intento_aprobado: `${anioAprobado} · #${intentoAprobado}`,
      });
    }

    return {
      queryId: 'g2',
      title: 'G2 · Trayectoria de superación de materias entre intentos',
      description: 'Aspirantes con evaluación no aprobada seguida de una evaluación aprobada en la misma materia y carrera objetivo.',
      cypher: CYPHER_G2,
      ...grafo.resultado(),
      rows,
      columns: [
        { key: 'correlativo', label: 'Aspirante' },
        { key: 'materia', label: 'Materia' },
        { key: 'carrera', label: 'Carrera objetivo' },
        { key: 'intento_reprobado', label: 'Intento reprobado' },
        { key: 'intento_aprobado', label: 'Intento aprobado' },
      ],
      truncated,
      limit,
    };
  }
}
