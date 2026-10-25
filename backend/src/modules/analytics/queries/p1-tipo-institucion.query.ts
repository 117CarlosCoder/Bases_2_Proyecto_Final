import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP1TipoInstitucion, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P1TipoInstitucionQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, parametros: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<FilaP1TipoInstitucion>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            tipo_establecimiento: '$tipo_establecimiento',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: '$_id.tipo_establecimiento',
          aspirantes: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          tipo_establecimiento: '$_id',
          aspirantes: 1,
        },
      },
    ];

    return paginarConsulta<FilaP1TipoInstitucion>(
      this.evaluaciones,
      etapas,
      parametros,
      ['tipo_establecimiento', 'aspirantes'],
      { aspirantes: -1, tipo_establecimiento: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
