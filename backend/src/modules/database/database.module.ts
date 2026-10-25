import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import neo4j, { Driver } from 'neo4j-driver';
import { MongoSchemaService } from './mongo-schema.service';
import { Neo4jSchemaService } from './neo4j-schema.service';
import { MONGODB_CLIENT, MONGODB_DB, NEO4J_DRIVER } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: MONGODB_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongoClient => {
        const uri =
          configService.getOrThrow<string>('MONGODB_URI');
        return new MongoClient(uri, {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000,
          socketTimeoutMS: 5000,
        });
      },
    },
    {
      provide: MONGODB_DB,
      inject: [MONGODB_CLIENT, ConfigService],
      useFactory: (
        client: MongoClient,
        configService: ConfigService,
      ): Db => {
        const dbName =
          configService.getOrThrow<string>('MONGODB_DB_NAME');
        return client.db(dbName);
      },
    },
    {
      provide: NEO4J_DRIVER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Driver => {
        const uri =
          configService.getOrThrow<string>('NEO4J_URI');
        const user = configService.getOrThrow<string>('NEO4J_USER');
        const password =
          configService.getOrThrow<string>('NEO4J_PASSWORD');

        return neo4j.driver(uri, neo4j.auth.basic(user, password), {
          connectionTimeout: 2000,
          maxTransactionRetryTime: 5000,
          disableLosslessIntegers: true,
        });
      },
    },
    MongoSchemaService,
    Neo4jSchemaService,
    DatabaseService,
  ],
  exports: [MONGODB_CLIENT, MONGODB_DB, NEO4J_DRIVER, Neo4jSchemaService, DatabaseService],
})
export class DatabaseModule {}
