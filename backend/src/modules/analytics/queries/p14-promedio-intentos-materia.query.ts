import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP14PromedioIntentosMateria, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P14PromedioIntentosMateriaQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP14PromedioIntentosMateria>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            materia_evaluada: '$materia_evaluada',
            correlativo: '$correlativo',
          },
          intentos: { $max: '$numero_evaluacion' },
        },
      },
      {
        $group: {
          _id: '$_id.materia_evaluada',
          aspirantes: { $sum: 1 },
          promedio_intentos: { $avg: '$intentos' },
        },
      },
      {
        $project: {
          _id: 0,
          materia_evaluada: '$_id',
          aspirantes: 1,
          promedio_intentos: { $round: ['$promedio_intentos', 2] },
        },
      },
    ];

    return paginarConsulta<FilaP14PromedioIntentosMateria>(
      this.evaluaciones,
      etapas,
      parametros,
      ['materia_evaluada', 'aspirantes', 'promedio_intentos'],
      { promedio_intentos: -1, materia_evaluada: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
