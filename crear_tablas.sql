
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
