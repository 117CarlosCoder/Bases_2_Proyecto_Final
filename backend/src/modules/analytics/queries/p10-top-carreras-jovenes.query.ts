import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP10TopCarrerasJovenes, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P10TopCarrerasJovenesQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP10TopCarrerasJovenes>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, edad: { $gte: 16, $lte: 18 } }
      : { edad: { $gte: 16, $lte: 18 } };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            carrera_objetivo: '$carrera_objetivo',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: '$_id.carrera_objetivo',
          aspirantes: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id',
          aspirantes: 1,
        },
      },
      { $sort: { aspirantes: -1, carrera_objetivo: 1 } },
      { $limit: 5 },
    ];

    return paginarConsulta<FilaP10TopCarrerasJovenes>(
      this.evaluaciones,
      etapas,
      parametros,
      ['carrera_objetivo', 'aspirantes'],
      { aspirantes: -1, carrera_objetivo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
