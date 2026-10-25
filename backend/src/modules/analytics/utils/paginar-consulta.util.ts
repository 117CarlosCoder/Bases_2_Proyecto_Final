import { BadRequestException } from '@nestjs/common';
import type { Collection, Document } from 'mongodb';
import type { ConsultaAnalyticsDto } from '../dto/consulta-analytics.dto';
import type { PaginaConsulta } from '../entities/analytics.entity';

function normalizarTexto(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compararValores(a: unknown, b: unknown, direccion: 'asc' | 'desc'): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const factor = direccion === 'desc' ? -1 : 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }
  return String(a).localeCompare(String(b), 'es') * factor;
}

export async function paginarConsulta<T extends Record<string, any>>(
  collection: Collection<any>,
  pipeline: Document[],
  query: ConsultaAnalyticsDto,
  fields: string[],
  defaultSort: Record<string, 1 | -1>,
  scopeLabel: string,
): Promise<PaginaConsulta<T>> {
  const limite = query.limite ?? 10;
  const paginaSolicitada = query.pagina ?? 1;
  const ordenarPor = query.ordenarPor ?? Object.keys(defaultSort)[0];

  if (!fields.includes(ordenarPor)) {
    throw new BadRequestException('La columna de orden no pertenece a esta consulta.');
  }

  const direccion = query.direccion ?? (defaultSort[ordenarPor] === -1 ? 'desc' : 'asc');
  const registros = pipeline.length > 0
    ? await collection.aggregate<T>(pipeline).toArray()
    : await collection.find<T>({}, { projection: { _id: 0 } }).toArray();

  const textoBusqueda = normalizarTexto(query.buscar);
  const filtrados = textoBusqueda
    ? registros.filter(fila => fields.some(campo => normalizarTexto(fila[campo]).includes(textoBusqueda)))
    : registros;

  const ordenados = [...filtrados].sort((a, b) => {
    const comparacionPrincipal = compararValores(a[ordenarPor], b[ordenarPor], direccion);
    if (comparacionPrincipal !== 0) return comparacionPrincipal;

    for (const [campo, dir] of Object.entries(defaultSort)) {
      const desempate = compararValores(a[campo], b[campo], dir === -1 ? 'desc' : 'asc');
      if (desempate !== 0) return desempate;
    }
    return 0;
  });

  const total = ordenados.length;
  const paginas = Math.max(1, Math.ceil(total / limite));
  const pagina = Math.min(paginaSolicitada, paginas);
  const inicio = (pagina - 1) * limite;
  const items = ordenados.slice(inicio, inicio + limite);

  return {
    items,
    total,
    totalSinBusqueda: registros.length,
    pagina,
    limite,
    paginas,
    ordenarPor,
    direccion,
    scopeLabel,
    desde: total ? inicio + 1 : 0,
    hasta: total ? inicio + items.length : 0,
    paginaAnterior: pagina > 1 ? pagina - 1 : null,
    paginaSiguiente: pagina < paginas ? pagina + 1 : null,
  };
}
