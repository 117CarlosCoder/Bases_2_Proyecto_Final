import { Inject, Injectable, Logger } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from './database.constants';

@Injectable()
export class Neo4jSchemaService {
  private readonly logger = new Logger(Neo4jSchemaService.name);

  constructor(
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
  ) {}

async restriccionNeo4j(): Promise<void> {
  const session = this.neo4jDriver.session();

  const statements = [
    `CREATE CONSTRAINT aspirante_correlativo_unique IF NOT EXISTS
     FOR (a:Aspirante) REQUIRE a.correlativo IS UNIQUE`,

    `CREATE CONSTRAINT evaluacion_uid_unique IF NOT EXISTS
     FOR (e:Evaluacion) REQUIRE e.evaluacion_uid IS UNIQUE`,

    `CREATE CONSTRAINT materia_nombre_unique IF NOT EXISTS
     FOR (m:Materia) REQUIRE m.nombre IS UNIQUE`,

    `CREATE CONSTRAINT carrera_nombre_unique IF NOT EXISTS
     FOR (c:Carrera) REQUIRE c.nombre IS UNIQUE`,

    `CREATE CONSTRAINT tipo_institucion_nombre_unique IF NOT EXISTS
     FOR (t:TipoInstitucion) REQUIRE t.nombre IS UNIQUE`,

    `CREATE CONSTRAINT departamento_nombre_unique IF NOT EXISTS
     FOR (d:Departamento) REQUIRE d.nombre IS UNIQUE`,

    `CREATE CONSTRAINT municipio_uid_unique IF NOT EXISTS
     FOR (mun:Municipio) REQUIRE mun.municipio_uid IS UNIQUE`,

    `CREATE CONSTRAINT establecimiento_nombre_unique IF NOT EXISTS
     FOR (est:Establecimiento) REQUIRE est.nombre IS UNIQUE`,
  ];

  try {
    for (const statement of statements) {
      await session.run(statement);
    }

    this.logger.log('Restricciones de Neo4j preparadas');
  } finally {
    await session.close();
  }
}
}