# Consultas de Agregación de MongoDB

## Modelo Documental Utilizado

### Colecciones
- `evaluaciones {evaluacion_uid, correlativo, carnet, fecha_asignacion, anio_asignacion, mes_asignacion, fecha_evaluacion, sexo, edad, anio_nacimiento, grado_academico, carrera_objetivo, establecimiento, departamento_establecimiento, municipio_establecimiento, municipio_uid, tipo_establecimiento, materia_evaluada, numero_evaluacion, anio_evaluacion, resultado_evaluacion, aprobado, advertencias, importacion_id, fila_origen, updated_at}`
- `resumen_carrera {carrera_objetivo, aspirantes_distintos, evaluaciones, evaluaciones_aprobadas, porcentaje_aprobacion, promedio_edad, updated_at}`
- `importaciones {importacion_id, nombre_archivo, estado, total_filas, filas_validas, filas_con_error, filas_con_advertencia, insertados, actualizados, nodos_procesados_neo4j, duracion_ms, created_at}`
- `errores_importacion {importacion_id, fila, tipo, codigo, campo, valor_original, mensaje, created_at}`


## 20 Consultas 

### P1 · Cantidad de aspirantes por tipo de institución educativa
- **Archivo:** `backend/src/modules/analytics/queries/p1-tipo-institucion.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p1?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Contar cuántos aspirantes únicos provienen de cada sector educativo , evitando duplicar personas con múltiples evaluaciones.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } }, 
  {
    $group: {
      _id: {
        tipo_establecimiento: '$tipo_establecimiento',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: '$_id.tipo_establecimiento',
      aspirantes: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      tipo_establecimiento: '$_id',
      aspirantes: 1
    }
  },
  { $sort: { aspirantes: -1, tipo_establecimiento: 1 } }
])
```

---

### P2 · Cantidad de evaluaciones aprobadas por materia
- **Archivo:** `backend/src/modules/analytics/queries/p2-aprobados-materia.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p2?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Totalizar cuántas evaluaciones obtuvieron resultado satisfactorio desglosadas por cada materia evaluada .
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, aprobado: true } }, 
  {
    $group: {
      _id: '$materia_evaluada',
      aprobados: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      materia_evaluada: '$_id',
      aprobados: 1
    }
  },
  { $sort: { aprobados: -1, materia_evaluada: 1 } }
])
```

---

### P3 · Aspirantes aprobados por carrera objetivo y año de evaluación
- **Archivo:** `backend/src/modules/analytics/queries/p3-aprobados-carrera-anio.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p3?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Determinar el número de aspirantes únicos que aprobaron al menos una evaluación, agrupados por carrera objetivo y año de evaluación.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, aprobado: true } },
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        anio_evaluacion: '$anio_evaluacion',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: {
        carrera_objetivo: '$_id.carrera_objetivo',
        anio_evaluacion: '$_id.anio_evaluacion'
      },
      aspirantes_aprobados: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id.carrera_objetivo',
      anio_evaluacion: '$_id.anio_evaluacion',
      aspirantes_aprobados: 1
    }
  },
  { $sort: { anio_evaluacion: -1, aspirantes_aprobados: -1, carrera_objetivo: 1 } }
])
```

---

### P4 · Tasa y porcentaje de aprobación por materia
- **Archivo:** `backend/src/modules/analytics/queries/p4-tasa-aprobacion.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p4?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Calcular el volumen total de evaluaciones, el total de aprobadas y el porcentaje de aprobación redondeado a 2 decimales para cada materia evaluada.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: '$materia_evaluada',
      evaluaciones: { $sum: 1 },
      aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      materia_evaluada: '$_id',
      evaluaciones: 1,
      aprobadas: 1,
      porcentaje_aprobacion: {
        $round: [
          { $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] },
          2
        ]
      }
    }
  },
  { $sort: { porcentaje_aprobacion: -1, materia_evaluada: 1 } }
])
```

---

### P5 · Promedio de edad de los aspirantes por carrera objetivo
- **Archivo:** `backend/src/modules/analytics/queries/p5-edad-carrera.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p5?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Obtener la edad promedio de los aspirantes únicos por carrera objetivo, excluyendo registros con `edad: null` y de duplicando previamente por aspirante.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, edad: { $ne: null } } },
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      },
      edad: { $max: '$edad' }
    }
  },
  {
    $group: {
      _id: '$_id.carrera_objetivo',
      aspirantes_con_edad: { $sum: 1 },
      promedio_edad: { $avg: '$edad' }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id',
      aspirantes_con_edad: 1,
      promedio_edad: { $round: ['$promedio_edad', 2] }
    }
  },
  { $sort: { promedio_edad: -1, carrera_objetivo: 1 } }
])
```

---

### P6 · Colección materializada de resumen por carrera 
- **Archivo:** `backend/src/modules/analytics/queries/p6-resumen-carrera.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p6` (lectura) y `POST /api/analytics/resumen-carrera` (materialización)
- **Propósito:** Generar y persistir en la colección secundaria `resumen_carrera` los indicadores consolidados por carrera objetivo utilizando la etapa `$merge`.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      },
      evaluaciones_aspirante: { $sum: 1 },
      aprobadas_aspirante: { $sum: { $cond: ['$aprobado', 1, 0] } },
      edad_aspirante: { $max: '$edad' }
    }
  },
  {
    $group: {
      _id: '$_id.carrera_objetivo',
      aspirantes_distintos: { $sum: 1 },
      evaluaciones: { $sum: '$evaluaciones_aspirante' },
      evaluaciones_aprobadas: { $sum: '$aprobadas_aspirante' },
      promedio_edad: { $avg: '$edad_aspirante' }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id',
      aspirantes_distintos: 1,
      evaluaciones: 1,
      evaluaciones_aprobadas: 1,
      porcentaje_aprobacion: {
        $round: [
          { $multiply: [{ $divide: ['$evaluaciones_aprobadas', '$evaluaciones'] }, 100] },
          2
        ]
      },
      promedio_edad: { $round: ['$promedio_edad', 2] },
      updated_at: { $literal: '$ahora' }
    }
  },
  {
    $merge: {
      into: 'resumen_carrera',
      on: 'carrera_objetivo',
      whenMatched: 'replace',
      whenNotMatched: 'insert'
    }
  }
])
```

---

### P7 · Promedio de edad de aspirantes aprobados por carrera y tipo de institución
- **Archivo:** `backend/src/modules/analytics/queries/p7-edad-aprobados-carrera-institucion.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p7?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Cruzar la carrera objetivo y el sector educativo  para calcular la cantidad de aspirantes únicos aprobados con edad válida y su promedio de edad.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, aprobado: true, edad: { $ne: null } } },
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        tipo_establecimiento: '$tipo_establecimiento',
        correlativo: '$correlativo'
      },
      edad: { $max: '$edad' }
    }
  },
  {
    $group: {
      _id: {
        carrera_objetivo: '$_id.carrera_objetivo',
        tipo_establecimiento: '$_id.tipo_establecimiento'
      },
      aspirantes_aprobados: { $sum: 1 },
      promedio_edad: { $avg: '$edad' }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id.carrera_objetivo',
      tipo_establecimiento: '$_id.tipo_establecimiento',
      aspirantes_aprobados: 1,
      promedio_edad: { $round: ['$promedio_edad', 2] }
    }
  },
  { $sort: { aspirantes_aprobados: -1, carrera_objetivo: 1 } }
])
```

---

### P8 · Distribución de aspirantes aprobados por municipio y carrera objetivo
- **Archivo:** `backend/src/modules/analytics/queries/p8-aprobados-municipio-carrera.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p8?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Identificar cuántos aspirantes únicos aprobaron evaluaciones agrupados por departamento, municipio del establecimiento educativo y carrera objetivo.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, aprobado: true } },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$departamento_establecimiento',
        municipio_establecimiento: '$municipio_establecimiento',
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$_id.departamento_establecimiento',
        municipio_establecimiento: '$_id.municipio_establecimiento',
        carrera_objetivo: '$_id.carrera_objetivo'
      },
      aspirantes_aprobados: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      departamento_establecimiento: '$_id.departamento_establecimiento',
      municipio_establecimiento: '$_id.municipio_establecimiento',
      carrera_objetivo: '$_id.carrera_objetivo',
      aspirantes_aprobados: 1
    }
  },
  { $sort: { aspirantes_aprobados: -1, municipio_establecimiento: 1 } }
])
```

---

### P9 · Cantidad de evaluaciones por mes y materia en instituciones públicas
- **Archivo:** `backend/src/modules/analytics/queries/p9-evaluaciones-mes-publico.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p9?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Analizar la estacionalidad mensual de las pruebas aplicadas a estudiantes provenientes del sector `PUBLICO`, agrupando por año de asignación, mes de asignación y materia evaluada.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, tipo_establecimiento: 'PUBLICO' } },
  {
    $group: {
      _id: {
        anio_asignacion: '$anio_asignacion',
        mes_asignacion: '$mes_asignacion',
        materia_evaluada: '$materia_evaluada'
      },
      evaluaciones: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      anio_asignacion: '$_id.anio_asignacion',
      mes_asignacion: '$_id.mes_asignacion',
      materia_evaluada: '$_id.materia_evaluada',
      evaluaciones: 1
    }
  },
  { $sort: { anio_asignacion: -1, mes_asignacion: 1, materia_evaluada: 1 } }
])
```

---

### P10 · Top 5 carreras más demandadas por aspirantes jóvenes (16 a 18 años)
- **Archivo:** `backend/src/modules/analytics/queries/p10-top-carreras-jovenes.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p10?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Determinar las 5 carreras objetivo con mayor volumen de aspirantes únicos cuya edad se encuentra en el rango de 16 a 18 años inclusive.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, edad: { $gte: 16, $lte: 18 } } },
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: '$_id.carrera_objetivo',
      aspirantes: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id',
      aspirantes: 1
    }
  },
  { $sort: { aspirantes: -1, carrera_objetivo: 1 } },
  { $limit: 5 }
])
```

---

### P11 · Historial de desempeño por aspirante, materia e intento
- **Archivo:** `backend/src/modules/analytics/queries/p11-desempeno-aspirante.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p11?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Proyectar el detalle individual de evaluaciones por aspirante ordenado cronológicamente por oportunidad.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $project: {
      _id: 0,
      correlativo: 1,
      carnet: 1,
      anio_evaluacion: 1,
      materia_evaluada: 1,
      numero_evaluacion: 1,
      resultado_evaluacion: 1,
      carrera_objetivo: 1
    }
  },
  { $sort: { correlativo: 1, anio_evaluacion: -1, numero_evaluacion: 1 } }
])
```

---

### P12 · Distribución de aspirantes por sexo y tipo de institución educativa
- **Archivo:** `backend/src/modules/analytics/queries/p12-sexo-tipo-institucion.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p12?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Cuantificar la composición demográfica de aspirantes únicos cruzando el sexo con el sector del establecimiento educativo.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: {
        sexo: '$sexo',
        tipo_establecimiento: '$tipo_establecimiento',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: {
        sexo: '$_id.sexo',
        tipo_establecimiento: '$_id.tipo_establecimiento'
      },
      aspirantes: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      sexo: '$_id.sexo',
      tipo_establecimiento: '$_id.tipo_establecimiento',
      aspirantes: 1
    }
  },
  { $sort: { aspirantes: -1, tipo_establecimiento: 1 } }
])
```

---

### P13 · Tasa de aprobación según la edad del aspirante
- **Archivo:** `backend/src/modules/analytics/queries/p13-aprobacion-edad.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p13?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Evaluar el rendimiento académico en función de cada edad válida (`edad != null`), calculando el total de evaluaciones, aprobadas y el porcentaje de aprobación por edad.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, edad: { $ne: null } } },
  {
    $group: {
      _id: '$edad',
      evaluaciones: { $sum: 1 },
      aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      edad: '$_id',
      evaluaciones: 1,
      aprobadas: 1,
      porcentaje_aprobacion: {
        $round: [
          { $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] },
          2
        ]
      }
    }
  },
  { $sort: { edad: 1 } }
])
```

---

### P14 · Promedio de intentos requeridos por materia evaluada
- **Archivo:** `backend/src/modules/analytics/queries/p14-promedio-intentos-materia.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p14?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Determinar el número máximo de oportunidad 
 alcanzado por cada aspirante en cada materia y promediar dichos intentos para medir la persistencia y dificultad por asignatura.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: {
        materia_evaluada: '$materia_evaluada',
        correlativo: '$correlativo'
      },
      intentos: { $max: '$numero_evaluacion' }
    }
  },
  {
    $group: {
      _id: '$_id.materia_evaluada',
      aspirantes: { $sum: 1 },
      promedio_intentos: { $avg: '$intentos' }
    }
  },
  {
    $project: {
      _id: 0,
      materia_evaluada: '$_id',
      aspirantes: 1,
      promedio_intentos: { $round: ['$promedio_intentos', 2] }
    }
  },
  { $sort: { promedio_intentos: -1, materia_evaluada: 1 } }
])
```

---

### P15 · Resumen consolidado de evaluaciones por aspirante
- **Archivo:** `backend/src/modules/analytics/queries/p15-resumen-aspirante.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p15?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Construir una ficha consolidada por aspirante 
 que sintetiza su carnet, año más reciente, sexo, edad, carrera objetivo, establecimiento de procedencia, total de pruebas realizadas y total de pruebas aprobadas.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: '$correlativo',
      carnet: { $max: '$carnet' },
      anio_evaluacion: { $max: '$anio_evaluacion' },
      sexo: { $first: '$sexo' },
      edad: { $max: '$edad' },
      carrera_objetivo: { $first: '$carrera_objetivo' },
      establecimiento: { $first: '$establecimiento' },
      evaluaciones: { $sum: 1 },
      aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      correlativo: '$_id',
      carnet: 1,
      anio_evaluacion: 1,
      sexo: 1,
      edad: 1,
      carrera_objetivo: 1,
      establecimiento: 1,
      evaluaciones: 1,
      aprobadas: 1
    }
  },
  { $sort: { evaluaciones: -1, correlativo: 1 } }
])
```

---

### P16 · Aspirantes reprobados en su primer intento por carrera objetivo
- **Archivo:** `backend/src/modules/analytics/queries/p16-reprobados-primer-intento.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p16?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Identificar cuántas personas distintas reprobaron en su primera oportunidad (`numero_evaluacion: 1, aprobado: false`) agrupadas por cada carrera objetivo.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio, numero_evaluacion: 1, aprobado: false } },
  {
    $group: {
      _id: {
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: '$_id.carrera_objetivo',
      aspirantes_reprobados: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      carrera_objetivo: '$_id',
      aspirantes_reprobados: 1
    }
  },
  { $sort: { aspirantes_reprobados: -1, carrera_objetivo: 1 } }
])
```

---

### P17 · Top 5 municipios con mayor cantidad de aspirantes
- **Archivo:** `backend/src/modules/analytics/queries/p17-top-municipios-aspirantes.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p17?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Obtener los 5 municipios y departamentos de procedencia educativa que aportan el mayor volumen de aspirantes únicos a las pruebas de ubicación.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$departamento_establecimiento',
        municipio_establecimiento: '$municipio_establecimiento',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$_id.departamento_establecimiento',
        municipio_establecimiento: '$_id.municipio_establecimiento'
      },
      aspirantes: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      departamento_establecimiento: '$_id.departamento_establecimiento',
      municipio_establecimiento: '$_id.municipio_establecimiento',
      aspirantes: 1
    }
  },
  { $sort: { aspirantes: -1, municipio_establecimiento: 1 } },
  { $limit: 5 }
])
```

---

### P18 · Porcentaje de aprobación por tipo de institución educativa
- **Archivo:** `backend/src/modules/analytics/queries/p18-aprobacion-tipo-institucion.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p18?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Comparar la efectividad en las evaluaciones según el sector del establecimiento de origen, calculando evaluaciones totales, aprobadas y tasa porcentual de aprobación.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: '$tipo_establecimiento',
      evaluaciones: { $sum: 1 },
      aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      tipo_establecimiento: '$_id',
      evaluaciones: 1,
      aprobadas: 1,
      porcentaje_aprobacion: {
        $round: [
          { $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] },
          2
        ]
      }
    }
  },
  { $sort: { porcentaje_aprobacion: -1, tipo_establecimiento: 1 } }
])
```

---

### P19 · Demanda de carreras objetivo por departamento de procedencia
- **Archivo:** `backend/src/modules/analytics/queries/p19-carreras-departamento.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p19?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Determinar cuántos aspirantes únicos de cada departamento se postulan a cada una de las carreras objetivo de la Facultad de Ingeniería.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$departamento_establecimiento',
        carrera_objetivo: '$carrera_objetivo',
        correlativo: '$correlativo'
      }
    }
  },
  {
    $group: {
      _id: {
        departamento_establecimiento: '$_id.departamento_establecimiento',
        carrera_objetivo: '$_id.carrera_objetivo'
      },
      aspirantes: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      departamento_establecimiento: '$_id.departamento_establecimiento',
      carrera_objetivo: '$_id.carrera_objetivo',
      aspirantes: 1
    }
  },
  { $sort: { aspirantes: -1, departamento_establecimiento: 1 } }
])
```

---

### P20 · Evolución histórica anual de evaluaciones y tasa de aprobación
- **Archivo:** `backend/src/modules/analytics/queries/p20-evolucion-anual.query.ts`
- **Endpoint:** `GET /api/analytics/queries/p20?anio=...&busqueda=...&ordenarPor=...&direccion=...&pagina=...&limite=...`
- **Propósito:** Analizar la serie histórica anual (`2015–2024`) contabilizando el total de evaluaciones aplicadas, aprobadas, no aprobadas y el porcentaje de aprobación por cohorte anual.
- **Consulta MongoDB:**
```javascript
db.evaluaciones.aggregate([
  { $match: { anio_evaluacion: $anio } },
  {
    $group: {
      _id: '$anio_evaluacion',
      evaluaciones: { $sum: 1 },
      aprobadas: { $sum: { $cond: ['$aprobado', 1, 0] } },
      no_aprobadas: { $sum: { $cond: ['$aprobado', 0, 1] } }
    }
  },
  {
    $project: {
      _id: 0,
      anio_evaluacion: '$_id',
      evaluaciones: 1,
      aprobadas: 1,
      no_aprobadas: 1,
      porcentaje_aprobacion: {
        $round: [
          { $multiply: [{ $divide: ['$aprobadas', '$evaluaciones'] }, 100] },
          2
        ]
      }
    }
  },
  { $sort: { anio_evaluacion: -1 } }
])
```

