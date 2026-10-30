import { ErrorCsv } from './errorCsv';
import { normalizarTexto } from './normalizarTexto.util';

const COLUMNAS_16 = [
  'CORRELATIVO', 'FECHA_ASIGNACION', 'CARNET', 'SEXO', 'EDAD',
  'GRADO_ACADEMICO', 'CARRERA_OBJETIVO', 'ESTABLECIMIENTO',
  'DEPARTAMENTO_ESTABLECIMIENTO', 'MUNICIPIO_ESTABLECIMIENTO',
  'TIPO_ESTABLECIMIENTO', 'FECHA_EVALUACION', 'NUMERO_EVALUACION',
  'ANIO_EVALUACION', 'MATERIA_EVALUADA', 'RESULTADO_EVALUACION',
];

const COLUMNAS_12 = [
  'CORRELATIVO', 'FECHA_ASIGNACION', 'SEXO', 'ANIO_NACIMIENTO',
  'CARRERA_OBJETIVO', 'DEPARTAMENTO_ESTABLECIMIENTO',
  'MUNICIPIO_ESTABLECIMIENTO', 'TIPO_ESTABLECIMIENTO',
  'NUMERO_EVALUACION', 'ANIO_EVALUACION', 'MATERIA_EVALUADA',
  'RESULTADO_EVALUACION',
];

const ALIAS_COLUMNAS: Record<string, string> = {
  CORRELATIVO_ASPIRANTE: 'CORRELATIVO',
  FECHA_ASIGNACIONA: 'FECHA_ASIGNACION',
  SEXOA: 'SEXO',
  DEPARTAMENTO_INSTITUCION_EDUCATIVA: 'DEPARTAMENTO_ESTABLECIMIENTO',
  DEPARTAMENTO_INSTITUCION_ED: 'DEPARTAMENTO_ESTABLECIMIENTO',
  MUNICIPIO_INSTITUCION_EDUCATIVA: 'MUNICIPIO_ESTABLECIMIENTO',
  MUNICIPIO_INSTITUCION_: 'MUNICIPIO_ESTABLECIMIENTO',
  TIPO_INSTITUCION_EDUCATIVA: 'TIPO_ESTABLECIMIENTO',
  NUMERO_DE_FECHA_DE_EVALUACION: 'NUMERO_EVALUACION',
  NUMERO_DE_FECHA_DE_EVALUACI: 'NUMERO_EVALUACION',
  ANIO_DE_INGRESO: 'ANIO_EVALUACION',
  MATERIA: 'MATERIA_EVALUADA',
  APROBACION: 'RESULTADO_EVALUACION',
};

const ENCABEZADOS_CON_ERRATA: Record<string, string> = {
  FECHA_ASIGNACIONA: 'FECHA_ASIGNACION',
  SEXOA: 'SEXO',
  DEPARTAMENTO_INSTITUCION_ED: 'DEPARTAMENTO_ESTABLECIMIENTO',
  MUNICIPIO_INSTITUCION_: 'MUNICIPIO_ESTABLECIMIENTO',
  NUMERO_DE_FECHA_DE_EVALUACI: 'NUMERO_EVALUACION',
};

export function detectarAdvertenciasEncabezados(originales: string[]): string[] {
  return originales.flatMap(valor => {
    const limpio = normalizarTexto(valor);
    const destino = ENCABEZADOS_CON_ERRATA[limpio];
    return destino ? [`${valor.trim()} → ${destino}`] : [];
  });
}

export function validarEncabezados(originales: string[]): string[] {
  const columnas = originales.map(valor => {
    const nombre = normalizarTexto(valor);
    return ALIAS_COLUMNAS[nombre] ?? nombre;
  });
  const esperadas = columnas.length === 16 ? COLUMNAS_16 : COLUMNAS_12;
  if (
    ![12, 16].includes(columnas.length) ||
    new Set(columnas).size !== columnas.length ||
    !esperadas.every(nombre => columnas.includes(nombre))
  ) {
    throw new ErrorCsv(
      'ERR_INVALID_HEADERS',
      'El encabezado debe contener las 16 columnas canónicas o las 12 columnas del PDF, sin duplicados.',
    );
  }
  return columnas;
}
