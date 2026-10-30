import type { EvaluacionDocument } from '../entities/evaluacion.entity';

const MARCADORES_VACIOS = new Set([
  '', 'NINGUNO', 'NINGUNA', 'SIN REGISTRO',
  'SIN DATOS', 'NO INDICA', 'N/A', 'NULL', '-',
]);

const CARRERAS_TRUNCADAS: Record<string, string> = {
  'INGENIERIA EN CIENCIAS Y': 'INGENIERIA EN CIENCIAS Y SISTEMAS',
};

const MUNICIPIOS_TRUNCADOS: Record<string, string> = {
  'ALTA VERAPAZ|FRAY BARTOLOM': 'FRAY BARTOLOME DE LAS CASAS',
  'ALTA VERAPAZ|SAN CRISTOBAL': 'SAN CRISTOBAL VERAPAZ',
  'ALTA VERAPAZ|SANTA CRUZ': 'SANTA CRUZ VERAPAZ',
  'BAJA VERAPAZ|SAN MIGUEL': 'SAN MIGUEL CHICAJ',
  'CHIMALTENANGO|SAN ANDRES': 'SAN ANDRES ITZAPA',
  'CHIMALTENANGO|SAN MARTIN': 'SAN MARTIN JILOTEPEQUE',
  'CHIMALTENANGO|TECPAN GUATEMAL': 'TECPAN GUATEMALA',
  'EL PROGRESO|SAN AGUSTIN': 'SAN AGUSTIN ACASAGUASTLAN',
  'EL PROGRESO|SAN ANTONIO': 'SAN ANTONIO LA PAZ',
  'ESCUINTLA|LA DEMOCRAC': 'LA DEMOCRACIA',
  'ESCUINTLA|NUEVA CONCEPCIO': 'NUEVA CONCEPCION',
  'ESCUINTLA|SAN VICENTE': 'SAN VICENTE PACAYA',
  'ESCUINTLA|SANTA LUCIA': 'SANTA LUCIA COTZUMALGUAPA',
  'GUATEMALA|GUATEMALA - CIUDAD': 'GUATEMALA - CIUDAD CAPITAL',
  'GUATEMALA|SAN JUAN SACATEPEQ': 'SAN JUAN SACATEPEQUEZ',
  'GUATEMALA|SAN PEDRO SACATEPEQ': 'SAN PEDRO SACATEPEQUEZ',
  'GUATEMALA|SANTA CATARINA': 'SANTA CATARINA PINULA',
  'HUEHUETENANGO|LA DEMOCRAC': 'LA DEMOCRACIA',
  'HUEHUETENANGO|SAN ANTONIO': 'SAN ANTONIO HUISTA',
  'HUEHUETENANGO|SAN SEBASTIAN': 'SAN SEBASTIAN HUEHUETENANGO',
  'JUTIAPA|SANTA CATARINA': 'SANTA CATARINA MITA',
  'PETEN|MELCHOR DE': 'MELCHOR DE MENCOS',
  'QUEZALTENANGO|SAN CARLOS': 'SAN CARLOS SIJA',
  'QUICHE|SANTA CRUZ DEL': 'SANTA CRUZ DEL QUICHE',
  'RETALHULEU|SAN ANDRES': 'SAN ANDRES VILLA SECA',
  'RETALHULEU|SAN MARTIN': 'SAN MARTIN ZAPOTITLAN',
  'RETALHULEU|SANTA CRUZ': 'SANTA CRUZ MULUA',
  'SACATEPEQUEZ|ANTIGUA GUATEMAL': 'ANTIGUA GUATEMALA',
  'SACATEPEQUEZ|SAN BARTOLOM': 'SAN BARTOLOME MILPAS ALTAS',
  'SACATEPEQUEZ|SAN LUCAS SACATEPEQ': 'SAN LUCAS SACATEPEQUEZ',
  'SACATEPEQUEZ|SANTA LUCIA': 'SANTA LUCIA MILPAS ALTAS',
  'SACATEPEQUEZ|SANTIAGO SACATEPEQ': 'SANTIAGO SACATEPEQUEZ',
  'SACATEPEQUEZ|SANTO DOMINGO': 'SANTO DOMINGO XENACOJ',
  'SAN MARCOS|SAN CRISTOBAL': 'SAN CRISTOBAL CUCHO',
  'SAN MARCOS|SAN PEDRO SACATEPEQ': 'SAN PEDRO SACATEPEQUEZ',
  'SAN MARCOS|SAN RAFAEL PIE': 'SAN RAFAEL PIE DE LA CUESTA',
  'SANTA ROSA|NUEVA SANTA': 'NUEVA SANTA ROSA',
  'SANTA ROSA|SANTA ROSA DE': 'SANTA ROSA DE LIMA',
  'SOLOLA|SAN ANDRES': 'SAN ANDRES SEMETABAJ',
  'SOLOLA|SAN ANTONIO': 'SAN ANTONIO PALOPO',
  'SOLOLA|SANTA CATARINA': 'SANTA CATARINA IXTAHUACAN',
  'SOLOLA|SANTA LUCIA': 'SANTA LUCIA UTATLAN',
  'SOLOLA|SANTA MARIA': 'SANTA MARIA VISITACION',
  'SUCHITEPEQUEZ|SAN ANTONIO': 'SAN ANTONIO SUCHITEPEQUEZ',
  'SUCHITEPEQUEZ|SAN FRANCISCO': 'SAN FRANCISCO ZAPOTITLAN',
  'SUCHITEPEQUEZ|SAN JOSE LA': 'SAN JOSE LA MAQUINA',
  'TOTONICAPAN|SAN ANDRES': 'SAN ANDRES XECUL',
  'TOTONICAPAN|SAN CRISTOBAL': 'SAN CRISTOBAL TOTONICAPAN',
};

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
  const limpio = normalizarTexto(valor);
  const carreraReconstruida = campo === 'carrera_objetivo' ? CARRERAS_TRUNCADAS[limpio] : undefined;
  const texto = carreraReconstruida ?? limpio;
  const configuracion = CAMPOS_CON_CENTINELA[campo];
  const ausente = esValorVacio(texto) ||
    (campo === 'carrera_objetivo' && texto === 'SIN CARRERA');

  if (ausente) {
    return { valor: configuracion.centinela, advertencias: [configuracion.codigo] };
  }
  return {
    valor: texto,
    advertencias: carreraReconstruida ? ['WARN_TRUNCATED_CARRERA'] : [],
  };
}

export function normalizarMunicipioTruncado(departamento: string, municipio: string): string {
  return MUNICIPIOS_TRUNCADOS[`${departamento}|${municipio}`] ?? municipio;
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
