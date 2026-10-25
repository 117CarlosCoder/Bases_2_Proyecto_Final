import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP2AprobadosMateria, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P2AprobadosMateriaQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, parametros: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<FilaP2AprobadosMateria>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, aprobado: true }
      : { aprobado: true };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$materia_evaluada',
          aprobados: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          materia_evaluada: '$_id',
          aprobados: 1,
        },
      },
    ];

    return paginarConsulta<FilaP2AprobadosMateria>(
      this.evaluaciones,
      etapas,
      parametros,
      ['materia_evaluada', 'aprobados'],
      { aprobados: -1, materia_evaluada: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
