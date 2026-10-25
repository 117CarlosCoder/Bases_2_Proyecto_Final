import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { P1TipoInstitucionQuery } from './queries/p1-tipo-institucion.query';
import { P2AprobadosMateriaQuery } from './queries/p2-aprobados-materia.query';
import { P3AprobadosCarreraAnioQuery } from './queries/p3-aprobados-carrera-anio.query';
import { P4TasaAprobacionQuery } from './queries/p4-tasa-aprobacion.query';
import { P5EdadCarreraQuery } from './queries/p5-edad-carrera.query';
import { P6ResumenCarreraQuery } from './queries/p6-resumen-carrera.query';
import { ResumenAnualQuery } from './queries/resumen-anual.query';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    P1TipoInstitucionQuery,
    P2AprobadosMateriaQuery,
    P3AprobadosCarreraAnioQuery,
    P4TasaAprobacionQuery,
    P5EdadCarreraQuery,
    P6ResumenCarreraQuery,
    ResumenAnualQuery,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
