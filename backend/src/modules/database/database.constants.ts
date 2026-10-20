export const MONGODB_CLIENT = 'MONGODB_CLIENT';
export const MONGODB_DB = 'MONGODB_DB';
export const NEO4J_DRIVER = 'NEO4J_DRIVER';

export interface EngineHealthStatus {
  status: 'up' | 'down';
  latencyMs: number | null;
  error: string | null;
}
