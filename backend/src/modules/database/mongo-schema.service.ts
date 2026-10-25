import { Inject, Injectable, Logger } from '@nestjs/common';
import { Db } from 'mongodb';
import { MONGODB_DB } from './database.constants';

@Injectable()
export class MongoSchemaService {
  private readonly logger = new Logger(MongoSchemaService.name);

  constructor(
    @Inject(MONGODB_DB) private readonly mongoDb: Db,
  ) {}

  
async indexandoMongo(): Promise<void> {
  await this.mongoDb.collection('evaluaciones').createIndexes([
    {
      key: { evaluacion_uid: 1 },
      unique: true,
      name: 'idx_evaluacion_uid_unique',
    },
    {
      key: {
        correlativo: 1,
        fecha_asignacion: 1,
        numero_evaluacion: 1,
      },
      name: 'idx_correlativo_historial',
    },
    {
      key: { carnet: 1 },
      name: 'idx_carnet',
    },
    {
      key: {
        anio_evaluacion: 1,
        materia_evaluada: 1,
        aprobado: 1,
      },
      name: 'idx_anio_materia_aprobado',
    },
    {
      key: {
        carrera_objetivo: 1,
        anio_evaluacion: 1,
        aprobado: 1,
      },
      name: 'idx_carrera_anio_aprobado',
    },
    {
      key: {
        tipo_establecimiento: 1,
        anio_asignacion: 1,
        mes_asignacion: 1,
        materia_evaluada: 1,
      },
      name: 'idx_tipo_mes_materia',
    },
    {
      key: {
        departamento_establecimiento: 1,
        municipio_establecimiento: 1,
        carrera_objetivo: 1,
      },
      name: 'idx_ubicacion_carrera',
    },
  ]);

  await this.mongoDb.collection('importaciones').createIndexes([
    {
      key: { id: 1 },
      unique: true,
      name: 'idx_importacion_id_unique',
    },
    {
      key: { created_at: -1 },
      name: 'idx_importacion_created_at',
    },
  ]);

  await this.mongoDb.collection('errores_importacion').createIndexes([
    {
      key: {
        importacion_id: 1,
        tipo: 1,
        fila: 1,
      },
      name: 'idx_importacion_tipo_fila',
    },
  ]);

  await this.mongoDb.collection('resumen_carrera').createIndexes([
    {
      key: { carrera_objetivo: 1 },
      unique: true,
      name: 'idx_resumen_carrera_unique',
    },
  ]);

  this.logger.log('Índices de MongoDB preparados');
}

}