import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP9EvaluacionesMesPublico, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P9EvaluacionesMesPublicoQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP9EvaluacionesMesPublico>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, tipo_establecimiento: 'PUBLICO' }
      : { tipo_establecimiento: 'PUBLICO' };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            anio_asignacion: '$anio_asignacion',
            mes_asignacion: '$mes_asignacion',
            materia_evaluada: '$materia_evaluada',
          },
          evaluaciones: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          anio_asignacion: '$_id.anio_asignacion',
          mes_asignacion: '$_id.mes_asignacion',
          materia_evaluada: '$_id.materia_evaluada',
          evaluaciones: 1,
        },
      },
    ];

    return paginarConsulta<FilaP9EvaluacionesMesPublico>(
      this.evaluaciones,
      etapas,
      parametros,
      ['anio_asignacion', 'mes_asignacion', 'materia_evaluada', 'evaluaciones'],
      { anio_asignacion: -1, mes_asignacion: 1, materia_evaluada: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
