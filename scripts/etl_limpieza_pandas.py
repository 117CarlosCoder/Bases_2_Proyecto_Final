from pathlib import Path
import pandas as pd


# ==============================================================================
# FASE 0: EXPLORACIÓN Y DETECCIÓN DE ANOMALÍAS (CÓMO SE DESCUBRIERON LOS ERRORES)
# ==============================================================================
def diagnosticar_archivos_csv(carpeta: Path) -> None:
    """
    Inspecciona los CSV originales (2015-2024) antes de limpiarlos para demostrar
    cómo se detectaron los errores de estructura y truncamiento en 2022, 2023 y 2024.
    """
    print("=" * 75)
    print("FASE 0: DIAGNÓSTICO EXPLORATORIO DE LOS ARCHIVOS CSV (2015 - 2024)")
    print("=" * 75)

    archivos = sorted(carpeta.glob("*.csv"))
    if not archivos:
        print(f"No se encontraron archivos CSV en: {carpeta}")
        return

    # 1. Comparar encabezados entre el formato histórico (2015-2021) y el nuevo (2022-2024)
    encabezados_por_anio: dict[str, list[str]] = {}
    for ruta in archivos:
        df_head = pd.read_csv(ruta, nrows=1, dtype=str, encoding="latin-1")
        encabezados_por_anio[ruta.name] = [c.strip().lower() for c in df_head.columns]

    cols_base = set(encabezados_por_anio[archivos[0].name])
    print("\n1) Detección de encabezados truncados respecto a 2015:")
    for nombre, cols in encabezados_por_anio.items():
        diferencias = set(cols) - cols_base
        if diferencias:
            print(f"   - {nombre}: columnas truncadas -> {sorted(diferencias)}")

    # 2. Comparar catálogos de 2021 vs 2022 y 2024 (truncamiento por límite de caracteres)
    ruta_2021 = carpeta / "pruebas_especificas_2021.csv"
    ruta_2022 = carpeta / "pruebas_especificas_2022.csv"
    ruta_2024 = carpeta / "pruebas_especificas_2024.csv"

    if ruta_2021.exists() and ruta_2022.exists() and ruta_2024.exists():
        df_21 = pd.read_csv(ruta_2021, dtype=str, encoding="latin-1")
        df_22 = pd.read_csv(ruta_2022, dtype=str, encoding="latin-1")
        df_24 = pd.read_csv(ruta_2024, dtype=str, encoding="latin-1")
        df_22_24 = pd.concat([df_22, df_24], ignore_index=True)

        # 2.a Carreras truncadas a 25 caracteres en 2022 y 2024
        carreras_21 = set(df_21["carrera_objetivo"].dropna().str.strip().unique())
        carreras_22_24 = set(df_22_24["carrera_objetivo"].dropna().str.strip().unique())
        carreras_truncadas = sorted(carreras_22_24 - carreras_21)
        print("\n2) Carreras truncadas detectadas en 2022 y 2024 (corte a 25 caracteres):")
        for c in carreras_truncadas:
            sugerencia = [c21 for c21 in carreras_21 if c21.startswith(c)]
            print(f"   -> '{c}' ==> corresponde a: {sugerencia}")

        # 2.b Municipios truncados (~16-19 caracteres) comparando pares (Departamento|Municipio)
        pares_21 = set(
            (
                df_21["departamento_institucion_educativa"].str.strip()
                + "|"
                + df_21["municipio_institucion_educativa"].str.strip()
            ).dropna()
        )
        pares_22_24 = set(
            (
                df_22_24["departamento_institucion_ed"].str.strip()
                + "|"
                + df_22_24["municipio_institucion_"].str.strip()
            ).dropna()
        )

        hallazgos_mpios: list[str] = []
        for par_corto in sorted(pares_22_24 - pares_21):
            coincidencias = sorted(
                p21.split("|")[1]
                for p21 in pares_21
                if p21.startswith(par_corto) and len(p21) > len(par_corto)
            )
            if coincidencias:
                hallazgos_mpios.append(f"'{par_corto}' -> '{coincidencias[0]}'")

        print("\n3) Municipios truncados detectados en 2022 y 2024 por prefijo:")
        for item in hallazgos_mpios[:12]:
            print(f"   -> {item}")

        # 2.c Valores de texto en columnas numéricas o nulas ("SIN REGISTRO", "NINGUNO")
        nulos_texto_nac = (
            df_22["anio_nacimiento"]
            .value_counts()
            .loc[lambda s: ~s.index.str.isnumeric()]
            .to_dict()
        )
        print("\n4) Textos usados como marcador vacío en 'anio_nacimiento' (archivo 2022):")
        print(f"   -> {nulos_texto_nac}")

        # 2.d Edades fuera de rango lógico [12..80] (ej. años de nacimiento erróneos en 2021/2022)
        df_muestra_edad = pd.concat([df_21, df_22], ignore_index=True)
        edades = pd.to_numeric(df_muestra_edad["anio_de_ingreso"], errors="coerce") - pd.to_numeric(
            df_muestra_edad["anio_nacimiento"], errors="coerce"
        )
        edades_invalidas = edades[~edades.between(12, 80) & edades.notna()]
        print("\n5) Edades calculadas fuera de rango lógico [12..80] (2021-2022):")
        print(
            f"   -> Total atípicas: {len(edades_invalidas)} | Valores detectados: {sorted(edades_invalidas.astype(int).unique().tolist())}"
        )


# ==============================================================================
# DICCIONARIOS DE REGLAS (CONSTRUIDOS A PARTIR DEL DIAGNÓSTICO ANTERIOR)
# ==============================================================================
VALORES_VACIOS = ["", "NINGUNO", "NINGUNA", "SIN REGISTRO", "SIN DATOS", "NO INDICA", "N/A", "NULL", "-"]

RENOMBRAR_COLUMNAS = {
    "CORRELATIVO_ASPIRANTE": "CORRELATIVO",
    "FECHA_ASIGNACIONA": "FECHA_ASIGNACION",
    "SEXOA": "SEXO",
    "DEPARTAMENTO_INSTITUCION_EDUCATIVA": "DEPARTAMENTO_ESTABLECIMIENTO",
    "DEPARTAMENTO_INSTITUCION_ED": "DEPARTAMENTO_ESTABLECIMIENTO",
    "MUNICIPIO_INSTITUCION_EDUCATIVA": "MUNICIPIO_ESTABLECIMIENTO",
    "MUNICIPIO_INSTITUCION_": "MUNICIPIO_ESTABLECIMIENTO",
    "TIPO_INSTITUCION_EDUCATIVA": "TIPO_ESTABLECIMIENTO",
    "NUMERO_DE_FECHA_DE_EVALUACION": "NUMERO_EVALUACION",
    "NUMERO_DE_FECHA_DE_EVALUACI": "NUMERO_EVALUACION",
    "ANIO_DE_INGRESO": "ANIO_EVALUACION",
    "MATERIA": "MATERIA_EVALUADA",
    "APROBACION": "RESULTADO_EVALUACION",
}

MAPA_SEXO = {"F": "F", "FEMENINO": "F", "MUJER": "F", "M": "M", "MASCULINO": "M", "HOMBRE": "M"}

MAPA_TIPO = {
    "PUBLICO": "PUBLICO", "OFICIAL": "PUBLICO", "ESTATAL": "PUBLICO", "NACIONAL": "PUBLICO",
    "PRIVADO": "PRIVADO", "PARTICULAR": "PRIVADO",
    "POR COOPERATIVA": "POR COOPERATIVA", "COOPERATIVA": "POR COOPERATIVA",
    "MUNICIPAL": "MUNICIPAL",
}

MAPA_RESULTADO = {
    "APROBADO": "APROBADO", "APROBADA": "APROBADO", "SATISFACTORIO": "APROBADO", "SI": "APROBADO", "1": "APROBADO",
    "NO APROBADO": "NO APROBADO", "NO APROBADA": "NO APROBADO", "REPROBADO": "NO APROBADO", "NO": "NO APROBADO", "0": "NO APROBADO",
}

MUNICIPIOS_TRUNCADOS = {
    "ALTA VERAPAZ|FRAY BARTOLOM": "FRAY BARTOLOME DE LAS CASAS",
    "ALTA VERAPAZ|SAN CRISTOBAL": "SAN CRISTOBAL VERAPAZ",
    "ALTA VERAPAZ|SANTA CRUZ": "SANTA CRUZ VERAPAZ",
    "CHIMALTENANGO|TECPAN GUATEMAL": "TECPAN GUATEMALA",
    "ESCUINTLA|NUEVA CONCEPCIO": "NUEVA CONCEPCION",
    "ESCUINTLA|SANTA LUCIA": "SANTA LUCIA COTZUMALGUAPA",
    "GUATEMALA|GUATEMALA - CIUDAD": "GUATEMALA - CIUDAD CAPITAL",
    "GUATEMALA|SAN JUAN SACATEPEQ": "SAN JUAN SACATEPEQUEZ",
    "GUATEMALA|SAN PEDRO SACATEPEQ": "SAN PEDRO SACATEPEQUEZ",
    "GUATEMALA|SANTA CATARINA": "SANTA CATARINA PINULA",
    "SACATEPEQUEZ|ANTIGUA GUATEMAL": "ANTIGUA GUATEMALA",
    "SACATEPEQUEZ|SAN LUCAS SACATEPEQ": "SAN LUCAS SACATEPEQUEZ",
    "SACATEPEQUEZ|SANTIAGO SACATEPEQ": "SANTIAGO SACATEPEQUEZ",
    "SAN MARCOS|SAN PEDRO SACATEPEQ": "SAN PEDRO SACATEPEQUEZ",
}


# ==============================================================================
# FASE 1: LIMPIEZA Y TRANSFORMACIÓN VECTORIZADA CON PANDAS
# ==============================================================================
def limpiar_texto_serie(s: pd.Series) -> pd.Series:
    return (
        s.fillna("")
        .astype(str)
        .str.normalize("NFKD")
        .str.encode("ascii", errors="ignore")
        .str.decode("utf-8")
        .str.upper()
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )


def limpiar_csv(ruta_csv: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    print(f"\nProcesando: {ruta_csv.name}")

    try:
        df = pd.read_csv(ruta_csv, dtype=str, encoding="utf-8-sig")
    except UnicodeDecodeError:
        df = pd.read_csv(ruta_csv, dtype=str, encoding="cp1252")

    df.columns = limpiar_texto_serie(pd.Series(df.columns)).replace(RENOMBRAR_COLUMNAS)
    df = df.apply(limpiar_texto_serie).replace(VALORES_VACIOS, pd.NA)

    df["carnet"] = df.get("CARNET", pd.Series(pd.NA, index=df.index)).replace("0", pd.NA)
    df["correlativo"] = df["CORRELATIVO"].fillna("CARNET:" + df["carnet"])

    fechas = pd.to_datetime(df["FECHA_ASIGNACION"], format="mixed", dayfirst=True, errors="coerce")
    df["fecha_asignacion"] = fechas.dt.strftime("%Y-%m-%d")
    df["anio_asignacion"] = fechas.dt.year
    df["mes_asignacion"] = fechas.dt.month

    df["numero_evaluacion"] = pd.to_numeric(df["NUMERO_EVALUACION"], errors="coerce")
    df["anio_evaluacion"] = pd.to_numeric(df["ANIO_EVALUACION"], errors="coerce")

    if "EDAD" in df.columns:
        edad_bruta = pd.to_numeric(df["EDAD"], errors="coerce")
    else:
        edad_bruta = df["anio_evaluacion"] - pd.to_numeric(df.get("ANIO_NACIMIENTO"), errors="coerce")

    df["edad"] = edad_bruta.where(edad_bruta.between(12, 80))

    df["sexo"] = df["SEXO"].map(MAPA_SEXO).fillna("NO_ESPECIFICADO")
    df["tipo_establecimiento"] = df["TIPO_ESTABLECIMIENTO"].map(MAPA_TIPO).fillna("SIN_TIPO_ESTABLECIMIENTO")
    df["resultado_evaluacion"] = df["RESULTADO_EVALUACION"].map(MAPA_RESULTADO)
    df["aprobado"] = df["resultado_evaluacion"] == "APROBADO"
    df["materia_evaluada"] = df["MATERIA_EVALUADA"]

    df["carrera_objetivo"] = (
        df["CARRERA_OBJETIVO"]
        .replace({"INGENIERIA EN CIENCIAS Y": "INGENIERIA EN CIENCIAS Y SISTEMAS", "SIN CARRERA": pd.NA})
        .fillna("SIN_CARRERA_OBJETIVO")
    )
    df["departamento_establecimiento"] = df["DEPARTAMENTO_ESTABLECIMIENTO"].fillna("SIN_DEPARTAMENTO")
    df["municipio_establecimiento"] = df["MUNICIPIO_ESTABLECIMIENTO"].fillna("SIN_MUNICIPIO")

    clave_mpio = df["departamento_establecimiento"] + "|" + df["municipio_establecimiento"]
    df["municipio_establecimiento"] = clave_mpio.map(MUNICIPIOS_TRUNCADOS).fillna(df["municipio_establecimiento"])
    df["municipio_uid"] = df["departamento_establecimiento"] + "|" + df["municipio_establecimiento"]

    columnas_obligatorias = [
        "correlativo", "fecha_asignacion", "numero_evaluacion",
        "anio_evaluacion", "materia_evaluada", "resultado_evaluacion",
    ]
    es_valida = df[columnas_obligatorias].notna().all(axis=1)

    df_rechazados = df[~es_valida].copy()
    df_validos = df[es_valida].copy()

    df_validos["evaluacion_uid"] = (
        df_validos["correlativo"] + "|" +
        df_validos["materia_evaluada"] + "|" +
        df_validos["anio_evaluacion"].astype(int).astype(str) + "|" +
        df_validos["numero_evaluacion"].astype(int).astype(str)
    )
    df_validos = df_validos.drop_duplicates(subset=["evaluacion_uid"], keep="first")

    print(f"  -> Válidos: {len(df_validos):,} | Rechazados: {len(df_rechazados):,}")
    return df_validos, df_rechazados


if __name__ == "__main__":
    carpeta_entrada = Path("archivosprueba/descargas_pruebas_especificas")
    if not carpeta_entrada.exists():
        carpeta_entrada = Path("data/descargas_pruebas_especificas")

    carpeta_salida = Path("tmp/etl_pandas")
    carpeta_salida.mkdir(parents=True, exist_ok=True)

    # 1. Ejecutar el diagnóstico exploratorio para evidenciar cómo se descubrieron los errores
    diagnosticar_archivos_csv(carpeta_entrada)

    # 2. Aplicar las reglas de limpieza y exportar los CSV listos para la base de datos
    print("\n" + "=" * 75)
    print("FASE 1: EJECUCIÓN DEL ETL Y EXPORTACIÓN DE DATOS LIMPIOS")
    print("=" * 75)

    columnas_finales = [
        "evaluacion_uid", "correlativo", "carnet", "fecha_asignacion",
        "anio_asignacion", "mes_asignacion", "sexo", "edad",
        "carrera_objetivo", "departamento_establecimiento",
        "municipio_establecimiento", "municipio_uid", "tipo_establecimiento",
        "materia_evaluada", "numero_evaluacion", "anio_evaluacion",
        "resultado_evaluacion", "aprobado",
    ]

    for archivo in sorted(carpeta_entrada.glob("*.csv")):
        validos, rechazados = limpiar_csv(archivo)

        validos[columnas_finales].to_csv(carpeta_salida / f"{archivo.stem}_limpio.csv", index=False)
        if not rechazados.empty:
            rechazados.to_csv(carpeta_salida / f"{archivo.stem}_rechazados.csv", index=False)
