import type { EvaluacionDocument } from '../entities/evaluacion.entity';

const MARCADORES_VACIOS = new Set([
  '', 'NINGUNO', 'NINGUNA', 'SIN REGISTRO',
  'NO INDICA', 'N/A', 'NULL', '-',
]);

const RESULTADOS_APROBADOS = new Set([
  'APROBADO', 'APROBADA', 'SATISFACTORIO', 'SI', '1',
]);

const RESULTADOS_NO_APROBADOS = new Set([
  'NO APROBADO', 'NO APROBADA', 'REPROBADO',
  'REPROBADA', 'INSATISFACTORIO', 'NO', '0',
]);

const TIPOS_ESTABLECIMIENTO = new Map<
  string,
  EvaluacionDocument['tipo_establecimiento']
>([
  ['PUBLICO', 'PUBLICO'],
  ['OFICIAL', 'PUBLICO'],
  ['ESTATAL', 'PUBLICO'],
  ['NACIONAL', 'PUBLICO'],
  ['PRIVADO', 'PRIVADO'],
  ['PARTICULAR', 'PRIVADO'],
  ['POR COOPERATIVA', 'POR COOPERATIVA'],
  ['COOPERATIVA', 'POR COOPERATIVA'],
  ['MUNICIPAL', 'MUNICIPAL'],
]);

const CAMPOS_CON_CENTINELA = {
  carrera_objetivo: {
    centinela: 'SIN_CARRERA_OBJETIVO',
    codigo: 'WARN_EMPTY_CARRERA',
  },
  establecimiento: {
    centinela: 'SIN_ESTABLECIMIENTO',
    codigo: 'WARN_EMPTY_ESTABLECIMIENTO',
  },
  departamento_establecimiento: {
    centinela: 'SIN_DEPARTAMENTO',
    codigo: 'WARN_DEFAULT_CATALOG',
  },
  municipio_establecimiento: {
    centinela: 'SIN_MUNICIPIO',
    codigo: 'WARN_DEFAULT_CATALOG',
  },
  grado_academico: {
    centinela: 'SIN_GRADO_ACADEMICO',
    codigo: 'WARN_DEFAULT_CATALOG',
  },
} as const;

export type CampoConCentinela = keyof typeof CAMPOS_CON_CENTINELA;

export interface TextoNormalizado {
  valor: string;
  advertencias: string[];
}

export interface IdentidadNormalizada {
  correlativo: string;
  carnet: string | null;
}

export function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

export function esValorVacio(valor: string | null | undefined): boolean {
  return MARCADORES_VACIOS.has(normalizarTexto(valor));
}

export function normalizarFecha(valor: string | null | undefined): string | null {
  if (esValorVacio(valor)) return null;

  const texto = normalizarTexto(valor);
  const iso = /^(\d{4})([-/])(\d{2})\2(\d{2})$/.exec(texto);
  const europeo = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!iso && !europeo) return null;

  const anio = Number(iso ? iso[1] : europeo![3]);
  const mes = Number(iso ? iso[3] : europeo![2]);
  const dia = Number(iso ? iso[4] : europeo![1]);
  if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) return null;

  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function convertirEntero(valor: string | null | undefined): number | null {
  const texto = normalizarTexto(valor);
  if (!/^-?\d+$/.test(texto)) return null;
  const numero = Number(texto);
  return Number.isSafeInteger(numero) ? numero : null;
}

export function validarIntento(valor: string | null | undefined): number | null {
  const numero = convertirEntero(valor);
  return numero !== null && numero >= 1 ? numero : null;
}

export function validarAnioEvaluacion(valor: string | null | undefined): number | null {
  const numero = convertirEntero(valor);
  return numero !== null && numero >= 2000 && numero <= 2100 ? numero : null;
}

export function normalizarEdad(valor: string | null | undefined): number | null {
  const numero = convertirEntero(valor);
  return numero !== null && numero >= 12 && numero <= 80 ? numero : null;
}

export function normalizarResultado(
  valor: string | null | undefined,
): EvaluacionDocument['resultado_evaluacion'] | null {
  const texto = normalizarTexto(valor);
  if (RESULTADOS_APROBADOS.has(texto)) return 'APROBADO';
  if (RESULTADOS_NO_APROBADOS.has(texto)) return 'NO APROBADO';
  return null;
}

export function normalizarTipoEstablecimiento(
  valor: string | null | undefined,
): EvaluacionDocument['tipo_establecimiento'] {
  return TIPOS_ESTABLECIMIENTO.get(normalizarTexto(valor)) ?? 'SIN_TIPO_ESTABLECIMIENTO';
}

export function normalizarCampoTexto(
  campo: CampoConCentinela,
  valor: string | null | undefined,
): TextoNormalizado {
  const texto = normalizarTexto(valor);
  const configuracion = CAMPOS_CON_CENTINELA[campo];
  const ausente = esValorVacio(texto) ||
    (campo === 'carrera_objetivo' && texto === 'SIN CARRERA');

  return ausente
    ? { valor: configuracion.centinela, advertencias: [configuracion.codigo] }
    : { valor: texto, advertencias: [] };
}

export function normalizarSexo(
  valor: string | null | undefined,
): EvaluacionDocument['sexo'] {
  const texto = normalizarTexto(valor);
  if (['F', 'FEMENINO', 'MUJER'].includes(texto)) return 'F';
  if (['M', 'MASCULINO', 'HOMBRE'].includes(texto)) return 'M';
  return 'NO_ESPECIFICADO';
}

export function normalizarCarnet(valor: string | null | undefined): string | null {
  const texto = normalizarTexto(valor);
  return esValorVacio(texto) || texto === '0' ? null : texto;
}

export function resolverIdentidad(
  correlativoOriginal: string | null | undefined,
  carnetOriginal: string | null | undefined,
): IdentidadNormalizada | null {
  const correlativo = normalizarTexto(correlativoOriginal);
  const carnet = normalizarCarnet(carnetOriginal);
  if (!esValorVacio(correlativo)) return { correlativo, carnet };
  if (carnet !== null) return { correlativo: `CARNET:${carnet}`, carnet };
  return null;
}
