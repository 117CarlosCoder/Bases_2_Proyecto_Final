import { Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../../database/database.constants';
import type { ConsultaGrafoDto } from '../dto/graphs.dto';
import type { RespuestaConsultaGrafo } from '../entities/graph.entity';
import { ArmadorSubgrafo, aNumero, aTexto, ejecutarConsultaCypher } from '../utils/subgrafo.util';

const CYPHER_G5 = `
MATCH (a:Aspirante {correlativo: $correlativo})-[:REALIZO]->(e:Evaluacion)
WHERE ($anio IS NULL OR e.anio_evaluacion = toInteger($anio))
MATCH (e)-[:EVALUA_MATERIA]->(m:Materia)
MATCH (e)-[:ASPIRA_A]->(c:Carrera)
MATCH (e)-[:PROCEDE_DE_ESTABLECIMIENTO]->(est:Establecimiento)
MATCH (e)-[:PROCEDE_DE_MUNICIPIO]->(mun:Municipio)-[:PERTENECE_A]->(dep:Departamento)
MATCH (e)-[:PROCEDE_DE_TIPO]->(t:TipoInstitucion)
CALL {
  WITH a, est
  MATCH (vecino:Aspirante)-[:ESTUDIO_EN]->(est)
  WHERE vecino.correlativo <> a.correlativo
    AND NOT (vecino.correlativo STARTS WITH 'SINT-' OR vecino.correlativo STARTS WITH 'ASP-')
  RETURN vecino.correlativo AS v_corr
  LIMIT 5
}
RETURN a.correlativo AS correlativo,
       a.carnet AS carnet,
       a.sexo AS sexo,
       a.edad AS edad,
       a.grado_academico AS grado_academico,
       e.evaluacion_uid AS evaluacion_uid,
       e.anio_evaluacion AS anio_evaluacion,
       e.numero_evaluacion AS numero_evaluacion,
       e.aprobado AS aprobado,
       e.resultado_evaluacion AS resultado_evaluacion,
       m.nombre AS materia,
       c.nombre AS carrera,
       est.nombre AS establecimiento,
       t.nombre AS tipo_institucion,
       mun.municipio_uid AS municipio_uid,
       mun.nombre AS municipio,
       dep.nombre AS departamento,
       collect(DISTINCT v_corr) AS vecinos
ORDER BY e.anio_evaluacion ASC, m.nombre ASC, e.numero_evaluacion ASC
LIMIT toInteger($limiteMasUno)
`.trim();

const COLUMNAS_G5 = [
  { key: 'correlativo', label: 'Aspirante' },
  { key: 'anio_evaluacion', label: 'Año' },
  { key: 'materia', label: 'Materia' },
  { key: 'numero_evaluacion', label: 'Intento' },
  { key: 'resultado_evaluacion', label: 'Resultado' },
  { key: 'carrera', label: 'Carrera objetivo' },
  { key: 'establecimiento', label: 'Establecimiento' },
];

@Injectable()
export class G5RedAspiranteQuery {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  private async resolverCorrelativo(correlativo?: string): Promise<string> {
    const limpio = correlativo?.trim().toUpperCase();
    if (limpio) return limpio;

    const session = this.neo4jDriver.session();
    try {
      const res = await session.run(
        'MATCH (a:Aspirante) RETURN a.correlativo AS correlativo ORDER BY a.correlativo ASC LIMIT 1',
      );
      return aTexto(res.records[0]?.get('correlativo'));
    } finally {
      await session.close();
    }
  }

  async ejecutar(query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    const limite = query.limite ?? 35;
    const correlativo = await this.resolverCorrelativo(query.correlativo);

    if (!correlativo) {
      return {
        queryId: 'g5',
        title: 'G5 · Subgrafo ego-network y similitud de un aspirante',
        description: 'Recorrido completo de un aspirante (evaluaciones, materias, carrera, institución y compañeros de establecimiento).',
        cypher: CYPHER_G5,
        nodes: [],
        edges: [],
        rows: [],
        columns: COLUMNAS_G5,
        truncated: false,
        limit: limite,
      };
    }

    const { registros, truncated, limit } = await ejecutarConsultaCypher(
      this.neo4jDriver,
      CYPHER_G5,
      { correlativo, anio: query.anio ?? null },
      limite,
    );

    const grafo = new ArmadorSubgrafo();
    const rows: Record<string, string | number | boolean | null>[] = [];

    for (const rec of registros) {
      const aspCorrelativo = aTexto(rec.get('correlativo'));
      const carnet = rec.get('carnet') ? aTexto(rec.get('carnet')) : null;
      const sexo = aTexto(rec.get('sexo'));
      const edad = rec.get('edad') !== null && rec.get('edad') !== undefined ? aNumero(rec.get('edad')) : null;
      const grado = aTexto(rec.get('grado_academico'));
      const evalUid = aTexto(rec.get('evaluacion_uid'));
      const anioEval = aNumero(rec.get('anio_evaluacion'));
      const numEval = aNumero(rec.get('numero_evaluacion'));
      const aprobado = Boolean(rec.get('aprobado'));
      const resultadoEval = aTexto(rec.get('resultado_evaluacion'));
      const materia = aTexto(rec.get('materia'));
      const carrera = aTexto(rec.get('carrera'));
      const establecimiento = aTexto(rec.get('establecimiento'));
      const tipoInstitucion = aTexto(rec.get('tipo_institucion'));
      const municipioUid = aTexto(rec.get('municipio_uid'));
      const municipio = aTexto(rec.get('municipio'));
      const departamento = aTexto(rec.get('departamento'));
      const vecinosRaw = rec.get('vecinos');
      const vecinos = Array.isArray(vecinosRaw) ? vecinosRaw.map(v => aTexto(v)).filter(Boolean) : [];

      const idAsp = grafo.nodo(
        'Aspirante',
        aspCorrelativo,
        aspCorrelativo,
        { correlativo: aspCorrelativo, carnet, sexo, edad, grado_academico: grado },
      );
      const idEval = grafo.nodo(
        'Evaluacion',
        evalUid,
        `${materia} #${numEval}`,
        { evaluacion_uid: evalUid, anio_evaluacion: anioEval, numero_evaluacion: numEval, resultado_evaluacion: resultadoEval, aprobado },
      );
      const idMat = grafo.nodo('Materia', materia, materia, { materia });
      const idCar = grafo.nodo('Carrera', carrera, carrera, { carrera });
      const idEst = grafo.nodo('Establecimiento', establecimiento, establecimiento, { establecimiento, tipo: tipoInstitucion, municipio, departamento });
      const idTip = grafo.nodo('TipoInstitucion', tipoInstitucion, tipoInstitucion, { tipo_institucion: tipoInstitucion });
      const idMun = grafo.nodo('Municipio', municipioUid, municipio, { municipio, departamento });
      const idDep = grafo.nodo('Departamento', departamento, departamento, { departamento });

      grafo.arista(idAsp, idEval, 'REALIZO');
      grafo.arista(idEval, idMat, 'EVALUA_MATERIA');
      grafo.arista(idEval, idCar, 'ASPIRA_A');
      grafo.arista(idAsp, idEst, 'ESTUDIO_EN');
      grafo.arista(idEst, idTip, 'DE_TIPO');
      grafo.arista(idEst, idMun, 'UBICADO_EN');
      grafo.arista(idMun, idDep, 'PERTENECE_A');

      for (const vecino of vecinos) {
        const idVecino = grafo.nodo('Aspirante', vecino, vecino, { correlativo: vecino, relacion: 'Compañero de establecimiento' });
        grafo.arista(idVecino, idEst, 'ESTUDIO_EN');
      }

      rows.push({
        correlativo: aspCorrelativo,
        anio_evaluacion: anioEval,
        materia,
        numero_evaluacion: numEval,
        resultado_evaluacion: resultadoEval,
        carrera,
        establecimiento,
      });
    }

    return {
      queryId: 'g5',
      title: `G5 · Red individual y ego-grafo del aspirante (${correlativo})`,
      description: 'Recorrido completo de un aspirante (evaluaciones, materias, carrera, institución, ubicación y compañeros de establecimiento).',
      cypher: CYPHER_G5,
      ...grafo.resultado(),
      rows,
      columns: COLUMNAS_G5,
      truncated,
      limit,
    };
  }
}
