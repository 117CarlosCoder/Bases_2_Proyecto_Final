import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
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
    P7EdadAprobadosCarreraInstitucionQuery,
    P8AprobadosMunicipioCarreraQuery,
    P9EvaluacionesMesPublicoQuery,
    P10TopCarrerasJovenesQuery,
    P11DesempenoAspiranteQuery,
    P12SexoTipoInstitucionQuery,
    P13AprobacionEdadQuery,
    P14PromedioIntentosMateriaQuery,
    P15ResumenAspiranteQuery,
    P16ReprobadosPrimerIntentoQuery,
    P17TopMunicipiosAspirantesQuery,
    P18AprobacionTipoInstitucionQuery,
    P19CarrerasDepartamentoQuery,
    P20EvolucionAnualQuery,
    ResumenAnualQuery,
    ResumenPeriodoQuery,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
