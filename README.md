# Sistema Analítico y de Grafos — Pruebas Específicas USAC (Bases de Datos 2)

Plataforma fullstack para la ingesta ETL de archivos CSV, almacenamiento documental en **MongoDB**, modelado y consulta de relaciones en **Neo4j**, analítica agregada (`P1` a `P20`), exploración interactiva de grafos (`G1` a `G5`), buscador de aspirantes y comparacion sobre los resultados de Pruebas Específicas de la Facultad de Ingeniería de la Universidad de San Carlos de Guatemala (USAC).

--- 

## Prerrequisitos

- **Node.js** `>= 20.x` y **npm** `>= 10.x`
- **Docker** y **Docker Compose** (v2)

---

## Configuración de Variables de Entorno

Copia el archivo `.env.example` hacia `.env` en la raíz del proyecto y en `backend/.env`:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example backend/.env
```

Variables configurables:

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3000` | Puerto HTTP donde escucha el backend NestJS |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido por CORS para el frontend |
| `MONGODB_URI` | `mongodb://localhost:27017` | URI de conexión a MongoDB |
| `MONGODB_DB_NAME` | `usac_pruebas_especificas` | Nombre de la base de datos en MongoDB |
| `NEO4J_URI` | `bolt://localhost:7687` | URI Bolt de conexión a Neo4j |
| `NEO4J_USER` | `neo4j` | Usuario de autenticación en Neo4j |
| `NEO4J_PASSWORD` | `<contraseña definida en .env>` | Contraseña de autenticación en Neo4j |
| `MAX_CSV_FILE_SIZE_MB` | `50` | Tamaño máximo permitido para carga de CSV (en MB) |

---

## 1. Arranque de Bases de Datos (Docker Compose)

Para levantar **MongoDB** (`pfb2-mongodb` en `27017`) y **Neo4j** (`pfb2-neo4j` en `7474` HTTP y `7687` Bolt):

```powershell
docker compose --env-file backend/.env up -d
```

Verificar el estado y healthchecks de los contenedores:

```powershell
docker compose --env-file backend/.env ps
```

---

## 2. Arranque del Backend (`backend/`)

```powershell
cd backend
npm install
npm run start:dev
```

El servidor iniciará en `http://localhost:3000/api`.

---

## 3. Arranque del Frontend (`frontend/`)

En una nueva terminal:

```powershell
cd frontend
npm install
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`.

