import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP15ResumenAspirante, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P15ResumenAspiranteQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP15ResumenAspirante>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$correlativo',
          carnet: { $max: '$carnet' },
          anio_evaluacion: { $max: '$anio_evaluacion' },
          sexo: { $first: '$sexo' },
          edad: { $max: '$edad' },
          carrera_objetivo: { $first: '$carrera_objetivo' },
          establecimiento: { $first: '$establecimiento' },
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
          correlativo: '$_id',
          carnet: 1,
          anio_evaluacion: 1,
          sexo: 1,
          edad: 1,
          carrera_objetivo: 1,
          establecimiento: 1,
          evaluaciones: 1,
          aprobadas: 1,
        },
      },
    ];

    return paginarConsulta<FilaP15ResumenAspirante>(
      this.evaluaciones,
      etapas,
      parametros,
      ['correlativo', 'carnet', 'anio_evaluacion', 'sexo', 'edad', 'carrera_objetivo', 'establecimiento', 'evaluaciones', 'aprobadas'],
      { evaluaciones: -1, correlativo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
