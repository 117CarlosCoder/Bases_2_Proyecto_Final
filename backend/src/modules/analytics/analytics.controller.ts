import { Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ConsultaAnalyticsDto } from './dto/consulta-analytics.dto';
import { FiltroAnioAnalyticsDto } from './dto/filtro-anio-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  obtenerResumenAnual(@Query() query: FiltroAnioAnalyticsDto) {
    return this.analyticsService.obtenerResumenDashboard(query.anio);
  }

  @Get('queries/p1')
  obtenerTiposInstitucion(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP1(query.anio, query);
  }

  @Get('queries/p2')
  obtenerAprobadosPorMateria(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP2(query.anio, query);
  }

  @Get('queries/p3')
  obtenerAprobadosPorCarreraYAnio(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP3(query.anio, query);
  }

  @Get('queries/p4')
  obtenerTasasAprobacion(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP4(query.anio, query);
  }

  @Get('queries/p5')
  obtenerEdadesPorCarrera(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP5(query.anio, query);
  }

  @Get('queries/p6')
  obtenerResumenCarrera(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP6(query);
  }

  @Post('resumen-carrera')
  materializarResumenCarrera() {
    return this.analyticsService.materializarResumenCarrera();
  }
}
