import { Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ConsultaAnalyticsDto } from './dto/consulta-analytics.dto';
import { FiltroAnioAnalyticsDto } from './dto/filtro-anio-analytics.dto';
import { FiltroPeriodoAnalyticsDto } from './dto/filtro-periodo-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  obtenerResumenAnual(@Query() query: FiltroAnioAnalyticsDto) {
    return this.analyticsService.obtenerResumenDashboard(query.anio);
  }

  @Get('period')
  obtenerResumenPeriodo(@Query() query: FiltroPeriodoAnalyticsDto) {
    return this.analyticsService.obtenerResumenPeriodo(query);
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

  @Get('queries/p7')
  obtenerEdadAprobadosPorCarreraInstitucion(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP7(query.anio, query);
  }

  @Get('queries/p8')
  obtenerAprobadosPorMunicipioYCarrera(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP8(query.anio, query);
  }

  @Get('queries/p9')
  obtenerEvaluacionesPorMesPublico(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP9(query.anio, query);
  }

  @Get('queries/p10')
  obtenerTopCarrerasJovenes(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP10(query.anio, query);
  }

  @Get('queries/p11')
  obtenerDesempenoAspirantes(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP11(query.anio, query);
  }

  @Get('queries/p12')
  obtenerDistribucionSexoTipoInstitucion(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP12(query.anio, query);
  }

  @Get('queries/p13')
  obtenerTasaAprobacionPorEdad(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP13(query.anio, query);
  }

  @Get('queries/p14')
  obtenerPromedioIntentosPorMateria(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP14(query.anio, query);
  }

  @Get('queries/p15')
  obtenerResumenAspirantes(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP15(query.anio, query);
  }

  @Get('queries/p16')
  obtenerReprobadosPrimerIntento(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP16(query.anio, query);
  }

  @Get('queries/p17')
  obtenerTopMunicipiosAspirantes(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP17(query.anio, query);
  }

  @Get('queries/p18')
  obtenerTasaAprobacionPorTipoInstitucion(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP18(query.anio, query);
  }

  @Get('queries/p19')
  obtenerCarrerasPorDepartamento(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP19(query.anio, query);
  }

  @Get('queries/p20')
  obtenerEvolucionAnual(@Query() query: ConsultaAnalyticsDto) {
    return this.analyticsService.ejecutarP20(query.anio, query);
  }

  @Post('resumen-carrera')
  materializarResumenCarrera() {
    return this.analyticsService.materializarResumenCarrera();
  }
}
