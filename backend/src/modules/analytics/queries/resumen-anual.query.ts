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
  approvalPercentage: number;
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
    const resultado = await this.evaluaciones
      .aggregate<{ anio: string }>([
        { $group: { _id: '$anio_evaluacion' } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, anio: { $toString: '$_id' } } },
      ])
      .toArray();

    return resultado.map(item => item.anio);
  }

  async ejecutar(anio?: number): Promise<ResumenAnualDashboard> {
    const filtro: Filter<EvaluacionDocument> = anio === undefined ? {} : { anio_evaluacion: anio };

    const [facet] = await this.evaluaciones
      .aggregate<{
        anuales: AgregadoAnualRaw[];
        mensuales: AgregadoMensualRaw[];
        anios: Array<{ anio: string }>;
      }>([
        { $match: filtro },
        {
          $facet: {
            anuales: [
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
                  approvalPercentage: {
                    $round: [{ $multiply: [{ $divide: ['$approved', '$total'] }, 100] }, 0],
                  },
                },
              },
            ],
            mensuales: [
              {
                $group: {
                  _id: {
                    year: '$anio_evaluacion',
                    month: {
                      $cond: [
                        { $ne: ['$fecha_evaluacion', null] },
                        { $toInt: { $substrBytes: ['$fecha_evaluacion', 5, 2] } },
                        '$mes_asignacion',
                      ],
                    },
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
            ],
            anios: [
              { $group: { _id: '$anio_evaluacion' } },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, anio: { $toString: '$_id' } } },
            ],
          },
        },
      ])
      .toArray();

    const mensuales = facet?.mensuales ?? [];
    const aniosDisponibles = anio === undefined
      ? (facet?.anios ?? []).map(item => item.anio)
      : [String(anio)];

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

    const resumen = facet?.anuales[0] ?? {
      total: 0,
      approved: 0,
      applicants: 0,
      careers: 0,
      approvalPercentage: 0,
    };

    return {
      year: anio === undefined ? 'Todos' : String(anio),
      total: resumen.total,
      approved: resumen.approved,
      applicants: resumen.applicants,
      careers: resumen.careers,
      approvalPercentage: resumen.approvalPercentage,
      periodLabel: anio === undefined ? 'Todos los años' : `Año ${anio}`,
      months,
      points,
    };
  }
}
