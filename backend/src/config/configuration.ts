export interface AppConfig {
  port: number;
  corsOrigin: string;
  mongodb: {
    uri: string;
    dbName: string;
  };
  neo4j: {
    uri: string;
    user: string;
    password: string;
  };
  maxCsvFileSizeMb: number;
}

export default (): AppConfig => ({
  port: Number(process.env.PORT),
  corsOrigin: process.env.CORS_ORIGIN!,
  mongodb: {
    uri: process.env.MONGODB_URI!,
    dbName: process.env.MONGODB_DB_NAME!,
  },
  neo4j: {
    uri: process.env.NEO4J_URI!,
    user: process.env.NEO4J_USER!,
    password: process.env.NEO4J_PASSWORD!,
  },
  maxCsvFileSizeMb:
    Number(process.env.MAX_CSV_FILE_SIZE_MB),
});
