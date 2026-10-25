import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { BuscarAspirantesDto } from './dto/applicants.dto';

@Controller('applicants')
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Get('filters')
  obtenerFiltros() {
    return this.applicantsService.obtenerFiltros();
  }

  @Get()
  listarAspirantes(@Query() query: BuscarAspirantesDto) {
    return this.applicantsService.listarAspirantes(query);
  }

  @Get(':identifier')
  obtenerDetalleAspirante(@Param('identifier') identifier: string) {
    return this.applicantsService.obtenerDetalleAspirante(identifier);
  }
}
