import type { EngineHealthStatus } from '../../database/database.constants';

export class HealthResponseDto {
  status!: 'ok' | 'degraded';
  timestamp!: string;
  services!: {
    api: {
      status: 'up';
    };
    mongodb: EngineHealthStatus;
    neo4j: EngineHealthStatus;
  };
}
