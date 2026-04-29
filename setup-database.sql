-- 1. Crear tablas (jerarquía CIE-10)
CREATE TABLE IF NOT EXISTS grupos_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(6) NOT NULL UNIQUE,
    descripcion VARCHAR(256) NOT NULL
);

CREATE TABLE IF NOT EXISTS subgrupos_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(8) NOT NULL UNIQUE,
    descripcion VARCHAR(512) NOT NULL,
    id_grupo INTEGER NOT NULL REFERENCES grupos_cie10(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categorias_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(512) NOT NULL,
    id_subgrupo INTEGER NOT NULL REFERENCES subgrupos_cie10(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagnosticos_cie10 (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(512) NOT NULL,
    id_categoria INTEGER NOT NULL REFERENCES categorias_cie10(id) ON DELETE CASCADE
);

-- 2. HABILITAR RLS Y PERMITIR LECTURA ANÓNIMA (CRÍTICO)
ALTER TABLE diagnosticos_cie10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_cie10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgrupos_cie10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_cie10 ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen
DROP POLICY IF EXISTS "Allow anonymous read" ON diagnosticos_cie10;
DROP POLICY IF EXISTS "Allow anonymous read" ON categorias_cie10;
DROP POLICY IF EXISTS "Allow anonymous read" ON subgrupos_cie10;
DROP POLICY IF EXISTS "Allow anonymous read" ON grupos_cie10;

-- Crear políticas de lectura pública
CREATE POLICY "Allow anonymous read" ON diagnosticos_cie10 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON categorias_cie10 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON subgrupos_cie10 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON grupos_cie10 FOR SELECT USING (true);

-- 3. Insertar datos de prueba (CIE-10 reales)
INSERT INTO grupos_cie10 (clave, descripcion) VALUES
('G00-G99', 'Enfermedades del sistema nervioso'),
('R00-R99', 'Síntomas, signos y hallazgos anormales clínicos y de laboratorio'),
('J00-J99', 'Enfermedades del aparato respiratorio')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO subgrupos_cie10 (clave, descripcion, id_grupo) VALUES
('G43-G44', 'Cefalea y síndromes algésicos Craneofaciales', (SELECT id FROM grupos_cie10 WHERE clave = 'G00-G99')),
('R50-R69', 'Síntomas y signos generales', (SELECT id FROM grupos_cie10 WHERE clave = 'R00-R99')),
('J00-J06', 'Infecciones agudas de las vías respiratorias superiores', (SELECT id FROM grupos_cie10 WHERE clave = 'J00-J99'))
ON CONFLICT (clave) DO NOTHING;

INSERT INTO categorias_cie10 (clave, descripcion, id_subgrupo) VALUES
('G43', 'Migraña', (SELECT id FROM subgrupos_cie10 WHERE clave = 'G43-G44')),
('G44', 'Otras cefaleas', (SELECT id FROM subgrupos_cie10 WHERE clave = 'G43-G44')),
('R50', 'Fiebre', (SELECT id FROM subgrupos_cie10 WHERE clave = 'R50-R69')),
('J00', 'Nasofaringitis aguda', (SELECT id FROM subgrupos_cie10 WHERE clave = 'J00-J06'))
ON CONFLICT (clave) DO NOTHING;

INSERT INTO diagnosticos_cie10 (clave, descripcion, id_categoria) VALUES
('G43.9', 'Migraña, no especificada dolor de cabeza intenso', (SELECT id FROM categorias_cie10 WHERE clave = 'G43')),
('G44.1', 'Cefalea vascular dolor de cabeza', (SELECT id FROM categorias_cie10 WHERE clave = 'G44')),
('G44.2', 'Cefalea tensional dolor de cabeza estrés', (SELECT id FROM categorias_cie10 WHERE clave = 'G44')),
('R51', 'Cefalea dolor de cabeza', (SELECT id FROM categorias_cie10 WHERE clave = 'G44')),
('R50.9', 'Fiebre, no especificada temperatura alta', (SELECT id FROM categorias_cie10 WHERE clave = 'R50')),
('R05', 'Tos tos seca tos con flema', (SELECT id FROM subgrupos_cie10 WHERE clave = 'R50-R69')),
('J06.9', 'Infección aguda vías respiratorias resfriado', (SELECT id FROM subgrupos_cie10 WHERE clave = 'J00-J06')),
('J00', 'Nasofaringitis aguda resfriado común', (SELECT id FROM categorias_cie10 WHERE clave = 'J00')),
('J02.9', 'Faringitis aguda dolor garganta', (SELECT id FROM subgrupos_cie10 WHERE clave = 'J00-J06'))
ON CONFLICT (clave) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 4. Verificar datos
SELECT 'diagnosticos' as tabla, COUNT(*) as total FROM diagnosticos_cie10;
SELECT clave, descripcion FROM diagnosticos_cie10 LIMIT 10;
