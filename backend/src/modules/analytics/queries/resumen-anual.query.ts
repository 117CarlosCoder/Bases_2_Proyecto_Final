import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { PuntoSerieDashboard, ResumenAnualDashboard } from '../entities/analytics.entity';

const ETIQUETAS_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface AgregadoAnualRaw {
  total: number;
  approved: number;
  applicants: number;
  careers: number;
}

interface AgregadoMensualRaw {
  year: number;
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

  async ejecutar(anio?: number): Promise<ResumenAnualDashboard> {
    const filtro: Filter<EvaluacionDocument> = anio === undefined ? {} : { anio_evaluacion: anio };

    const [anuales, mensuales, aniosDisponibles] = await Promise.all([
      this.evaluaciones
        .aggregate<AgregadoAnualRaw>([
          { $match: filtro },
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
          { $match: filtro },
          {
            $project: {
              anio_evaluacion: 1,
              aprobado: 1,
              month: {
                $cond: [
                  { $ne: ['$fecha_evaluacion', null] },
                  { $toInt: { $substrBytes: ['$fecha_evaluacion', 5, 2] } },
                  '$mes_asignacion',
                ],
              },
            },
          },
          {
            $group: {
              _id: {
                year: '$anio_evaluacion',
                month: '$month',
              },
              total: { $sum: 1 },
              approved: { $sum: { $cond: ['$aprobado', 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              year: '$_id.year',
              month: '$_id.month',
              total: 1,
              approved: 1,
            },
          },
          { $sort: { year: 1, month: 1 } },
        ])
        .toArray(),
      anio === undefined ? this.listarAnios() : Promise.resolve([String(anio)]),
    ]);

    const months = Array.from({ length: 12 }, () => ({ total: 0, approved: 0 }));
    for (const item of mensuales) {
      if (item.month >= 1 && item.month <= 12) {
        const actual = months[item.month - 1]!;
        months[item.month - 1] = {
          total: actual.total + item.total,
          approved: actual.approved + item.approved,
        };
      }
    }

    let points: PuntoSerieDashboard[];
    if (anio === undefined && aniosDisponibles.length > 0) {
      const mapa = new Map<string, { total: number; approved: number }>();
      for (const item of mensuales) {
        if (item.month >= 1 && item.month <= 12) {
          mapa.set(`${item.year}-${item.month}`, {
            total: item.total,
            approved: item.approved,
          });
        }
      }

      points = [];
      for (const anioTexto of aniosDisponibles) {
        for (let mes = 1; mes <= 12; mes++) {
          const registro = mapa.get(`${anioTexto}-${mes}`) ?? { total: 0, approved: 0 };
          points.push({
            label: `${ETIQUETAS_MESES[mes - 1]} ${anioTexto}`,
            total: registro.total,
            approved: registro.approved,
          });
        }
      }
    } else {
      points = months.map((item, i) => ({
        label: ETIQUETAS_MESES[i]!,
        total: item.total,
        approved: item.approved,
      }));
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
      year: anio === undefined ? 'Todos' : String(anio),
      total: resumen.total,
      approved: resumen.approved,
      applicants: resumen.applicants,
      careers: resumen.careers,
      approvalPercentage,
      periodLabel: anio === undefined ? 'Todos los años' : `Año ${anio}`,
      months,
      points,
    };
  }
}
