import { Module } from '@nestjs/common';
import { GraphsController } from './graphs.controller';
import { GraphsService } from './graphs.service';
import { BenchmarkMotoresQuery } from './queries/benchmark-motores.query';
import { G1ProcedenciaCarrerasQuery } from './queries/g1-procedencia-carreras.query';
import { G2SuperacionMateriasQuery } from './queries/g2-superacion-materias.query';
import { G3RendimientoInstitucionQuery } from './queries/g3-rendimiento-institucion.query';
import { G4ReprobacionCarrerasQuery } from './queries/g4-reprobacion-carreras.query';
import { G5RedAspiranteQuery } from './queries/g5-red-aspirante.query';

@Module({
  controllers: [GraphsController],
  providers: [
    GraphsService,
    BenchmarkMotoresQuery,
    G1ProcedenciaCarrerasQuery,
    G2SuperacionMateriasQuery,
    G3RendimientoInstitucionQuery,
    G4ReprobacionCarrerasQuery,
    G5RedAspiranteQuery,
  ],
  exports: [GraphsService],
})
export class GraphsModule {}
