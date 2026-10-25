import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsString()
  @IsNotEmpty()
  MONGODB_URI!: string;

  @IsString()
  @IsNotEmpty()
  MONGODB_DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  NEO4J_URI!: string;

  @IsString()
  @IsNotEmpty()
  NEO4J_USER!: string;

  @IsString()
  @IsNotEmpty()
  NEO4J_PASSWORD!: string;

  @IsNumber()
  @Min(1)
  MAX_CSV_FILE_SIZE_MB!: number;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const sanitizedConfig: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== '') {
      sanitizedConfig[key] = value;
    }
  }

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    sanitizedConfig,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    validationError: { target: false, value: false },
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => Object.values(err.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Error de validación en variables de entorno: ${messages}`);
  }

  return validatedConfig;
}
