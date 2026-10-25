import type { EvaluacionDocument } from '../entities/evaluacion.entity';
import type { ContextoFila, ResultadoFila } from './importacion.types';
import { crearIncidencia } from './crearIncidencia.util';
import type { CampoConCentinela } from './normalizarTexto.util';
import { convertirEntero, esValorVacio, normalizarCampoTexto, normalizarEdad, normalizarFecha, normalizarResultado, normalizarSexo, normalizarTexto, normalizarTipoEstablecimiento, resolverIdentidad, validarAnioEvaluacion, validarIntento } from './normalizarTexto.util';

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
  if (Object.values(datosCrudos).some(
    valor => typeof valor === 'string' && valor !== normalizarTexto(valor),
  )) advertencias.add('WARN_TEXT_CLEANED');
  if (identidad.carnet === null) advertencias.add('WARN_EMPTY_CARNET');

  const campoTexto = (campo: CampoConCentinela): string => {
    const normalizado = normalizarCampoTexto(campo, datos[campo.toUpperCase()]);
    normalizado.advertencias.forEach(codigo => advertencias.add(codigo));
    return normalizado.valor;
  };

  const nacimientoOriginal = convertirEntero(datos.ANIO_NACIMIENTO);
  const edad = Object.prototype.hasOwnProperty.call(datos, 'EDAD')
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
  const establecimiento = campoTexto('establecimiento');
  const departamento = campoTexto('departamento_establecimiento');
  const municipio = campoTexto('municipio_establecimiento');
  const grado = campoTexto('grado_academico');

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
      `Fila aceptada con advertencias: ${[...advertencias].join(', ')}`,
      datosCrudos,
    ),
  };
}
