import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async checkHealth(): Promise<HealthResponseDto> {
    const [mongodb, neo4j] = await Promise.all([
      this.databaseService.checkMongoHealth(2000),
      this.databaseService.checkNeo4jHealth(2000),
    ]);

    const isHealthy = mongodb.status === 'up' && neo4j.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'up',
        },
        mongodb,
        neo4j,
      },
    };
  }
}
