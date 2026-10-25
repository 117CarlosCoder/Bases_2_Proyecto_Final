import type { Driver } from 'neo4j-driver';
import type { EvaluacionDocument } from '../entities/evaluacion.entity';

const CYPHER_PROYECCION = `
UNWIND $rows AS row
MERGE (a:Aspirante {correlativo: row.correlativo})
SET a.carnet = COALESCE(row.carnet, a.carnet),
    a.sexo = row.sexo,
    a.edad = COALESCE(row.edad, a.edad),
    a.grado_academico = row.grado_academico

MERGE (e:Evaluacion {evaluacion_uid: row.evaluacion_uid})
SET e.correlativo = row.correlativo,
    e.fecha_asignacion = row.fecha_asignacion,
    e.anio_asignacion = row.anio_asignacion,
    e.mes_asignacion = row.mes_asignacion,
    e.fecha_evaluacion = row.fecha_evaluacion,
    e.numero_evaluacion = row.numero_evaluacion,
    e.anio_evaluacion = row.anio_evaluacion,
    e.resultado_evaluacion = row.resultado_evaluacion,
    e.aprobado = row.aprobado,
    e.edad_evaluacion = row.edad

MERGE (m:Materia {nombre: row.materia_evaluada})
MERGE (c:Carrera {nombre: row.carrera_objetivo})
MERGE (t:TipoInstitucion {nombre: row.tipo_establecimiento})
MERGE (dep:Departamento {nombre: row.departamento_establecimiento})
MERGE (mun:Municipio {municipio_uid: row.municipio_uid})
SET mun.nombre = row.municipio_establecimiento,
    mun.departamento = row.departamento_establecimiento
MERGE (est:Establecimiento {nombre: row.establecimiento})
SET est.tipo = row.tipo_establecimiento,
    est.departamento = row.departamento_establecimiento,
    est.municipio = row.municipio_establecimiento

MERGE (a)-[:REALIZO]->(e)
MERGE (e)-[:EVALUA_MATERIA]->(m)
MERGE (e)-[:ASPIRA_A]->(c)
MERGE (e)-[:PROCEDE_DE_TIPO]->(t)
MERGE (e)-[:PROCEDE_DE_MUNICIPIO]->(mun)
MERGE (mun)-[:PERTENECE_A]->(dep)
MERGE (e)-[:PROCEDE_DE_ESTABLECIMIENTO]->(est)
MERGE (a)-[:ESTUDIO_EN]->(est)
MERGE (est)-[:DE_TIPO]->(t)
MERGE (est)-[:UBICADO_EN]->(mun)
`;

export async function proyectarEvaluacionesNeo4j(
  neo4jDriver: Driver,
  evaluaciones: EvaluacionDocument[],
): Promise<number> {
  if (evaluaciones.length === 0) {
    return 0;
  }

  const tamanoLote = 500;
  const session = neo4jDriver.session();

  try {
    for (let posicion = 0; posicion < evaluaciones.length; posicion += tamanoLote) {
      const rows = evaluaciones
        .slice(posicion, posicion + tamanoLote)
        .map(doc => ({
          evaluacion_uid: doc.evaluacion_uid,
          correlativo: doc.correlativo,
          carnet: doc.carnet,
          fecha_asignacion: doc.fecha_asignacion,
          anio_asignacion: doc.anio_asignacion,
          mes_asignacion: doc.mes_asignacion,
          fecha_evaluacion: doc.fecha_evaluacion,
          sexo: doc.sexo,
          edad: doc.edad,
          grado_academico: doc.grado_academico,
          carrera_objetivo: doc.carrera_objetivo,
          establecimiento: doc.establecimiento,
          departamento_establecimiento: doc.departamento_establecimiento,
          municipio_establecimiento: doc.municipio_establecimiento,
          municipio_uid: doc.municipio_uid,
          tipo_establecimiento: doc.tipo_establecimiento,
          materia_evaluada: doc.materia_evaluada,
          numero_evaluacion: doc.numero_evaluacion,
          anio_evaluacion: doc.anio_evaluacion,
          resultado_evaluacion: doc.resultado_evaluacion,
          aprobado: doc.aprobado,
        }));

      await session.run(CYPHER_PROYECCION, { rows });
    }

    return evaluaciones.length;
  } finally {
    await session.close();
  }
}
