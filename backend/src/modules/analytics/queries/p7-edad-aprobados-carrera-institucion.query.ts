import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP7EdadAprobadosCarreraInstitucion, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P7EdadAprobadosCarreraInstitucionQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP7EdadAprobadosCarreraInstitucion>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, aprobado: true, edad: { $ne: null } }
      : { aprobado: true, edad: { $ne: null } };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            carrera_objetivo: '$carrera_objetivo',
            tipo_establecimiento: '$tipo_establecimiento',
            correlativo: '$correlativo',
          },
          edad: { $max: '$edad' },
        },
      },
      {
        $group: {
          _id: {
            carrera_objetivo: '$_id.carrera_objetivo',
            tipo_establecimiento: '$_id.tipo_establecimiento',
          },
          aspirantes_aprobados: { $sum: 1 },
          promedio_edad: { $avg: '$edad' },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id.carrera_objetivo',
          tipo_establecimiento: '$_id.tipo_establecimiento',
          aspirantes_aprobados: 1,
          promedio_edad: { $round: ['$promedio_edad', 2] },
        },
      },
    ];

    return paginarConsulta<FilaP7EdadAprobadosCarreraInstitucion>(
      this.evaluaciones,
      etapas,
      parametros,
      ['carrera_objetivo', 'tipo_establecimiento', 'aspirantes_aprobados', 'promedio_edad'],
      { aspirantes_aprobados: -1, carrera_objetivo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
