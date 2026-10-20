import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApplicantsModule } from './modules/applicants/applicants.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './modules/database/database.module';
import { GraphsModule } from './modules/graphs/graphs.module';
import { HealthModule } from './modules/health/health.module';
import { ImportsModule } from './modules/imports/imports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    ImportsModule,
    AnalyticsModule,
    ApplicantsModule,
    GraphsModule,
  ],
})
export class AppModule {}
