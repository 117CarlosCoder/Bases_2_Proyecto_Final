import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP18AprobacionTipoInstitucion, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P18AprobacionTipoInstitucionQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP18AprobacionTipoInstitucion>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$tipo_establecimiento',
          evaluaciones: { $sum: 1 },
          aprobadas: {
            $sum: {
              $cond: ['$aprobado', 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          tipo_establecimiento: '$_id',
          evaluaciones: 1,
          aprobadas: 1,
          porcentaje_aprobacion: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$aprobadas', '$evaluaciones'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ];

    return paginarConsulta<FilaP18AprobacionTipoInstitucion>(
      this.evaluaciones,
      etapas,
      parametros,
      ['tipo_establecimiento', 'evaluaciones', 'aprobadas', 'porcentaje_aprobacion'],
      { porcentaje_aprobacion: -1, tipo_establecimiento: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
