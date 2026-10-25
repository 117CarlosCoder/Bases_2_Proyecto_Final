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
    const [anios, carreras, materias, tipos, departamentos] = await Promise.all([
      this.evaluaciones.distinct('anio_evaluacion'),
      this.evaluaciones.distinct('carrera_objetivo'),
      this.evaluaciones.distinct('materia_evaluada'),
      this.evaluaciones.distinct('tipo_establecimiento'),
      this.evaluaciones.distinct('departamento_establecimiento'),
    ]);

    return {
      anios: anios.filter(valor => Number.isInteger(valor)).sort((a, b) => b - a),
      carreras: carreras.filter(Boolean).sort(),
      materias: materias.filter(Boolean).sort(),
      tipos: tipos.filter(Boolean).sort(),
      departamentos: departamentos.filter(Boolean).sort(),
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
          aprobadas: {
            $sum: {
              $cond: ['$aprobado', 1, 0],
            },
          },
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
            $round: [
              {
                $multiply: [
                  { $divide: ['$aprobadas', '$evaluaciones'] },
                  100,
                ],
              },
              2,
            ],
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
    const historial = await this.evaluaciones
      .find(
        {
          $or: [{ correlativo: limpio }, { carnet: limpio }],
        },
        { projection: { _id: 0 } },
      )
      .sort({ anio_evaluacion: 1, fecha_asignacion: 1, materia_evaluada: 1, numero_evaluacion: 1 })
      .toArray();

    if (historial.length === 0) {
      throw new NotFoundException(`No se encontró ningún aspirante con identificador ${limpio}`);
    }

    const primero = historial[0]!;
    const carnet = historial.find(item => item.carnet)?.carnet ?? null;
    const anioEvaluacion = Math.max(...historial.map(item => item.anio_evaluacion));
    const edades = historial.map(item => item.edad).filter((edad): edad is number => edad !== null);
    const edad = edades.length > 0 ? Math.max(...edades) : null;
    const aprobadas = historial.filter(item => item.aprobado).length;
    const evaluaciones = historial.length;

    return {
      perfil: {
        correlativo: primero.correlativo,
        carnet,
        anio_evaluacion: anioEvaluacion,
        sexo: primero.sexo,
        edad,
        grado_academico: primero.grado_academico,
        carrera_objetivo: primero.carrera_objetivo,
        establecimiento: primero.establecimiento,
        departamento_establecimiento: primero.departamento_establecimiento,
        municipio_establecimiento: primero.municipio_establecimiento,
        tipo_establecimiento: primero.tipo_establecimiento,
        evaluaciones,
        aprobadas,
        porcentaje_aprobacion: Number(((aprobadas / evaluaciones) * 100).toFixed(2)),
      },
      historial,
    };
  }
}
