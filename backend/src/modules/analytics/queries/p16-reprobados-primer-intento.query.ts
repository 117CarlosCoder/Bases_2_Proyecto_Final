import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP16ReprobadosPrimerIntento, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P16ReprobadosPrimerIntentoQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP16ReprobadosPrimerIntento>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, numero_evaluacion: 1, aprobado: false }
      : { numero_evaluacion: 1, aprobado: false };

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
          aspirantes_reprobados: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id',
          aspirantes_reprobados: 1,
        },
      },
    ];

    return paginarConsulta<FilaP16ReprobadosPrimerIntento>(
      this.evaluaciones,
      etapas,
      parametros,
      ['carrera_objetivo', 'aspirantes_reprobados'],
      { aspirantes_reprobados: -1, carrera_objetivo: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
