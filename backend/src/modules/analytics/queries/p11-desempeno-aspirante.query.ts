import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP11DesempenoAspirante, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P11DesempenoAspiranteQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP11DesempenoAspirante>> {
    const filtro: Filter<EvaluacionDocument> = anio ? { anio_evaluacion: anio } : {};

    const etapas: Document[] = [
      { $match: filtro },
      {
        $project: {
          _id: 0,
          correlativo: 1,
          carnet: 1,
          anio_evaluacion: 1,
          materia_evaluada: 1,
          numero_evaluacion: 1,
          resultado_evaluacion: 1,
          carrera_objetivo: 1,
        },
      },
    ];

    return paginarConsulta<FilaP11DesempenoAspirante>(
      this.evaluaciones,
      etapas,
      parametros,
      ['correlativo', 'carnet', 'anio_evaluacion', 'materia_evaluada', 'numero_evaluacion', 'resultado_evaluacion', 'carrera_objetivo'],
      { correlativo: 1, anio_evaluacion: -1, numero_evaluacion: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
