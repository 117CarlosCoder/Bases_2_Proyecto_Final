import type { Driver, Record as Neo4jRecord } from 'neo4j-driver';
import type { AristaGrafo, NodoGrafo, TipoNodoGrafo } from '../entities/graph.entity';

export function aNumero(valor: unknown): number {
  if (typeof valor === 'number') return valor;
  if (
    typeof valor === 'object' &&
    valor !== null &&
    'toNumber' in valor &&
    typeof (valor as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (valor as { toNumber: () => number }).toNumber();
  }
  return Number(valor ?? 0);
}

export function aTexto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

export async function ejecutarConsultaCypher(
  driver: Driver,
  cypher: string,
  parametros: Record<string, unknown>,
  limite = 35,
): Promise<{ registros: Neo4jRecord[]; truncated: boolean; limit: number }> {
  const session = driver.session();
  try {
    const res = await session.run(cypher, {
      ...parametros,
      limiteMasUno: limite + 1,
    });
    return {
      registros: res.records.slice(0, limite),
      truncated: res.records.length > limite,
      limit: limite,
    };
  } finally {
    await session.close();
  }
}

export class ArmadorSubgrafo {
  private readonly nodos = new Map<string, NodoGrafo>();
  private readonly aristas = new Map<string, AristaGrafo>();

  nodo(
    type: TipoNodoGrafo,
    clave: string,
    label: string,
    properties: Record<string, string | number | boolean | null>,
  ): string {
    const id = `${type}:${clave}`;
    if (!this.nodos.has(id)) {
      this.nodos.set(id, { id, label, type, properties });
    }
    return id;
  }

  arista(source: string, target: string, label: string): void {
    const id = `${source}->${label}->${target}`;
    if (!this.aristas.has(id)) {
      this.aristas.set(id, { id, source, target, label });
    }
  }

  resultado() {
    return {
      nodes: Array.from(this.nodos.values()),
      edges: Array.from(this.aristas.values()),
    };
  }
}
