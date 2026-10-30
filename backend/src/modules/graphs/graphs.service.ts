import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/database.constants';
import type { BenchmarkGrafoDto, ConsultaGrafoDto } from './dto/graphs.dto';
import type { FiltrosDisponiblesGrafo, RespuestaBenchmarkGrafo, RespuestaConsultaGrafo } from './entities/graph.entity';
import { BenchmarkMotoresQuery } from './queries/benchmark-motores.query';
import { G1ProcedenciaCarrerasQuery } from './queries/g1-procedencia-carreras.query';
import { G2SuperacionMateriasQuery } from './queries/g2-superacion-materias.query';
import { G3RendimientoInstitucionQuery } from './queries/g3-rendimiento-institucion.query';
import { G4ReprobacionCarrerasQuery } from './queries/g4-reprobacion-carreras.query';
import { G5RedAspiranteQuery } from './queries/g5-red-aspirante.query';
import { aNumero, aTexto } from './utils/subgrafo.util';

@Injectable()
export class GraphsService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
    private readonly g1: G1ProcedenciaCarrerasQuery,
    private readonly g2: G2SuperacionMateriasQuery,
    private readonly g3: G3RendimientoInstitucionQuery,
    private readonly g4: G4ReprobacionCarrerasQuery,
    private readonly g5: G5RedAspiranteQuery,
    private readonly benchmarkQuery: BenchmarkMotoresQuery,
  ) {}

  async obtenerFiltros(): Promise<FiltrosDisponiblesGrafo> {
    const session = this.neo4jDriver.session();
    try {
      const aniosRes = await session.run(`
        MATCH (e:Evaluacion)
        WHERE e.anio_evaluacion IS NOT NULL
          AND e.anio_evaluacion <= 2024
          AND NOT (e.correlativo STARTS WITH 'SINT-' OR e.correlativo STARTS WITH 'ASP-')
        RETURN DISTINCT e.anio_evaluacion AS valor
        ORDER BY valor DESC
      `);
      const depRes = await session.run('MATCH (d:Departamento) RETURN d.nombre AS valor ORDER BY valor ASC');
      const carRes = await session.run('MATCH (c:Carrera) RETURN c.nombre AS valor ORDER BY valor ASC');
      const matRes = await session.run('MATCH (m:Materia) RETURN m.nombre AS valor ORDER BY valor ASC');
      const tipRes = await session.run('MATCH (t:TipoInstitucion) RETURN t.nombre AS valor ORDER BY valor ASC');
      const aspRes = await session.run(`
        MATCH (a:Aspirante)
        WHERE NOT (a.correlativo STARTS WITH 'SINT-' OR a.correlativo STARTS WITH 'ASP-')
        RETURN a.correlativo AS valor
        ORDER BY valor ASC
        LIMIT 50
      `);

      return {
        anios: aniosRes.records.map(r => aNumero(r.get('valor'))).filter(n => n > 0),
        departamentos: depRes.records.map(r => aTexto(r.get('valor'))).filter(Boolean),
        carreras: carRes.records.map(r => aTexto(r.get('valor'))).filter(Boolean),
        materias: matRes.records.map(r => aTexto(r.get('valor'))).filter(Boolean),
        tipos: tipRes.records.map(r => aTexto(r.get('valor'))).filter(Boolean),
        correlativos: aspRes.records.map(r => aTexto(r.get('valor'))).filter(Boolean),
      };
    } finally {
      await session.close();
    }
  }

  async ejecutarBenchmark(dto: BenchmarkGrafoDto): Promise<RespuestaBenchmarkGrafo> {
    return this.benchmarkQuery.ejecutar(dto);
  }

  async ejecutarPorId(id: string, query: ConsultaGrafoDto): Promise<RespuestaConsultaGrafo> {
    switch (id.trim().toLowerCase()) {
      case 'g1':
        return this.g1.ejecutar(query);
      case 'g2':
        return this.g2.ejecutar(query);
      case 'g3':
        return this.g3.ejecutar(query);
      case 'g4':
        return this.g4.ejecutar(query);
      case 'g5':
        return this.g5.ejecutar(query);
      default:
        throw new BadRequestException(`La consulta de grafo '${id}' no existe. Use g1, g2, g3, g4 o g5.`);
    }
  }
}
