import { BadRequestException } from '@nestjs/common';
import type { Collection, Document } from 'mongodb';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { PaginaConsulta } from '../entities/analytics.entity';

export async function paginarConsulta<T extends Record<string, any>>(
  collection: Collection<any>,
  pipeline: Document[],
  query: ConsultaAnalyticsDto,
  fields: string[],
  defaultSort: Record<string, 1 | -1>,
  scopeLabel: string,
): Promise<PaginaConsulta<T>> {
  const limite = query.limite ?? 10;
  const paginaSolicitada = Math.max(1, query.pagina ?? 1);
  const ordenarPor = query.ordenarPor ?? Object.keys(defaultSort)[0];

  if (!fields.includes(ordenarPor)) {
    throw new BadRequestException('La columna de orden no pertenece a esta consulta.');
  }

  const direccion = query.direccion ?? (defaultSort[ordenarPor] === -1 ? 'desc' : 'asc');
  const sortStage: Record<string, 1 | -1> = {
    [ordenarPor]: direccion === 'desc' ? -1 : 1,
    ...defaultSort,
  };
  sortStage[ordenarPor] = direccion === 'desc' ? -1 : 1;

  const patron = query.buscar?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filtroBusqueda: Document[] = patron
    ? [{
        $match: {
          $expr: {
            $or: fields.map(campo => ({
              $regexMatch: {
                input: { $ifNull: [{ $toString: `$${campo}` }, ''] },
                regex: patron,
                options: 'i',
              },
            })),
          },
        },
      }]
    : [];

  const etapasBase = pipeline.length > 0 ? pipeline : [{ $project: { _id: 0 } }];
  const pipelineCompleto: Document[] = [
    ...etapasBase,
    {
      $facet: {
        totalSinBusqueda: [{ $count: 'n' }],
        total: [...filtroBusqueda, { $count: 'n' }],
        items: [
          ...filtroBusqueda,
          { $sort: sortStage },
          { $skip: (paginaSolicitada - 1) * limite },
          { $limit: limite },
        ],
      },
    },
  ];
  const mongoQuery = `db.${collection.collectionName}.aggregate(${JSON.stringify(pipelineCompleto, null, 2)})`;

  const [resultado] = await collection.aggregate<{
    items: T[];
    total: Array<{ n: number }>;
    totalSinBusqueda: Array<{ n: number }>;
  }>(pipelineCompleto, { allowDiskUse: true }).toArray();

  const total = resultado?.total[0]?.n ?? 0;
  const totalSinBusqueda = resultado?.totalSinBusqueda[0]?.n ?? 0;
  const paginas = Math.max(1, Math.ceil(total / limite));
  const pagina = Math.min(paginaSolicitada, paginas);
  const inicio = (pagina - 1) * limite;
  const items = resultado?.items ?? [];

  return {
    items,
    total,
    totalSinBusqueda,
    pagina,
    limite,
    paginas,
    ordenarPor,
    direccion,
    scopeLabel,
    mongoQuery,
    desde: total ? inicio + 1 : 0,
    hasta: total ? inicio + items.length : 0,
    paginaAnterior: pagina > 1 ? pagina - 1 : null,
    paginaSiguiente: pagina < paginas ? pagina + 1 : null,
  };
}
