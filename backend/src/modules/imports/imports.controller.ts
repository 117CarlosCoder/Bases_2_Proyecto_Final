import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ImportsDto, IncidenciasImportsDto, PaginacionImportsDto } from './dto/imports.dto';
import { ImportsService } from './imports.service';

const REGEX_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  @Delete()
  vaciarBasesDeDatos() {
    return this.importsService.vaciarBasesDeDatos();
  }

  @Post(':id/sync-neo4j')
  sincronizarNeo4j(@Param('id') id: string) {
    if (id !== 'all' && !REGEX_UUID_V4.test(id)) {
      throw new BadRequestException('El identificador de importación no es válido');
    }
    return this.importsService.sincronizarNeo4j(id);
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
