import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP4TasaAprobacion, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P4TasaAprobacionQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, parametros: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<FilaP4TasaAprobacion>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$materia_evaluada',
          evaluaciones: { $sum: 1 },
          aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          materia_evaluada: '$_id',
          evaluaciones: 1,
          aprobadas: 1,
          porcentaje_aprobacion: {
            $round: [
              { $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] },
              2,
            ],
          },
        },
      },
    ];

    return paginarConsulta<FilaP4TasaAprobacion>(
      this.evaluaciones,
      etapas,
      parametros,
      ['materia_evaluada', 'aprobadas', 'evaluaciones', 'porcentaje_aprobacion'],
      { porcentaje_aprobacion: -1, materia_evaluada: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
