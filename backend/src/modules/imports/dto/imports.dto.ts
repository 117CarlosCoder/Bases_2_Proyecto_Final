import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import type { ImportFlagRecord } from '../entities/import-flag.entity';

export class ImportsDto {
  @IsString()
  @IsNotEmpty()
  csvContent!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\.csv$/i, {
    message: 'fileName debe terminar en .csv',
  })
  fileName!: string;
}

export class PaginacionImportsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 20;
}

export class IncidenciasImportsDto extends PaginacionImportsDto {
  @IsOptional()
  @IsIn(['ERROR', 'ADVERTENCIA'])
  tipo?: ImportFlagRecord['tipo'];
}