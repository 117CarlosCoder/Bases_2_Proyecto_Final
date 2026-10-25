import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { EngineHealthStatus, MONGODB_CLIENT, MONGODB_DB, NEO4J_DRIVER } from './database.constants';
import { MongoSchemaService } from './mongo-schema.service';
import { Neo4jSchemaService } from './neo4j-schema.service';


@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(MONGODB_CLIENT) private readonly mongoClient: MongoClient,
    @Inject(MONGODB_DB) private readonly mongoDb: Db,
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
    private readonly mongoSchemaService: MongoSchemaService,
    private readonly neo4jSchemaService: Neo4jSchemaService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const [mongoStatus, neo4jStatus] = await Promise.all([
      this.checkMongoHealth(2000),
      this.checkNeo4jHealth(2000),
    ]);

    if (mongoStatus.status === 'up') {
      this.logger.log(`MongoDB conectado (${mongoStatus.latencyMs}ms)`);
      await this.mongoSchemaService.indexandoMongo();
    } else {
      this.logger.warn(
        `MongoDB no disponible al iniciar (modo degradado): ${mongoStatus.error}`,
      );
    }

    if (neo4jStatus.status === 'up') {
      this.logger.log(`Neo4j conectado (${neo4jStatus.latencyMs}ms)`);
      await this.neo4jSchemaService.restriccionNeo4j();
    } else {
      this.logger.warn(
        `Neo4j no disponible al iniciar (modo degradado): ${neo4jStatus.error}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.mongoClient?.close(true);
    } catch (error) {
      this.logger.warn(
        `Error cerrando cliente MongoDB: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await this.neo4jDriver?.close();
    } catch (error) {
      this.logger.warn(
        `Error cerrando driver Neo4j: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getMongoClient(): MongoClient {
    return this.mongoClient;
  }

  getMongoDb(): Db {
    return this.mongoDb;
  }

  getNeo4jDriver(): Driver {
    return this.neo4jDriver;
  }

  async checkMongoHealth(timeoutMs = 2000): Promise<EngineHealthStatus> {
    const start = Date.now();
    try {
      await this.withTimeout(
        this.mongoDb.command({ ping: 1 }),
        timeoutMs,
        `Timeout (${timeoutMs}ms) verificando conexión a MongoDB`,
      );
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        error: null,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkNeo4jHealth(timeoutMs = 2000): Promise<EngineHealthStatus> {
    const start = Date.now();
    const session = this.neo4jDriver.session();
    try {
      await this.withTimeout(
        session.run('RETURN 1 AS ok'),
        timeoutMs,
        `Timeout (${timeoutMs}ms) verificando conexión a Neo4j`,
      );
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        error: null,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: null,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      try {
        await session.close();
      } catch {
      }
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }


}
