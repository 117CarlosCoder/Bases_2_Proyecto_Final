import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP17TopMunicipiosAspirantes, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P17TopMunicipiosAspirantesQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP17TopMunicipiosAspirantes>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$departamento_establecimiento',
            municipio_establecimiento: '$municipio_establecimiento',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$_id.departamento_establecimiento',
            municipio_establecimiento: '$_id.municipio_establecimiento',
          },
          aspirantes: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          departamento_establecimiento: '$_id.departamento_establecimiento',
          municipio_establecimiento: '$_id.municipio_establecimiento',
          aspirantes: 1,
        },
      },
      { $sort: { aspirantes: -1, municipio_establecimiento: 1 } },
      { $limit: 5 },
    ];

    return paginarConsulta<FilaP17TopMunicipiosAspirantes>(
      this.evaluaciones,
      etapas,
      parametros,
      ['departamento_establecimiento', 'municipio_establecimiento', 'aspirantes'],
      { aspirantes: -1, municipio_establecimiento: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
