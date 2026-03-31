-- =============================================================
-- DeskFlow — Script 12: Expansión de Áreas + vinculación con HelpDesks
-- =============================================================
-- Qué hace este script:
--   1. Agrega columna HelpDeskId a la tabla Areas
--   2. Elimina las 2 áreas antiguas (IDs aleatorios del SampleData)
--   3. Crea 8 áreas reales con IDs fijos
--   4. Vincula áreas con sus portales de help desk correspondientes
--   5. Asigna el área correcta a los usuarios demo
--   6. Auto-asigna agentes demo a sus help desks (HelpDeskAgentes)
-- =============================================================

-- ── 1. Agregar HelpDeskId a Areas (si no existe) ──────────────
ALTER TABLE "Areas"
    ADD COLUMN IF NOT EXISTS "HelpDeskId" UUID REFERENCES "HelpDesks"("Id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "IX_Areas_HelpDeskId" ON "Areas"("HelpDeskId");

-- ── 2. Lógica principal ───────────────────────────────────────
DO $$
DECLARE
    v_tenant UUID := '10000000-0000-0000-0000-000000000001';

    -- HelpDesk IDs (creados en script 09)
    v_hd_it    UUID := 'a1000000-0000-0000-0000-000000000001';
    v_hd_rrhh  UUID := 'a1000000-0000-0000-0000-000000000002';
    v_hd_comp  UUID := 'a1000000-0000-0000-0000-000000000003';
    v_hd_fac   UUID := 'a1000000-0000-0000-0000-000000000004';

    -- Área IDs fijos (B1...)
    v_area_it    UUID := 'b1000000-0000-0000-0000-000000000001';
    v_area_rrhh  UUID := 'b1000000-0000-0000-0000-000000000002';
    v_area_comp  UUID := 'b1000000-0000-0000-0000-000000000003';
    v_area_fac   UUID := 'b1000000-0000-0000-0000-000000000004';
    v_area_fin   UUID := 'b1000000-0000-0000-0000-000000000005';
    v_area_mkt   UUID := 'b1000000-0000-0000-0000-000000000006';
    v_area_adm   UUID := 'b1000000-0000-0000-0000-000000000007';
    v_area_ger   UUID := 'b1000000-0000-0000-0000-000000000008';

    -- Usuarios demo
    v_admin   UUID := '50000000-0000-0000-0000-000000000001';
    v_sup     UUID := '50000000-0000-0000-0000-000000000002';
    v_age1    UUID := '50000000-0000-0000-0000-000000000003';
    v_age2    UUID := '50000000-0000-0000-0000-000000000004';
    v_usr     UUID := '50000000-0000-0000-0000-000000000005';
    v_aprob   UUID := '50000000-0000-0000-0000-000000000006';
    v_obs     UUID := '50000000-0000-0000-0000-000000000007';
BEGIN

    -- ── Limpiar FK references antes de borrar áreas ──────────
    UPDATE "Usuarios" SET "AreaId" = NULL WHERE "TenantId" = v_tenant;
    UPDATE "Tickets"  SET "AreaId" = NULL WHERE "TenantId" = v_tenant;

    -- ── Eliminar áreas antiguas del tenant (IDs aleatorios) ──
    DELETE FROM "Areas" WHERE "TenantId" = v_tenant;

    -- ── Insertar 8 áreas reales con IDs fijos ────────────────
    -- Áreas vinculadas a help desks (agentes de estas áreas solo ven sus tickets)
    INSERT INTO "Areas" ("Id", "TenantId", "Nombre", "Descripcion", "HelpDeskId", "Activo") VALUES
        (v_area_it,   v_tenant, 'Tecnología / IT',   'Soporte técnico, hardware, software e infraestructura', v_hd_it,   TRUE),
        (v_area_rrhh, v_tenant, 'Recursos Humanos',  'RRHH, liquidaciones, incorporaciones y bajas',          v_hd_rrhh, TRUE),
        (v_area_comp, v_tenant, 'Compras',           'Compras, proveedores y aprobaciones de adquisición',    v_hd_comp, TRUE),
        (v_area_fac,  v_tenant, 'Instalaciones',     'Mantenimiento, espacios de trabajo y limpieza',         v_hd_fac,  TRUE),
        -- Áreas sin portal de help desk propio (usuarios finales)
        (v_area_fin,  v_tenant, 'Finanzas',          'Contabilidad, tesorería y control presupuestario',      NULL,      TRUE),
        (v_area_mkt,  v_tenant, 'Marketing',         'Marketing, comunicación y relaciones públicas',         NULL,      TRUE),
        (v_area_adm,  v_tenant, 'Administración',    'Administración general y secretaría',                   NULL,      TRUE),
        (v_area_ger,  v_tenant, 'Gerencia',          'Dirección general y gerencias de área',                 NULL,      TRUE)
    ON CONFLICT ("Id") DO UPDATE SET
        "Nombre"      = EXCLUDED."Nombre",
        "Descripcion" = EXCLUDED."Descripcion",
        "HelpDeskId"  = EXCLUDED."HelpDeskId",
        "Activo"      = EXCLUDED."Activo";

    -- ── Asignar área a cada usuario demo ─────────────────────
    UPDATE "Usuarios" SET "AreaId" = v_area_it   WHERE "Id" = v_admin;   -- Admin → IT
    UPDATE "Usuarios" SET "AreaId" = v_area_it   WHERE "Id" = v_sup;     -- Supervisor → IT
    UPDATE "Usuarios" SET "AreaId" = v_area_it   WHERE "Id" = v_age1;    -- Agente1 (Carlos) → IT
    UPDATE "Usuarios" SET "AreaId" = v_area_rrhh WHERE "Id" = v_age2;    -- Agente2 (Ana) → RRHH
    UPDATE "Usuarios" SET "AreaId" = v_area_adm  WHERE "Id" = v_usr;     -- Usuario (Juan) → Administración
    UPDATE "Usuarios" SET "AreaId" = v_area_ger  WHERE "Id" = v_aprob;   -- Aprobador → Gerencia
    UPDATE "Usuarios" SET "AreaId" = v_area_ger  WHERE "Id" = v_obs;     -- Observador → Gerencia

    -- ── Limpiar HelpDeskAgentes demo existentes ──────────────
    DELETE FROM "HelpDeskAgentes"
    WHERE "TenantId" = v_tenant
      AND "UsuarioId" IN (v_admin, v_sup, v_age1, v_age2, v_aprob, v_obs);

    -- ── Auto-asignar agentes a sus portales según área ───────
    -- Agente1 (Carlos Martínez) → IT Help Desk (responsable)
    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_it,   v_age1, TRUE,  NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO UPDATE SET "EsResponsable" = TRUE;

    -- Agente2 (Ana López) → RRHH (responsable)
    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_rrhh, v_age2, TRUE,  NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO UPDATE SET "EsResponsable" = TRUE;

    -- Supervisor (María González) → todos los portales (sin responsabilidad)
    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_it,   v_sup, FALSE, NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO NOTHING;

    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_rrhh, v_sup, FALSE, NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO NOTHING;

    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_comp, v_sup, FALSE, NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO NOTHING;

    INSERT INTO "HelpDeskAgentes" ("Id","TenantId","HelpDeskId","UsuarioId","EsResponsable","FechaAsignacion")
    VALUES (gen_random_uuid(), v_tenant, v_hd_fac,  v_sup, FALSE, NOW())
    ON CONFLICT ("HelpDeskId","UsuarioId") DO NOTHING;

    RAISE NOTICE 'Script 12 ejecutado correctamente — 8 áreas creadas y agentes asignados.';
END $$;

-- Verificación
SELECT
    a."Nombre"        AS "Área",
    a."Descripcion",
    hd."Nombre"       AS "HelpDesk vinculado",
    COUNT(u."Id")     AS "Usuarios en el área"
FROM "Areas" a
LEFT JOIN "HelpDesks" hd ON hd."Id" = a."HelpDeskId"
LEFT JOIN "Usuarios" u   ON u."AreaId" = a."Id"
WHERE a."TenantId" = '10000000-0000-0000-0000-000000000001'
GROUP BY a."Nombre", a."Descripcion", hd."Nombre"
ORDER BY a."Nombre";

-- Permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deskflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;
