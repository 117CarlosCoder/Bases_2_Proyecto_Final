import { BadRequestException } from '@nestjs/common';
import type { Filter } from 'mongodb';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { FiltroPeriodoAnalyticsDto } from '../dto/filtro-periodo-analytics.dto';

const formatearIso = (fecha: Date) => fecha.toISOString().slice(0, 10);
const formatoCorto = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function calendarioAnual(anio: number) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new BadRequestException('Selecciona un año válido.');
  }

  const min = `${anio}-01-01`;
  const max = `${anio}-12-31`;
  const fechaMaxima = new Date(`${max}T00:00:00Z`);
  const weeks: { desde: string; hasta: string; label: string }[] = [];
  let inicio = new Date(`${min}T00:00:00Z`);

  while (formatearIso(inicio) <= max) {
    const fin = new Date(inicio);
    const diaSemanaLunes = (inicio.getUTCDay() + 6) % 7;
    fin.setUTCDate(fin.getUTCDate() + (6 - diaSemanaLunes));

    if (fin > fechaMaxima) {
      fin.setTime(fechaMaxima.getTime());
    }

    weeks.push({
      desde: formatearIso(inicio),
      hasta: formatearIso(fin),
      label: `${formatoCorto.format(inicio)} – ${formatoCorto.format(fin)}`,
    });

    inicio = new Date(fin);
    inicio.setUTCDate(inicio.getUTCDate() + 1);
  }

  return { min, max, initialDate: min, weeks };
}

export function resolverPeriodo(anio?: number, seleccion: FiltroPeriodoAnalyticsDto = {}) {
  if (!Number.isInteger(anio)) {
    throw new BadRequestException('Selecciona un año válido.');
  }

  let desde = seleccion.desde ?? '';
  let hasta = seleccion.hasta ?? '';

  if (seleccion.periodo === 'month') {
    if (!seleccion.mes || seleccion.mes < 1 || seleccion.mes > 12) {
      throw new BadRequestException('Selecciona un mes válido.');
    }
    desde = formatearIso(new Date(Date.UTC(anio!, seleccion.mes - 1, 1)));
    hasta = formatearIso(new Date(Date.UTC(anio!, seleccion.mes, 0)));
  } else if (seleccion.periodo === 'day') {
    desde = seleccion.fecha ?? '';
    hasta = seleccion.fecha ?? '';
  } else if (seleccion.periodo === 'week') {
    const fecha = seleccion.fecha ?? '';
    const semana = calendarioAnual(anio!).weeks.find(item => item.desde <= fecha && item.hasta >= fecha);
    if (!semana) {
      throw new BadRequestException('Selecciona una semana del año elegido.');
    }
    desde = semana.desde;
    hasta = semana.hasta;
  }

  if (!desde || !hasta || desde > hasta || !desde.startsWith(`${anio}-`) || !hasta.startsWith(`${anio}-`)) {
    throw new BadRequestException('Selecciona un año y un periodo con fechas desde y hasta válidas.');
  }

  const filtro: Filter<EvaluacionDocument> = {
    anio_evaluacion: anio,
    $expr: {
      $and: [
        { $gte: [{ $ifNull: ['$fecha_evaluacion', '$fecha_asignacion'] }, desde] },
        { $lte: [{ $ifNull: ['$fecha_evaluacion', '$fecha_asignacion'] }, hasta] },
      ],
    },
  };

  const textoInicio = formatoCorto.format(new Date(`${desde}T00:00:00Z`));
  const textoFin = formatoCorto.format(new Date(`${hasta}T00:00:00Z`));
  const periodLabel = desde === hasta ? `${textoInicio} ${anio}` : `${textoInicio} – ${textoFin} ${anio}`;

  return { desde, hasta, filtro, periodLabel };
}
