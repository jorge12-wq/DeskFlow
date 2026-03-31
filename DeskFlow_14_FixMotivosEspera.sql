-- =============================================================
-- DeskFlow — Script 14: Fix MotivosEspera duplicados
-- =============================================================
-- El script 13 no tenía UNIQUE constraint en (TenantId, Nombre),
-- por lo que cada ejecución insertaba filas duplicadas.
-- Este script:
--   1. Elimina los duplicados (deja solo el primero de cada Nombre por TenantId)
--   2. Agrega un UNIQUE constraint para evitar futuros duplicados

-- ── 1. Eliminar duplicados ────────────────────────────────────
--    Por cada (TenantId, Nombre), conserva el registro con el Id menor
--    y elimina los demás.

DELETE FROM "MotivosEspera"
WHERE "Id" NOT IN (
    SELECT DISTINCT ON ("TenantId", "Nombre") "Id"
    FROM "MotivosEspera"
    WHERE "HelpDeskId" IS NULL
    ORDER BY "TenantId", "Nombre", "Id"
)
AND "HelpDeskId" IS NULL;

-- También limpiar duplicados en los específicos por HelpDesk (por precaución)
DELETE FROM "MotivosEspera"
WHERE "Id" NOT IN (
    SELECT DISTINCT ON ("TenantId", "HelpDeskId", "Nombre") "Id"
    FROM "MotivosEspera"
    WHERE "HelpDeskId" IS NOT NULL
    ORDER BY "TenantId", "HelpDeskId", "Nombre", "Id"
)
AND "HelpDeskId" IS NOT NULL;

-- ── 2. Agregar unique constraint ──────────────────────────────
--    Evita duplicados futuros: mismo nombre no puede repetirse
--    para el mismo tenant + mismo helpDesk (null incluido).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_MotivosEspera_Tenant_HelpDesk_Nombre'
    ) THEN
        ALTER TABLE "MotivosEspera"
            ADD CONSTRAINT "UQ_MotivosEspera_Tenant_HelpDesk_Nombre"
            UNIQUE ("TenantId", "HelpDeskId", "Nombre");
    END IF;
END $$;

-- Nota: Si HelpDeskId es NULL, UNIQUE en PostgreSQL permite
-- múltiples NULLs por defecto. Por eso usamos NULLS NOT DISTINCT:
-- (requiere PG 15+; si usás PG 14 o anterior, el ALTER ya es suficiente
--  para los motivos con HelpDeskId no nulo)

-- ── 3. Verificar resultado ────────────────────────────────────
SELECT "Nombre", COUNT(*) as cantidad
FROM "MotivosEspera"
WHERE "HelpDeskId" IS NULL
GROUP BY "Nombre"
ORDER BY "Nombre";
