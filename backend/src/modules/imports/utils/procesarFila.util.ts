import type { EvaluacionDocument } from '../entities/evaluacion.entity';
import type { ContextoFila, ResultadoFila } from './importacion.types';
import { crearIncidencia } from './crearIncidencia.util';
import type { CampoConCentinela } from './normalizarTexto.util';
import { convertirEntero, esValorVacio, normalizarCampoTexto, normalizarEdad, normalizarFecha, normalizarMunicipioTruncado, normalizarResultado, normalizarSexo, normalizarTexto, normalizarTipoEstablecimiento, resolverIdentidad, validarAnioEvaluacion, validarIntento } from './normalizarTexto.util';

export function procesarFila(
  datos: Record<string, string>,
  contexto: ContextoFila,
  datosCrudos: Record<string, unknown> = datos,
): ResultadoFila {
  const errores: string[] = [];
  const identidad = resolverIdentidad(datos.CORRELATIVO, datos.CARNET);
  const fechaAsignacion = normalizarFecha(datos.FECHA_ASIGNACION);
  const fechaEvaluacion = normalizarFecha(datos.FECHA_EVALUACION);
  const intento = validarIntento(datos.NUMERO_EVALUACION);
  const anio = validarAnioEvaluacion(datos.ANIO_EVALUACION);
  const materia = normalizarTexto(datos.MATERIA_EVALUADA);
  const resultado = normalizarResultado(datos.RESULTADO_EVALUACION);

  if (!identidad) errores.push('ERR_MISSING_IDENTITY');
  if (!fechaAsignacion) errores.push('ERR_INVALID_DATE');
  if (!esValorVacio(datos.FECHA_EVALUACION) && !fechaEvaluacion) {
    errores.push('ERR_INVALID_DATE');
  }
  if (intento === null) errores.push('ERR_INVALID_ATTEMPT');
  if (anio === null) errores.push('ERR_INVALID_YEAR');
  if (esValorVacio(materia)) errores.push('ERR_MISSING_SUBJECT');
  if (resultado === null) errores.push('ERR_INVALID_RESULT');

  if (
    errores.length > 0 || !identidad || !fechaAsignacion ||
    intento === null || anio === null || resultado === null
  ) {
    return {
      evaluacion: null,
      incidencia: crearIncidencia(
        contexto, 'ERROR', errores,
        `Fila rechazada: ${[...new Set(errores)].join(', ')}`,
        datosCrudos,
      ),
    };
  }

  const advertencias = new Set<string>();
  const tieneColumna = (columna: string): boolean =>
    Object.prototype.hasOwnProperty.call(datos, columna);

  if (Object.values(datosCrudos).some(
    valor => typeof valor === 'string' && valor.toUpperCase() !== normalizarTexto(valor),
  )) advertencias.add('WARN_TEXT_CLEANED');
  if (tieneColumna('CARNET') && identidad.carnet === null) {
    advertencias.add('WARN_EMPTY_CARNET');
  }

  const campoTexto = (campo: CampoConCentinela, exigirColumna = false): string => {
    const columna = campo.toUpperCase();
    const normalizado = normalizarCampoTexto(campo, datos[columna]);
    if (!exigirColumna || tieneColumna(columna)) {
      normalizado.advertencias.forEach(codigo => advertencias.add(codigo));
    }
    return normalizado.valor;
  };

  const nacimientoOriginal = convertirEntero(datos.ANIO_NACIMIENTO);
  const edad = tieneColumna('EDAD')
    ? normalizarEdad(datos.EDAD)
    : normalizarEdad(nacimientoOriginal === null ? null : String(anio - nacimientoOriginal));
  const nacimiento = edad === null ? null : anio - edad;
  if (edad === null) advertencias.add('WARN_AGE_NULL_OR_OUT_OF_RANGE');

  const sexo = normalizarSexo(datos.SEXO);
  const tipo = normalizarTipoEstablecimiento(datos.TIPO_ESTABLECIMIENTO);
  if (sexo === 'NO_ESPECIFICADO' || tipo === 'SIN_TIPO_ESTABLECIMIENTO') {
    advertencias.add('WARN_DEFAULT_CATALOG');
  }

  const carrera = campoTexto('carrera_objetivo');
  const departamento = campoTexto('departamento_establecimiento');
  const municipioBase = campoTexto('municipio_establecimiento');
  const municipio = normalizarMunicipioTruncado(departamento, municipioBase);
  if (municipio !== municipioBase) {
    advertencias.add('WARN_TRUNCATED_MUNICIPIO');
  }
  const grado = campoTexto('grado_academico', true);
  const establecimientoDirecto = campoTexto('establecimiento', true);
  const establecimiento = tieneColumna('ESTABLECIMIENTO')
    ? establecimientoDirecto
    : (municipio !== 'SIN_MUNICIPIO' && tipo !== 'SIN_TIPO_ESTABLECIMIENTO'
      ? `${tipo} · ${municipio}`
      : 'SIN_ESTABLECIMIENTO');

  const detallesAdvertencia: string[] = [];
  if (advertencias.has('WARN_TRUNCATED_CARRERA')) {
    detallesAdvertencia.push(`Carrera truncada reconstruida (${(datos.CARRERA_OBJETIVO ?? '').trim()} → ${carrera})`);
  }
  if (advertencias.has('WARN_TRUNCATED_MUNICIPIO')) {
    detallesAdvertencia.push(`Municipio truncado reconstruido (${municipioBase} → ${municipio})`);
  }
  if (advertencias.has('WARN_EMPTY_CARRERA')) {
    detallesAdvertencia.push(`Carrera objetivo vacía o sin dato (${(datos.CARRERA_OBJETIVO ?? '').trim() || 'vacío'} → ${carrera})`);
  }
  if (advertencias.has('WARN_AGE_NULL_OR_OUT_OF_RANGE')) {
    const crudoEdad = tieneColumna('EDAD') ? datos.EDAD : datos.ANIO_NACIMIENTO;
    detallesAdvertencia.push(`Año de nacimiento o edad no válido (${(crudoEdad ?? '').trim() || 'vacío'} → edad nula)`);
  }
  if (advertencias.has('WARN_DEFAULT_CATALOG')) {
    const camposPorDefecto: string[] = [];
    if (departamento === 'SIN_DEPARTAMENTO') camposPorDefecto.push(`depto=${(datos.DEPARTAMENTO_ESTABLECIMIENTO ?? '').trim() || 'vacío'}`);
    if (municipio === 'SIN_MUNICIPIO') camposPorDefecto.push(`municipio=${(datos.MUNICIPIO_ESTABLECIMIENTO ?? '').trim() || 'vacío'}`);
    if (tipo === 'SIN_TIPO_ESTABLECIMIENTO') camposPorDefecto.push(`tipo=${(datos.TIPO_ESTABLECIMIENTO ?? '').trim() || 'vacío'}`);
    if (sexo === 'NO_ESPECIFICADO') camposPorDefecto.push(`sexo=${(datos.SEXO ?? '').trim() || 'vacío'}`);
    if (grado === 'SIN_GRADO_ACADEMICO' && tieneColumna('GRADO_ACADEMICO')) camposPorDefecto.push('grado vacío');
    detallesAdvertencia.push(`Catálogo por defecto aplicado (${camposPorDefecto.join(', ')})`);
  }
  if (advertencias.has('WARN_EMPTY_ESTABLECIMIENTO')) {
    detallesAdvertencia.push('Establecimiento vacío reemplazado por SIN_ESTABLECIMIENTO');
  }
  if (advertencias.has('WARN_EMPTY_CARNET')) {
    detallesAdvertencia.push('Carnet vacío o cero');
  }
  if (advertencias.has('WARN_TEXT_CLEANED')) {
    detallesAdvertencia.push('Espacios sobrantes o formato de texto normalizados');
  }

  const evaluacion: EvaluacionDocument = {
    evaluacion_uid: `${identidad.correlativo}|${materia}|${anio}|${intento}`,
    correlativo: identidad.correlativo,
    carnet: identidad.carnet,
    fecha_asignacion: fechaAsignacion,
    anio_asignacion: Number(fechaAsignacion.slice(0, 4)),
    mes_asignacion: Number(fechaAsignacion.slice(5, 7)),
    fecha_evaluacion: fechaEvaluacion,
    sexo,
    edad,
    anio_nacimiento: nacimiento,
    grado_academico: grado,
    carrera_objetivo: carrera,
    establecimiento,
    departamento_establecimiento: departamento,
    municipio_establecimiento: municipio,
    municipio_uid: `${departamento}|${municipio}`,
    tipo_establecimiento: tipo,
    materia_evaluada: materia,
    numero_evaluacion: intento,
    anio_evaluacion: anio,
    resultado_evaluacion: resultado,
    aprobado: resultado === 'APROBADO',
    advertencias: [...advertencias],
    importacion_id: contexto.importacionId,
    fila_origen: contexto.fila,
    updated_at: contexto.fechaProcesamiento,
  };

  return {
    evaluacion,
    incidencia: advertencias.size === 0 ? null : crearIncidencia(
      contexto, 'ADVERTENCIA', [...advertencias],
      detallesAdvertencia.join(' · ') || `Fila aceptada con advertencias: ${[...advertencias].join(', ')}`,
      datosCrudos,
    ),
  };
}
