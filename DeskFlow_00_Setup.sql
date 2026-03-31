-- ============================================================
--  DeskFlow – PASO 1: Roles de base de datos
--  Ejecutar conectado a "postgres" como superuser
-- ============================================================
--
--  ANTES DE EJECUTAR ESTE SCRIPT — Crear la base de datos:
--
--    1. En pgAdmin, click derecho sobre "Databases"
--    2. Create > Database...
--    3. En el campo "Database" escribir:  DeskFlowDb
--    4. En "Encoding" elegir:             UTF8
--    5. Click "Save"
--
--  LUEGO ejecutar este script (Query Tool sobre "postgres"):
--    Crea los 3 roles de conexión y les da permiso sobre DeskFlowDb.
--
-- ============================================================

-- Rol de la aplicación (lectura + escritura DML, sin DDL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'deskflow_app') THEN
    CREATE ROLE deskflow_app LOGIN PASSWORD 'DeskFlow2024!'
        NOSUPERUSER NOCREATEDB NOCREATEROLE;
    RAISE NOTICE 'Rol deskflow_app creado.';
  ELSE
    RAISE NOTICE 'Rol deskflow_app ya existe, omitido.';
  END IF;
END $$;

-- Rol de solo lectura (reportes, BI)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'deskflow_readonly') THEN
    CREATE ROLE deskflow_readonly LOGIN PASSWORD 'ReadOnly2024!'
        NOSUPERUSER NOCREATEDB NOCREATEROLE;
    RAISE NOTICE 'Rol deskflow_readonly creado.';
  ELSE
    RAISE NOTICE 'Rol deskflow_readonly ya existe, omitido.';
  END IF;
END $$;

-- Rol administrador DB (migraciones, backup)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'deskflow_admin') THEN
    CREATE ROLE deskflow_admin LOGIN PASSWORD 'Admin2024!DeskFlow'
        NOSUPERUSER CREATEDB NOCREATEROLE;
    RAISE NOTICE 'Rol deskflow_admin creado.';
  ELSE
    RAISE NOTICE 'Rol deskflow_admin ya existe, omitido.';
  END IF;
END $$;

-- Dar permiso de conexión a la base de datos
GRANT CONNECT ON DATABASE "DeskFlowDb" TO deskflow_app, deskflow_readonly, deskflow_admin;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  PASO 1 completado.';
    RAISE NOTICE '  Ahora: click derecho en DeskFlowDb';
    RAISE NOTICE '  > Query Tool > ejecutar';
    RAISE NOTICE '  DeskFlow_Database.sql';
    RAISE NOTICE '========================================';
END $$;
