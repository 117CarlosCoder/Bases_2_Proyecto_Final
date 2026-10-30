import { Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../../database/database.constants';
import type { ConsultaGrafoDto } from '../dto/graphs.dto';
import type { RespuestaConsultaGrafo } from '../entities/graph.entity';
import { ArmadorSubgrafo, aNumero, aTexto, ejecutarConsultaCypher } from '../utils/subgrafo.util';

const CYPHER_G3 = `
MATCH (dep:Departamento)<-[:PERTENECE_A]-(mun:Municipio)<-[:PROCEDE_DE_MUNICIPIO]-(e:Evaluacion)-[:PROCEDE_DE_TIPO]->(t:TipoInstitucion)
MATCH (e)-[:EVALUA_MATERIA]->(m:Materia)
WHERE ($tipo IS NULL OR t.nombre = $tipo)
  AND ($departamento IS NULL OR dep.nombre = $departamento)
  AND ($anio IS NULL OR e.anio_evaluacion = toInteger($anio))
  AND NOT (e.correlativo STARTS WITH 'SINT-' OR e.correlativo STARTS WITH 'ASP-')
WITH t.nombre AS tipo_institucion,
     dep.nombre AS departamento,
     m.nombre AS materia,
     count(DISTINCT e.correlativo) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado THEN 1 ELSE 0 END) AS aprobadas
ORDER BY evaluaciones DESC, tipo_institucion ASC, departamento ASC, materia ASC
LIMIT toInteger($limiteMasUno)
RETURN tipo_institucion,
       departamento,
       materia,
       aspirantes,
       evaluaciones,
       aprobadas,
       round(toFloat(aprobadas) * 100.0 / evaluaciones, 2) AS porcentaje_aprobacion
`.trim();

@Injectable()
export class G3RendimientoInstitucionQuery {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  async ejecutar(query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    const { registros, truncated, limit } = await ejecutarConsultaCypher(
      this.neo4jDriver,
      CYPHER_G3,
      {
        tipo: query.tipo?.trim() || null,
        departamento: query.departamento?.trim() || null,
        anio: query.anio ?? null,
      },
      query.limite ?? 35,
    );

    const grafo = new ArmadorSubgrafo();
    const rows: Record<string, string | number | boolean | null>[] = [];

    for (const rec of registros) {
      const tipoInstitucion = aTexto(rec.get('tipo_institucion'));
      const departamento = aTexto(rec.get('departamento'));
      const materia = aTexto(rec.get('materia'));
      const aspirantes = aNumero(rec.get('aspirantes'));
      const evaluaciones = aNumero(rec.get('evaluaciones'));
      const aprobadas = aNumero(rec.get('aprobadas'));
      const porcentajeAprobacion = aNumero(rec.get('porcentaje_aprobacion'));

      const idDep = grafo.nodo('Departamento', departamento, departamento, { departamento });
      const idTip = grafo.nodo('TipoInstitucion', tipoInstitucion, tipoInstitucion, { tipo_institucion: tipoInstitucion });
      const idMat = grafo.nodo('Materia', materia, materia, { materia });

      grafo.arista(idDep, idTip, 'PROCEDE_DE_TIPO');
      grafo.arista(idTip, idMat, `APROBACION (${porcentajeAprobacion}%)`);

      rows.push({
        tipo_institucion: tipoInstitucion,
        departamento,
        materia,
        aspirantes,
        evaluaciones,
        aprobadas,
        porcentaje_aprobacion: porcentajeAprobacion,
      });
    }

    return {
      queryId: 'g3',
      title: 'G3 · Rendimiento por tipo de institución, departamento y materia',
      description: 'Cruce en el grafo entre origen geográfico, sector educativo (público/privado) y desempeño por materia.',
      cypher: CYPHER_G3,
      ...grafo.resultado(),
      rows,
      columns: [
        { key: 'tipo_institucion', label: 'Tipo de institución' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'materia', label: 'Materia' },
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
