# Consultas Cypher de Neo4j 

## Modelo de Grafo Utilizado

### Etiquetas de Nodo
- `(:Aspirante {correlativo, sexo, edad, anio_nacimiento, grado_academico})`
- `(:Evaluacion {evaluacion_uid, anio_evaluacion, numero_evaluacion, fecha_asignacion, aprobado, resultado_evaluacion})`
- `(:Materia {nombre})`
- `(:Carrera {nombre})`
- `(:Establecimiento {codigo, nombre})`
- `(:TipoInstitucion {nombre})`
- `(:Municipio {municipio_uid, nombre, departamento})`
- `(:Departamento {nombre})`

### Tipos de Relación
- `(:Aspirante)-[:REALIZO]->(:Evaluacion)`
- `(:Evaluacion)-[:EVALUO]->(:Materia)`
- `(:Evaluacion)-[:ASPIRA_A]->(:Carrera)`
- `(:Aspirante)-[:PROVIENE_DE]->(:Establecimiento)`
- `(:Establecimiento)-[:ES_DE_TIPO]->(:TipoInstitucion)`
- `(:Establecimiento)-[:UBICADO_EN]->(:Municipio)`
- `(:Municipio)-[:PERTENECE_A]->(:Departamento)`


## 5 Consultas Cypher

### G1 · Red de procedencia geográfica hacia carreras objetivo
- **Archivo:** `backend/src/modules/graphs/queries/g1-procedencia-carreras.query.ts`
- **Endpoint:** `GET /api/graphs/queries/g1?departamento=...&anio=...&limite=...`
- **Propósito:** Identificar cómo se distribuyen los aspirantes desde los departamentos y municipios de sus establecimientos educativos hacia las carreras objetivo de la Facultad de Ingeniería.
- **Consulta Cypher:**
```cypher
MATCH (d:Departamento)<-[:PERTENECE_A]-(mun:Municipio)<-[:UBICADO_EN]-(est:Establecimiento)<-[:PROVIENE_DE]-(a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:ASPIRA_A]->(c:Carrera)
WHERE ($departamento IS NULL OR d.nombre = $departamento)
  AND ($anio IS NULL OR e.anio_evaluacion = $anio)
WITH d, mun, c,
     count(DISTINCT a) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas
ORDER BY aspirantes DESC, evaluaciones DESC
LIMIT $limite
RETURN d.nombre AS departamento,
       mun.nombre AS municipio,
       mun.municipio_uid AS municipio_uid,
       c.nombre AS carrera,
       aspirantes,
       evaluaciones,
       aprobadas,
       round(toFloat(aprobadas) * 100.0 / CASE WHEN evaluaciones = 0 THEN 1 ELSE evaluaciones END, 2) AS tasa_aprobacion
```

---

### G2 · Trayectoria de superación de materias (Reprobado → Aprobado)
- **Archivo:** `backend/src/modules/graphs/queries/g2-superacion-materias.query.ts`
- **Endpoint:** `GET /api/graphs/queries/g2?materia=...&anio=...&limite=...`
- **Propósito:** Encontrar patrones secuenciales de superación donde un mismo aspirante reprueba una evaluación  y en un intento posterior del mismo ciclo o carrera logra aprobar la misma materia.
- **Consulta Cypher:**
```cypher
MATCH (a:Aspirante)-[:REALIZO]->(e1:Evaluacion {aprobado: false})-[:EVALUO]->(m:Materia)<-[:EVALUO]-(e2:Evaluacion {aprobado: true})<-[:REALIZO]-(a)
WHERE e2.numero_evaluacion > e1.numero_evaluacion
  AND ($materia IS NULL OR m.nombre = $materia)
  AND ($anio IS NULL OR e2.anio_evaluacion = $anio OR e1.anio_evaluacion = $anio)
OPTIONAL MATCH (e2)-[:ASPIRA_A]->(c:Carrera)
WITH a, m, c,
     min(e1.numero_evaluacion) AS intento_fallido,
     max(e2.numero_evaluacion) AS intento_aprobado,
     max(e2.anio_evaluacion) AS anio_superacion
ORDER BY (intento_aprobado - intento_fallido) DESC, a.correlativo ASC
LIMIT $limite
RETURN a.correlativo AS correlativo,
       m.nombre AS materia,
       coalesce(c.nombre, 'SIN ESPECIFICAR') AS carrera,
       intento_fallido,
       intento_aprobado,
       anio_superacion
```

---

### G3 · Rendimiento por tipo de institución, departamento y materia
- **Archivo:** `backend/src/modules/graphs/queries/g3-rendimiento-institucion.query.ts`
- **Endpoint:** `GET /api/graphs/queries/g3?tipo=...&departamento=...&anio=...&limite=...`
- **Propósito:** Cruzar la parte geográfica , el sector educativo  y el desempeño en cada materia evaluada recorriendo el grafo completo.
- **Consulta Cypher:**
```cypher
MATCH (d:Departamento)<-[:PERTENECE_A]-(:Municipio)<-[:UBICADO_EN]-(est:Establecimiento)-[:ES_DE_TIPO]->(t:TipoInstitucion),
      (est)<-[:PROVIENE_DE]-(a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUO]->(m:Materia)
WHERE ($tipo IS NULL OR t.nombre = $tipo)
  AND ($departamento IS NULL OR d.nombre = $departamento)
  AND ($anio IS NULL OR e.anio_evaluacion = $anio)
WITH d, t, m,
     count(DISTINCT a) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas
ORDER BY evaluaciones DESC
LIMIT $limite
RETURN d.nombre AS departamento,
       t.nombre AS tipo_institucion,
       m.nombre AS materia,
       aspirantes,
       evaluaciones,
       aprobadas,
       round(toFloat(aprobadas) * 100.0 / CASE WHEN evaluaciones = 0 THEN 1 ELSE evaluaciones END, 2) AS tasa_aprobacion
```

---

### G4 · Cuellos de botella y reprobación hacia carreras objetivo
- **Archivo:** `backend/src/modules/graphs/queries/g4-reprobacion-carreras.query.ts`
- **Endpoint:** `GET /api/graphs/queries/g4?carrera=...&materia=...&anio=...&limite=...`
- **Propósito:** Detectar qué materias concentran la mayor cantidad de intentos reprobados para cada carrera objetivo, identificando los principales filtros académicos de admisión.
- **Consulta Cypher:**
```cypher
MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion)-[:EVALUO]->(m:Materia),
      (e)-[:ASPIRA_A]->(c:Carrera)
WHERE ($carrera IS NULL OR c.nombre = $carrera)
  AND ($materia IS NULL OR m.nombre = $materia)
  AND ($anio IS NULL OR e.anio_evaluacion = $anio)
WITH c, m,
     count(DISTINCT a) AS aspirantes,
     count(e) AS evaluaciones,
     sum(CASE WHEN e.aprobado = false THEN 1 ELSE 0 END) AS reprobadas
WHERE reprobadas > 0
ORDER BY reprobadas DESC, evaluaciones DESC
LIMIT $limite
RETURN c.nombre AS carrera,
       m.nombre AS materia,
       aspirantes,
       evaluaciones,
       reprobadas,
       round(toFloat(reprobadas) * 100.0 / CASE WHEN evaluaciones = 0 THEN 1 ELSE evaluaciones END, 2) AS tasa_reprobacion
```

---

### G5 · Ego-grafo y red de afinidad de un aspirante
- **Archivo:** `backend/src/modules/graphs/queries/g5-red-aspirante.query.ts`
- **Endpoint:** `GET /api/graphs/queries/g5?correlativo=...&anio=...&limite=...`
- **Propósito:** Construir el vecindario completo de un aspirante específico, mostrando su establecimiento educativo, municipio, departamento, evaluaciones presentadas, materias, carrera objetivo y compañeros que comparten establecimiento y carrera.
- **Consulta Cypher:**
```cypher
MATCH (a:Aspirante {correlativo: $correlativo})
OPTIONAL MATCH (a)-[:PROVIENE_DE]->(est:Establecimiento)-[:ES_DE_TIPO]->(tip:TipoInstitucion)
OPTIONAL MATCH (est)-[:UBICADO_EN]->(mun:Municipio)-[:PERTENECE_A]->(dep:Departamento)
OPTIONAL MATCH (a)-[:REALIZO]->(ev:Evaluacion)-[:EVALUO]->(mat:Materia)
WHERE $anio IS NULL OR ev.anio_evaluacion = $anio
OPTIONAL MATCH (ev)-[:ASPIRA_A]->(car:Carrera)
RETURN a.correlativo AS correlativo,
       a.sexo AS sexo,
       a.edad AS edad,
       est.codigo AS est_codigo,
       est.nombre AS establecimiento,
       tip.nombre AS tipo_institucion,
       mun.municipio_uid AS municipio_uid,
       mun.nombre AS municipio,
       dep.nombre AS departamento,
       ev.evaluacion_uid AS evaluacion_uid,
       ev.anio_evaluacion AS anio_evaluacion,
       ev.numero_evaluacion AS numero_evaluacion,
       ev.aprobado AS aprobado,
       ev.resultado_evaluacion AS resultado,
       mat.nombre AS materia,
       car.nombre AS carrera
ORDER BY ev.anio_evaluacion DESC, ev.numero_evaluacion ASC
LIMIT $limite

