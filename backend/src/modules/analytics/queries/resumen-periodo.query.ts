import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { FiltroPeriodoAnalyticsDto } from '../dto/filtro-periodo-analytics.dto';
import type { ResumenPeriodoDashboard } from '../entities/analytics.entity';
import { resolverPeriodo } from '../utils/seleccion-periodo.util';

@Injectable()
export class ResumenPeriodoQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(anio?: number, rango: FiltroPeriodoAnalyticsDto = {}): Promise<ResumenPeriodoDashboard> {
    const { desde, hasta, filtro, periodLabel } = resolverPeriodo(anio, rango);

    const resumen: Document[] = [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: ['$aprobado', 1, 0] } },
          applicants: { $addToSet: '$correlativo' },
          careers: { $addToSet: '$carrera_objetivo' },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          approved: 1,
          applicants: { $size: '$applicants' },
          careers: { $size: '$careers' },
          approvalPercentage: {
            $round: [{ $multiply: [{ $divide: ['$approved', '$total'] }, 100] }, 0],
          },
        },
      },
    ];

    const dias: Document[] = [
      {
        $group: {
          _id: { $substrBytes: [{ $ifNull: ['$fecha_evaluacion', '$fecha_asignacion'] }, 5, 5] },
          total: { $sum: 1 },
          approved: { $sum: { $cond: ['$aprobado', 1, 0] } },
        },
      },
      { $project: { _id: 0, date: '$_id', total: 1, approved: 1 } },
    ];

    const [resultado] = await this.evaluaciones
      .aggregate<{
        resumen: { total: number; approved: number; applicants: number; careers: number; approvalPercentage: number }[];
        dias: { date: string; total: number; approved: number }[];
      }>([{ $match: filtro }, { $facet: { resumen, dias } }])
      .toArray();

    const porDia = new Map((resultado?.dias ?? []).map(dia => [dia.date, dia]));
    const points: ResumenPeriodoDashboard['points'] = [];
    const fecha = new Date(`${desde}T00:00:00Z`);
    const formatoFecha = new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    });

    while (fecha.toISOString().slice(0, 10) <= hasta) {
      const date = fecha.toISOString().slice(0, 10);
      const datosDia = porDia.get(date.slice(5));
      points.push({
        date,
        total: datosDia?.total ?? 0,
        approved: datosDia?.approved ?? 0,
        label: formatoFecha.format(fecha),
      });
      fecha.setUTCDate(fecha.getUTCDate() + 1);
    }

    const totals = resultado?.resumen[0] ?? {
      total: 0,
      approved: 0,
      applicants: 0,
      careers: 0,
      approvalPercentage: 0,
    };

    return {
      periodLabel,
      year: String(anio),
      ...totals,
      points,
    };
  }
}
