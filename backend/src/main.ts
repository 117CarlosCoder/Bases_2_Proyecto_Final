import { INestApplication, Logger, ValidationPipe, BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const corsOrigin =
    configService.getOrThrow<string>('CORS_ORIGIN');


  const limiteMb = Number(
    configService.getOrThrow<number>('MAX_CSV_FILE_SIZE_MB'),
  );
  app.use(json({ limit: (limiteMb + 1) * 1024 * 1024 }));
  app.use((error: unknown, _request: Request, _response: Response, next: NextFunction) => {
    const estado = typeof error === 'object' && error !== null
      ? (error as { status?: number }).status
      : undefined;
    if (estado === 413) {
      next(new PayloadTooLargeException('El cuerpo JSON supera el limite permitido'));
      return;
    }
    if (estado === 400 && error instanceof SyntaxError) {
      next(new BadRequestException('El JSON enviado es invalido'));
      return;
    }
    next(error);
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: corsOrigin.includes(',')
      ? corsOrigin.split(',').map((origin) => origin.trim())
      : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port);
  logger.log(`Backend ejecutándose en http://localhost:${port}/api`);
}

if (require.main === module) {
  void bootstrap();
}
