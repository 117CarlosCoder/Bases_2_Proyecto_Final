import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP3AprobadosCarreraAnio, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P3AprobadosCarreraAnioQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, parametros: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<FilaP3AprobadosCarreraAnio>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, aprobado: true }
      : { aprobado: true };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            carrera_objetivo: '$carrera_objetivo',
            anio_evaluacion: '$anio_evaluacion',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: {
            carrera_objetivo: '$_id.carrera_objetivo',
            anio_evaluacion: '$_id.anio_evaluacion',
          },
          aspirantes_aprobados: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id.carrera_objetivo',
          anio_evaluacion: '$_id.anio_evaluacion',
          aspirantes_aprobados: 1,
        },
      },
    ];

    return paginarConsulta<FilaP3AprobadosCarreraAnio>(
      this.evaluaciones,
      etapas,
      parametros,
      ['anio_evaluacion', 'carrera_objetivo', 'aspirantes_aprobados'],
      { anio_evaluacion: -1, aspirantes_aprobados: -1, carrera_objetivo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
