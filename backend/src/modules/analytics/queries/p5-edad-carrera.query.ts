import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP5EdadCarrera, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P5EdadCarreraQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, parametros: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<FilaP5EdadCarrera>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, edad: { $ne: null } }
      : { edad: { $ne: null } };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            carrera_objetivo: '$carrera_objetivo',
            correlativo: '$correlativo',
          },
          edad: { $max: '$edad' },
        },
      },
      {
        $group: {
          _id: '$_id.carrera_objetivo',
          aspirantes_con_edad: { $sum: 1 },
          promedio_edad: { $avg: '$edad' },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id',
          aspirantes_con_edad: 1,
          promedio_edad: { $round: ['$promedio_edad', 2] },
        },
      },
    ];

    return paginarConsulta<FilaP5EdadCarrera>(
      this.evaluaciones,
      etapas,
      parametros,
      ['carrera_objetivo', 'aspirantes_con_edad', 'promedio_edad'],
      { promedio_edad: -1, carrera_objetivo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
