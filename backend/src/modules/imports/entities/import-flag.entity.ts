export interface ImportFlagRecord {
  importacion_id: string;
  archivo: string;
  fila: number;

  tipo: 'ERROR' | 'ADVERTENCIA';
  codigos: string[];
  mensaje: string;

  datos_crudos: Record<string, unknown> | string;

  created_at: string;
}