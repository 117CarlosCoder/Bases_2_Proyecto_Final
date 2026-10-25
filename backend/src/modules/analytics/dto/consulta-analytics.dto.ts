import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FiltroAnioAnalyticsDto } from './filtro-anio-analytics.dto';

export class ConsultaAnalyticsDto extends FiltroAnioAnalyticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buscar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ordenarPor?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direccion?: 'asc' | 'desc';
}
