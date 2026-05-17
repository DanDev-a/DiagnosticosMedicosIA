"""
IMPORTAR CIE-10 ES 2026 A SUPABASE
====================================
Paso 1: Ejecuta este script para generar los CSV
Paso 2: Importa los CSV en Supabase Dashboard

Windows: python importar_datos.py
"""

import os
import csv
import sys

sys.stdout.reconfigure(encoding='utf-8')

BATCH_SIZE = 500


def excel_a_csv(archivo_excel, sheet_name, archivo_csv, columnas, mapeo):
    """
    Convierte una hoja de Excel a CSV.
    - columnas: índices de columnas a extraer (0, 1, 2, ...)
    - mapeo: nombres de columna en el CSV
    """
    try:
        import openpyxl
    except ImportError:
        print("Instalando openpyxl...")
        os.system(f"{sys.executable} -m pip install openpyxl")
        import openpyxl

    print(f"  Leyendo {archivo_excel} → {archivo_csv}...")
    wb = openpyxl.load_workbook(archivo_excel, read_only=True, data_only=True)
    ws = wb[sheet_name]

    total = 0
    with open(archivo_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(mapeo)

        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                continue  # saltar encabezado
            vals = []
            skip = False
            for idx in columnas:
                v = row[idx] if idx < len(row) else ""
                if v is None:
                    v = ""
                v = str(v).strip()
                vals.append(v)
            if not vals[0] or not vals[1]:
                continue
            writer.writerow(vals)
            total += 1

    wb.close()
    print(f"  ✅ {total} registros escritos")
    return total


def generar_sql_tablas():
    """Genera el script SQL para crear las tablas en Supabase"""
    return """
-- =============================================
-- TABLAS CIE-10 ES 2026 PARA SUPABASE
-- Pega esto en: Supabase > SQL Editor > New Query
-- =============================================

-- 1. DIAGNÓSTICOS
CREATE TABLE IF NOT EXISTS diagnosticos_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) NOT NULL,
    descripcion VARCHAR(512) NOT NULL,
    nodo_final BOOLEAN DEFAULT false,
    manifestacion BOOLEAN DEFAULT false,
    perinatal BOOLEAN DEFAULT false,
    pediatrico BOOLEAN DEFAULT false,
    obstetrico BOOLEAN DEFAULT false,
    adulto BOOLEAN DEFAULT false,
    mujer BOOLEAN DEFAULT false,
    hombre BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_diag_clave ON diagnosticos_cie10(clave);
CREATE INDEX IF NOT EXISTS idx_diag_desc ON diagnosticos_cie10(descripcion);

-- 2. PROCEDIMIENTOS
CREATE TABLE IF NOT EXISTS procedimientos_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) NOT NULL,
    descripcion VARCHAR(512) NOT NULL,
    hombre BOOLEAN DEFAULT false,
    mujer BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_proc_clave ON procedimientos_cie10(clave);
CREATE INDEX IF NOT EXISTS idx_proc_desc ON procedimientos_cie10(descripcion);

-- 3. Permisos de lectura anónima
ALTER TABLE diagnosticos_cie10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedimientos_cie10 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_diag" ON diagnosticos_cie10;
DROP POLICY IF EXISTS "anon_read_proc" ON procedimientos_cie10;

CREATE POLICY "anon_read_diag" ON diagnosticos_cie10 FOR SELECT USING (true);
CREATE POLICY "anon_read_proc" ON procedimientos_cie10 FOR SELECT USING (true);
"""


def main():
    print("=" * 65)
    print("  IMPORTAR CIE-10 ES 2026 A SUPABASE")
    print("=" * 65)

    # 1. Guardar SQL
    print("\n📝 PASO 1 — Generando SQL de tablas...")
    with open("crear_tablas.sql", "w", encoding="utf-8") as f:
        f.write(generar_sql_tablas())
    print("   → crear_tablas.sql generado")
    print("   → Pega esto en Supabase > SQL Editor y ejecútalo")

    # 2. Convertir Excel a CSV
    print("\n📂 PASO 2 — Convirtiendo Excel a CSV...")

    total_diag = excel_a_csv(
        "Diagnosticos_Tabla_Referencia_CIE10ES_2026.xlsx",
        "ES2026 Completa + Marcadores",
        "diagnosticos_cie10.csv",
        columnas=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        mapeo=["clave", "descripcion", "nodo_final", "manifestacion",
               "perinatal", "pediatrico", "obstetrico", "adulto",
               "mujer", "hombre"]
    )

    total_proc = excel_a_csv(
        "Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx",
        "ES2026 Completa + Marcadores",
        "procedimientos_cie10.csv",
        columnas=[0, 1, 2, 3],
        mapeo=["clave", "descripcion", "hombre", "mujer"]
    )

    # 3. Resumen
    print("\n" + "=" * 65)
    print("  ✅ LISTO — Sigue estos pasos:")
    print("=" * 65)
    print("""
  1. Ve a https://supabase.com/dashboard/project/ufnrszwvqcjsvjljudkv

  2. SQL Editor → New Query → pega crear_tablas.sql → Run

  3. Table Editor → diagnosticos_cie10 → Import CSV
     → Selecciona diagnosticos_cie10.csv
     → Asegura columnas: clave, descripcion, etc.
     → Import

  4. Table Editor → procedimientos_cie10 → Import CSV
     → Selecciona procedimientos_cie10.csv
     → Asegura columnas: clave, descripcion, hombre, mujer
     → Import

  ⚠️  Son {total_diag:,} diagnósticos y {total_proc:,} procedimientos.
     La importación puede tomar varios minutos.
""")

    # Preguntar si quiere importar via API también
    resp = input("¿Quieres importar via API de Supabase? (s/N): ")
    if resp.lower() == "s":
        importar_via_api()


def importar_via_api():
    """Importa los CSV directamente a Supabase via API"""
    try:
        from supabase import create_client
    except ImportError:
        print("Instalando supabase...")
        os.system(f"{sys.executable} -m pip install supabase")
        from supabase import create_client

    supabase_url = os.environ.get("VITE_SUPABASE_URL") or input("SUPABASE_URL: ")
    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY") or input("SUPABASE_ANON_KEY: ")

    if not supabase_url or not supabase_key:
        print("❌ Faltan credenciales")
        return

    supabase = create_client(supabase_url, supabase_key)

    for tabla, archivo in [("diagnosticos_cie10", "diagnosticos_cie10.csv"),
                           ("procedimientos_cie10", "procedimientos_cie10.csv")]:
        print(f"\n📤 Subiendo {tabla}...")
        batch = []
        total = 0
        with open(archivo, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convertir strings "S" a booleanos
                for k in row:
                    if row[k] == "S":
                        row[k] = True
                    elif row[k] == "" or row[k] == "N":
                        row[k] = False
                batch.append(row)
                total += 1

                if len(batch) >= BATCH_SIZE:
                    try:
                        supabase.table(tabla).insert(batch).execute()
                        print(f"  ✅ {total} registros...")
                    except Exception as e:
                        print(f"  ❌ Error: {e}")
                    batch = []

            if batch:
                try:
                    supabase.table(tabla).insert(batch).execute()
                    print(f"  ✅ {total} total")
                except Exception as e:
                    print(f"  ❌ Error final: {e}")

        print(f"✅ {tabla} completada ({total} registros)")


if __name__ == "__main__":
    main()
