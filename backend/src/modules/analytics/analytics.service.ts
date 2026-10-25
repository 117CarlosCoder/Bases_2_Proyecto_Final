import { Injectable } from '@nestjs/common';
import type { ConsultaAnalyticsDto } from './dto/consulta-analytics.dto';
import type { FiltroPeriodoAnalyticsDto } from './dto/filtro-periodo-analytics.dto';
import { P1TipoInstitucionQuery } from './queries/p1-tipo-institucion.query';
import { P2AprobadosMateriaQuery } from './queries/p2-aprobados-materia.query';
import { P3AprobadosCarreraAnioQuery } from './queries/p3-aprobados-carrera-anio.query';
import { P4TasaAprobacionQuery } from './queries/p4-tasa-aprobacion.query';
import { P5EdadCarreraQuery } from './queries/p5-edad-carrera.query';
import { P6ResumenCarreraQuery } from './queries/p6-resumen-carrera.query';
import { P7EdadAprobadosCarreraInstitucionQuery } from './queries/p7-edad-aprobados-carrera-institucion.query';
import { P8AprobadosMunicipioCarreraQuery } from './queries/p8-aprobados-municipio-carrera.query';
import { P9EvaluacionesMesPublicoQuery } from './queries/p9-evaluaciones-mes-publico.query';
import { P10TopCarrerasJovenesQuery } from './queries/p10-top-carreras-jovenes.query';
import { P11DesempenoAspiranteQuery } from './queries/p11-desempeno-aspirante.query';
import { P12SexoTipoInstitucionQuery } from './queries/p12-sexo-tipo-institucion.query';
import { P13AprobacionEdadQuery } from './queries/p13-aprobacion-edad.query';
import { P14PromedioIntentosMateriaQuery } from './queries/p14-promedio-intentos-materia.query';
import { P15ResumenAspiranteQuery } from './queries/p15-resumen-aspirante.query';
import { P16ReprobadosPrimerIntentoQuery } from './queries/p16-reprobados-primer-intento.query';
import { P17TopMunicipiosAspirantesQuery } from './queries/p17-top-municipios-aspirantes.query';
import { P18AprobacionTipoInstitucionQuery } from './queries/p18-aprobacion-tipo-institucion.query';
import { P19CarrerasDepartamentoQuery } from './queries/p19-carreras-departamento.query';
import { P20EvolucionAnualQuery } from './queries/p20-evolucion-anual.query';
import { ResumenAnualQuery } from './queries/resumen-anual.query';
import { ResumenPeriodoQuery } from './queries/resumen-periodo.query';
import { calendarioAnual } from './utils/seleccion-periodo.util';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly p1: P1TipoInstitucionQuery,
    private readonly p2: P2AprobadosMateriaQuery,
    private readonly p3: P3AprobadosCarreraAnioQuery,
    private readonly p4: P4TasaAprobacionQuery,
    private readonly p5: P5EdadCarreraQuery,
    private readonly p6: P6ResumenCarreraQuery,
    private readonly p7: P7EdadAprobadosCarreraInstitucionQuery,
    private readonly p8: P8AprobadosMunicipioCarreraQuery,
    private readonly p9: P9EvaluacionesMesPublicoQuery,
    private readonly p10: P10TopCarrerasJovenesQuery,
    private readonly p11: P11DesempenoAspiranteQuery,
    private readonly p12: P12SexoTipoInstitucionQuery,
    private readonly p13: P13AprobacionEdadQuery,
    private readonly p14: P14PromedioIntentosMateriaQuery,
    private readonly p15: P15ResumenAspiranteQuery,
    private readonly p16: P16ReprobadosPrimerIntentoQuery,
    private readonly p17: P17TopMunicipiosAspirantesQuery,
    private readonly p18: P18AprobacionTipoInstitucionQuery,
    private readonly p19: P19CarrerasDepartamentoQuery,
    private readonly p20: P20EvolucionAnualQuery,
    private readonly resumenAnual: ResumenAnualQuery,
    private readonly resumenPeriodo: ResumenPeriodoQuery,
  ) {}

  async obtenerResumenDashboard(anio?: number) {
    const years = await this.resumenAnual.listarAnios();
    const selectedYear = years.length === 0 ? '' : anio === undefined ? 'all' : String(anio);
    const anioCalendario = anio ?? (years.length > 0 ? Number(years[years.length - 1]) : undefined);
    const calendar = anioCalendario !== undefined ? calendarioAnual(anioCalendario) : null;
    const summary = selectedYear
      ? await this.resumenAnual.ejecutar(anio)
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
      calendar,
    };
  }

  obtenerResumenPeriodo(query: FiltroPeriodoAnalyticsDto) {
    return this.resumenPeriodo.ejecutar(query.anio, query);
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

  ejecutarP7(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p7.ejecutar(anio, parametros);
  }

  ejecutarP8(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p8.ejecutar(anio, parametros);
  }

  ejecutarP9(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p9.ejecutar(anio, parametros);
  }

  ejecutarP10(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p10.ejecutar(anio, parametros);
  }

  ejecutarP11(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p11.ejecutar(anio, parametros);
  }

  ejecutarP12(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p12.ejecutar(anio, parametros);
  }

  ejecutarP13(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p13.ejecutar(anio, parametros);
  }

  ejecutarP14(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p14.ejecutar(anio, parametros);
  }

  ejecutarP15(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p15.ejecutar(anio, parametros);
  }

  ejecutarP16(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p16.ejecutar(anio, parametros);
  }

  ejecutarP17(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p17.ejecutar(anio, parametros);
  }

  ejecutarP18(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p18.ejecutar(anio, parametros);
  }

  ejecutarP19(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p19.ejecutar(anio, parametros);
  }

  ejecutarP20(anio?: number, parametros: ConsultaAnalyticsDto = {}) {
    return this.p20.ejecutar(anio, parametros);
  }

  materializarResumenCarrera() {
    return this.p6.materializar();
  }
}
