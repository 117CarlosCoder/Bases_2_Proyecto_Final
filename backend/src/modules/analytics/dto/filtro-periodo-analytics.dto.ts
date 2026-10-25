import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { FiltroAnioAnalyticsDto } from './filtro-anio-analytics.dto';

export class FiltroPeriodoAnalyticsDto extends FiltroAnioAnalyticsDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  desde?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  hasta?: string;

  @IsOptional()
  @IsIn(['year', 'month', 'week', 'day'])
  periodo?: 'year' | 'month' | 'week' | 'day';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha?: string;
}
