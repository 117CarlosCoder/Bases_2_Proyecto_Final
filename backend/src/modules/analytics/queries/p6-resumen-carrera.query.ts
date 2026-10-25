import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { ResumenCarreraDocument, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P6ResumenCarreraQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;
  private readonly resumenCarrera: Collection<ResumenCarreraDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
    this.resumenCarrera = mongoDb.collection<ResumenCarreraDocument>('resumen_carrera');
  }

  async ejecutar(query: ConsultaAnalyticsDto = {}): Promise<PaginaConsulta<ResumenCarreraDocument>> {
    const existen = await this.resumenCarrera.countDocuments({}, { limit: 1 });
    if (!existen) {
      const hayEvaluaciones = await this.evaluaciones.countDocuments({}, { limit: 1 });
      if (hayEvaluaciones) {
        await this.materializar();
      }
    }

    return paginarConsulta<ResumenCarreraDocument>(
      this.resumenCarrera,
      [],
      query,
      [
        'carrera_objetivo',
        'aspirantes_distintos',
        'evaluaciones',
        'evaluaciones_aprobadas',
        'porcentaje_aprobacion',
        'promedio_edad',
      ],
      { evaluaciones: -1, carrera_objetivo: 1 },
      'Todos los años',
    );
  }

  async materializar(): Promise<{ actualizado: boolean }> {
    const totalEvaluaciones = await this.evaluaciones.countDocuments({});
    if (totalEvaluaciones === 0) {
      await this.resumenCarrera.deleteMany({});
      return { actualizado: true };
    }

    const ahora = new Date().toISOString();
    const etapas: Document[] = [
      {
        $group: {
          _id: {
            carrera_objetivo: '$carrera_objetivo',
            correlativo: '$correlativo',
          },
          evaluaciones_aspirante: { $sum: 1 },
          aprobadas_aspirante: { $sum: { $cond: ['$aprobado', 1, 0] } },
          edad_aspirante: { $max: '$edad' },
        },
      },
      {
        $group: {
          _id: '$_id.carrera_objetivo',
          aspirantes_distintos: { $sum: 1 },
          evaluaciones: { $sum: '$evaluaciones_aspirante' },
          evaluaciones_aprobadas: { $sum: '$aprobadas_aspirante' },
          promedio_edad: { $avg: '$edad_aspirante' },
        },
      },
      {
        $project: {
          _id: 0,
          carrera_objetivo: '$_id',
          aspirantes_distintos: 1,
          evaluaciones: 1,
          evaluaciones_aprobadas: 1,
          porcentaje_aprobacion: {
            $round: [
              { $multiply: [{ $divide: ['$evaluaciones_aprobadas', '$evaluaciones'] }, 100] },
              2,
            ],
          },
          promedio_edad: { $round: ['$promedio_edad', 2] },
          updated_at: { $literal: ahora },
        },
      },
      {
        $merge: {
          into: 'resumen_carrera',
          on: 'carrera_objetivo',
          whenMatched: 'replace',
          whenNotMatched: 'insert',
        },
      },
    ];

    await this.evaluaciones.aggregate(etapas).toArray();

    return { actualizado: true };
  }
}
