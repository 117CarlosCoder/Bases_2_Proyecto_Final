import { Injectable } from '@nestjs/common';
import type { ConsultaAnalyticsDto } from './dto/consulta-analytics.dto';
import { P1TipoInstitucionQuery } from './queries/p1-tipo-institucion.query';
import { P2AprobadosMateriaQuery } from './queries/p2-aprobados-materia.query';
import { P3AprobadosCarreraAnioQuery } from './queries/p3-aprobados-carrera-anio.query';
import { P4TasaAprobacionQuery } from './queries/p4-tasa-aprobacion.query';
import { P5EdadCarreraQuery } from './queries/p5-edad-carrera.query';
import { P6ResumenCarreraQuery } from './queries/p6-resumen-carrera.query';
import { ResumenAnualQuery } from './queries/resumen-anual.query';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly p1: P1TipoInstitucionQuery,
    private readonly p2: P2AprobadosMateriaQuery,
    private readonly p3: P3AprobadosCarreraAnioQuery,
    private readonly p4: P4TasaAprobacionQuery,
    private readonly p5: P5EdadCarreraQuery,
    private readonly p6: P6ResumenCarreraQuery,
    private readonly resumenAnual: ResumenAnualQuery,
  ) {}

  async obtenerResumenDashboard(anio?: number) {
    const years = await this.resumenAnual.listarAnios();
    const selectedYear = anio === undefined ? years.at(-1) ?? '' : String(anio);
    const summary = selectedYear
      ? await this.resumenAnual.ejecutar(Number(selectedYear))
      : {
          year: 'Sin datos',
          total: 0,
          approved: 0,
          applicants: 0,
          careers: 0,
          approvalPercentage: 0,
          periodLabel: 'Sin datos',
          months: Array.from({ length: 12 }, () => ({ total: 0, approved: 0 })),
        };

    return {
      years,
      selectedYear,
      summary,
    };
  }

  ejecutarP1(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p1.ejecutar(anio, parametros);
  }

  ejecutarP2(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p2.ejecutar(anio, parametros);
  }

  ejecutarP3(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p3.ejecutar(anio, parametros);
  }

  ejecutarP4(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p4.ejecutar(anio, parametros);
  }

  ejecutarP5(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p5.ejecutar(anio, parametros);
  }

  ejecutarP6(query: ConsultaAnalyticsDto = {}) {
    return this.p6.ejecutar(query);
  }

  materializarResumenCarrera() {
    return this.p6.materializar();
  }
}
