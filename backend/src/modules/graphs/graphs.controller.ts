import { Controller, Get, Param, Query } from '@nestjs/common';
import { BenchmarkGrafoDto, ConsultaGrafoDto } from './dto/graphs.dto';
import { GraphsService } from './graphs.service';

@Controller('graphs')
export class GraphsController {
  constructor(private readonly graphsService: GraphsService) {}

  @Get('filters')
  obtenerFiltros() {
    return this.graphsService.obtenerFiltros();
  }

  @Get('benchmark')
  ejecutarBenchmark(@Query() query: BenchmarkGrafoDto) {
    return this.graphsService.ejecutarBenchmark(query);
  }

  @Get('queries/:queryId')
  ejecutarConsulta(
    @Param('queryId') queryId: string,
    @Query() query: ConsultaGrafoDto,
  ) {
    return this.graphsService.ejecutarPorId(queryId, query);
  }
}
