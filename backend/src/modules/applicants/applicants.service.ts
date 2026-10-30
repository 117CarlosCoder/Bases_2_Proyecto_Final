import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import type { Document, Filter } from 'mongodb';
import { MONGODB_DB } from '../database/database.constants';
import type { EvaluacionDocument } from '../imports/entities/evaluacion.entity';
import { paginarConsulta } from '../analytics/utils/paginar-consulta.util';
import type { BuscarAspirantesDto } from './dto/applicants.dto';
import type { DetalleAspirante, FiltrosDisponiblesAspirantes, ResumenAspiranteItem } from './entities/applicant.entity';

@Injectable()
export class ApplicantsService {
  private readonly evaluaciones: Collection<EvaluacionDocument>;

  constructor(@Inject(MONGODB_DB) mongoDb: Db) {
    this.evaluaciones = mongoDb.collection<EvaluacionDocument>('evaluaciones');
  }

  async obtenerFiltros(): Promise<FiltrosDisponiblesAspirantes> {
    const [filtros] = await this.evaluaciones
      .aggregate<FiltrosDisponiblesAspirantes>([
        {
          $group: {
            _id: null,
            anios: { $addToSet: '$anio_evaluacion' },
            carreras: { $addToSet: '$carrera_objetivo' },
            materias: { $addToSet: '$materia_evaluada' },
            tipos: { $addToSet: '$tipo_establecimiento' },
            departamentos: { $addToSet: '$departamento_establecimiento' },
          },
        },
        {
          $project: {
            _id: 0,
            anios: { $sortArray: { input: '$anios', sortBy: -1 } },
            carreras: { $sortArray: { input: '$carreras', sortBy: 1 } },
            materias: { $sortArray: { input: '$materias', sortBy: 1 } },
            tipos: { $sortArray: { input: '$tipos', sortBy: 1 } },
            departamentos: { $sortArray: { input: '$departamentos', sortBy: 1 } },
          },
        },
      ])
      .toArray();

    return filtros ?? {
      anios: [],
      carreras: [],
      materias: [],
      tipos: [],
      departamentos: [],
    };
  }

  async listarAspirantes(query: BuscarAspirantesDto = {}) {
    const filtro: Filter<EvaluacionDocument> = {};
    if (query.anio) filtro.anio_evaluacion = query.anio;
    if (query.carrera) filtro.carrera_objetivo = query.carrera;
    if (query.materia) filtro.materia_evaluada = query.materia;
    if (query.tipo) filtro.tipo_establecimiento = query.tipo as EvaluacionDocument['tipo_establecimiento'];
    if (query.departamento) filtro.departamento_establecimiento = query.departamento;

    const etapas: Document[] = [
      { $match: filtro },
      {
        $group: {
          _id: '$correlativo',
          carnet: { $max: '$carnet' },
          anio_evaluacion: { $max: '$anio_evaluacion' },
          sexo: { $first: '$sexo' },
          edad: { $max: '$edad' },
          grado_academico: { $first: '$grado_academico' },
          carrera_objetivo: { $first: '$carrera_objetivo' },
          establecimiento: { $first: '$establecimiento' },
          departamento_establecimiento: { $first: '$departamento_establecimiento' },
          municipio_establecimiento: { $first: '$municipio_establecimiento' },
          tipo_establecimiento: { $first: '$tipo_establecimiento' },
          evaluaciones: { $sum: 1 },
          aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          correlativo: '$_id',
          carnet: 1,
          anio_evaluacion: 1,
          sexo: 1,
          edad: 1,
          grado_academico: 1,
          carrera_objetivo: 1,
          establecimiento: 1,
          departamento_establecimiento: 1,
          municipio_establecimiento: 1,
          tipo_establecimiento: 1,
          evaluaciones: 1,
          aprobadas: 1,
          porcentaje_aprobacion: {
            $round: [{ $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] }, 2],
          },
        },
      },
    ];

    return paginarConsulta<ResumenAspiranteItem>(
      this.evaluaciones,
      etapas,
      {
        buscar: query.buscar,
        pagina: query.pagina,
        limite: query.limite,
      },
      [
        'correlativo',
        'carnet',
        'anio_evaluacion',
        'carrera_objetivo',
        'establecimiento',
        'departamento_establecimiento',
        'municipio_establecimiento',
        'evaluaciones',
        'aprobadas',
        'porcentaje_aprobacion',
      ],
      { correlativo: 1 },
      query.anio ? `Año ${query.anio}` : 'Todos los años',
    );
  }

  async obtenerDetalleAspirante(identificador: string): Promise<DetalleAspirante> {
    const limpio = identificador.trim().toUpperCase();
    const [detalle] = await this.evaluaciones
      .aggregate<DetalleAspirante>([
        { $match: { $or: [{ correlativo: limpio }, { carnet: limpio }] } },
        { $project: { _id: 0 } },
        { $sort: { anio_evaluacion: 1, fecha_asignacion: 1, materia_evaluada: 1, numero_evaluacion: 1 } },
        {
          $group: {
            _id: '$correlativo',
            carnet: { $max: '$carnet' },
            anio_evaluacion: { $max: '$anio_evaluacion' },
            sexo: { $first: '$sexo' },
            edad: { $max: '$edad' },
            grado_academico: { $first: '$grado_academico' },
            carrera_objetivo: { $first: '$carrera_objetivo' },
            establecimiento: { $first: '$establecimiento' },
            departamento_establecimiento: { $first: '$departamento_establecimiento' },
            municipio_establecimiento: { $first: '$municipio_establecimiento' },
            tipo_establecimiento: { $first: '$tipo_establecimiento' },
            evaluaciones: { $sum: 1 },
            aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } },
            historial: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            perfil: {
              correlativo: '$_id',
              carnet: '$carnet',
              anio_evaluacion: '$anio_evaluacion',
              sexo: '$sexo',
              edad: '$edad',
              grado_academico: '$grado_academico',
              carrera_objetivo: '$carrera_objetivo',
              establecimiento: '$establecimiento',
              departamento_establecimiento: '$departamento_establecimiento',
              municipio_establecimiento: '$municipio_establecimiento',
              tipo_establecimiento: '$tipo_establecimiento',
              evaluaciones: '$evaluaciones',
              aprobadas: '$aprobadas',
              porcentaje_aprobacion: {
                $round: [{ $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] }, 2],
              },
            },
            historial: 1,
          },
        },
      ])
      .toArray();

    if (!detalle) {
      throw new NotFoundException(`No se encontró ningún aspirante con identificador ${limpio}`);
    }

    return detalle;
  }
}
