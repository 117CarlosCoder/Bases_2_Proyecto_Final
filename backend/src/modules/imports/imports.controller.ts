import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ImportsDto, IncidenciasImportsDto, PaginacionImportsDto } from './dto/imports.dto';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(
    private readonly importsService: ImportsService,
  ) {}

  @Post('csv')
  cargarCsv(@Body() dto: ImportsDto) {
    return this.importsService.cargarCsv(
      dto.csvContent,
      dto.fileName,
    );
  }

  @Get()
  listarImportaciones(
    @Query() query: PaginacionImportsDto,
  ) {
    return this.importsService.listarImportaciones(
      query.pagina,
      query.limite,
    );
  }

  @Get(':id/errors')
  obtenerIncidencias(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
    @Query() query: IncidenciasImportsDto,
  ) {
    return this.importsService.obtenerIncidencias(
      id,
      query.tipo,
      query.pagina,
      query.limite,
    );
  }

  @Get(':id')
  obtenerImportacion(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.importsService.obtenerImportacion(id);
  }
}
