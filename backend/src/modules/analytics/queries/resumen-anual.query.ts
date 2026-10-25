import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ResumenAnualDashboard } from '../entities/analytics.entity';

interface AgregadoAnualRaw {
  total: number;
  approved: number;
  applicants: number;
  careers: number;
}

interface AgregadoMensualRaw {
  month: number;
  total: number;
  approved: number;
}

@Injectable()
export class ResumenAnualQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async listarAnios(): Promise<string[]> {
    const anios = await this.evaluaciones.distinct('anio_evaluacion');
    return anios
      .filter(valor => Number.isInteger(valor))
      .sort((a, b) => a - b)
      .map(String);
  }

  async ejecutar(anio: number): Promise<ResumenAnualDashboard> {
    const [anuales, mensuales] = await Promise.all([
      this.evaluaciones
        .aggregate<AgregadoAnualRaw>([
          { $match: { anio_evaluacion: anio } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              approved: { $sum: { $cond: ['$aprobado', 1, 0] } },
              applicantsSet: { $addToSet: '$correlativo' },
              careersSet: { $addToSet: '$carrera_objetivo' },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
              approved: 1,
              applicants: { $size: '$applicantsSet' },
              careers: { $size: '$careersSet' },
            },
          },
        ])
        .toArray(),
      this.evaluaciones
        .aggregate<AgregadoMensualRaw>([
          { $match: { anio_evaluacion: anio } },
          {
            $group: {
              _id: '$mes_asignacion',
              total: { $sum: 1 },
              approved: { $sum: { $cond: ['$aprobado', 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              month: '$_id',
              total: 1,
              approved: 1,
            },
          },
        ])
        .toArray(),
    ]);

    const months = Array.from({ length: 12 }, () => ({ total: 0, approved: 0 }));
    for (const item of mensuales) {
      if (item.month >= 1 && item.month <= 12) {
        months[item.month - 1] = {
          total: item.total,
          approved: item.approved,
        };
      }
    }

    const resumen = anuales[0] ?? {
      total: 0,
      approved: 0,
      applicants: 0,
      careers: 0,
    };

    const approvalPercentage =
      resumen.total > 0 ? Math.round((resumen.approved / resumen.total) * 100) : 0;

    return {
      year: String(anio),
      total: resumen.total,
      approved: resumen.approved,
      applicants: resumen.applicants,
      careers: resumen.careers,
      approvalPercentage,
      periodLabel: `Año ${anio}`,
      months,
    };
  }
}
