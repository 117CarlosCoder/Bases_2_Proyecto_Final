export interface ImportRecord {
  id: string;
  archivo: string;

  estado:
    | 'PROCESANDO'
    | 'COMPLETADO'
    | 'NEO4J_PENDIENTE'
    | 'FALLO';

  neo4j_sync: {
    status: 'SINCRONIZADO' | 'PENDIENTE' | 'FALLO';
    syncedAt: string | null;
    error: string | null;
    nodesProcessed: number;
  };

  contadores: {
    leidos: number;
    validos: number;
    nuevos: number;
    duplicados: number;
    advertencias: number;
    rechazados: number;
  };

  duracion_ms: number;
  created_at: string;
  finished_at: string | null;
}