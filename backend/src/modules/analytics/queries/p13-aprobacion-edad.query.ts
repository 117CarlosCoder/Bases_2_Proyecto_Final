import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP13AprobacionEdad, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P13AprobacionEdadQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP13AprobacionEdad>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, edad: { $ne: null } }
      : { edad: { $ne: null } };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$edad',
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
          edad: '$_id',
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

    return paginarConsulta<FilaP13AprobacionEdad>(
      this.evaluaciones,
      etapas,
      parametros,
      ['edad', 'evaluaciones', 'aprobadas', 'porcentaje_aprobacion'],
      { edad: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
