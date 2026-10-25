import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP19CarrerasDepartamento, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P19CarrerasDepartamentoQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP19CarrerasDepartamento>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$departamento_establecimiento',
            carrera_objetivo: '$carrera_objetivo',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$_id.departamento_establecimiento',
            carrera_objetivo: '$_id.carrera_objetivo',
          },
          aspirantes: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          departamento_establecimiento: '$_id.departamento_establecimiento',
          carrera_objetivo: '$_id.carrera_objetivo',
          aspirantes: 1,
        },
      },
    ];

    return paginarConsulta<FilaP19CarrerasDepartamento>(
      this.evaluaciones,
      etapas,
      parametros,
      ['departamento_establecimiento', 'carrera_objetivo', 'aspirantes'],
      { aspirantes: -1, departamento_establecimiento: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
