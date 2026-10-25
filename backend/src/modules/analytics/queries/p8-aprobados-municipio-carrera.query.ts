import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../../database/database.constants';
import type { EvaluacionDocument } from '../../imports/entities/evaluacion.entity';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { FilaP8AprobadosMunicipioCarrera, PaginaConsulta } from '../entities/analytics.entity';
import { paginarConsulta } from '../utils/paginar-consulta.util';

@Injectable()
export class P8AprobadosMunicipioCarreraQuery {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async ejecutar(
    anio?: number,
    parametros: ConsultaAnalyticsDto = {},
  ): Promise<PaginaConsulta<FilaP8AprobadosMunicipioCarrera>> {
    const filtro: Filter<EvaluacionDocument> = anio
      ? { anio_evaluacion: anio, aprobado: true }
      : { aprobado: true };

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$departamento_establecimiento',
            municipio_establecimiento: '$municipio_establecimiento',
            carrera_objetivo: '$carrera_objetivo',
            correlativo: '$correlativo',
          },
        },
      },
      {
        $group: {
          _id: {
            departamento_establecimiento: '$_id.departamento_establecimiento',
            municipio_establecimiento: '$_id.municipio_establecimiento',
            carrera_objetivo: '$_id.carrera_objetivo',
          },
          aspirantes_aprobados: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          departamento_establecimiento: '$_id.departamento_establecimiento',
          municipio_establecimiento: '$_id.municipio_establecimiento',
          carrera_objetivo: '$_id.carrera_objetivo',
          aspirantes_aprobados: 1,
        },
      },
    ];

    return paginarConsulta<FilaP8AprobadosMunicipioCarrera>(
      this.evaluaciones,
      etapas,
      parametros,
      ['departamento_establecimiento', 'municipio_establecimiento', 'carrera_objetivo', 'aspirantes_aprobados'],
      { aspirantes_aprobados: -1, municipio_establecimiento: 1 },
      anio ? `Año ${anio}` : 'Todos los años',
    );
  }
}
