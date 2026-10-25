import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP20EvolucionAnual, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P20EvolucionAnualQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP20EvolucionAnual>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$anio_evaluacion',
          evaluaciones: { $sum: 1 },
          aprobadas: {
            $sum: {
              $cond: ['$aprobado', 1, 0],
            },
          },
          no_aprobadas: {
            $sum: {
              $cond: ['$aprobado', 0, 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          anio_evaluacion: '$_id',
          evaluaciones: 1,
          aprobadas: 1,
          no_aprobadas: 1,
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

    return paginarConsulta<FilaP20EvolucionAnual>(
      this.evaluaciones,
      etapas,
      parametros,
      ['anio_evaluacion', 'evaluaciones', 'aprobadas', 'no_aprobadas', 'porcentaje_aprobacion'],
      { anio_evaluacion: -1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
