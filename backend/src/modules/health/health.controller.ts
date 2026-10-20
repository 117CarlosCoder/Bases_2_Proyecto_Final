import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<HealthResponseDto> {
    return this.healthService.checkHealth();
  }
}
