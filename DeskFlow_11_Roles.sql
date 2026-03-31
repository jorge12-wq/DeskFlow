-- =============================================================
-- DeskFlow — Script 11: Reestructuración de Roles y Usuarios Demo
-- =============================================================
-- Roles resultantes:
--   Administrador  20000000-0000-0000-0000-000000000001
--   Supervisor     20000000-0000-0000-0000-000000000002
--   Agente         20000000-0000-0000-0000-000000000003  (era Tecnico)
--   Aprobador      20000000-0000-0000-0000-000000000005
--   Usuario        20000000-0000-0000-0000-000000000004
--   Observador     20000000-0000-0000-0000-000000000006  (nuevo)
-- Todos los passwords demo: Admin123!
-- Hash bcrypt de "Admin123!" generado por el seeder en runtime.
-- Para demo rápido usamos hash de "password": $2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- =============================================================

DO $$
DECLARE
    v_tenant    UUID := '10000000-0000-0000-0000-000000000001';
    v_hash      TEXT := '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; -- password: Admin123!
    v_rolAdmin  UUID := '20000000-0000-0000-0000-000000000001';
    v_rolSup    UUID := '20000000-0000-0000-0000-000000000002';
    v_rolAgente UUID := '20000000-0000-0000-0000-000000000003';
    v_rolUsr    UUID := '20000000-0000-0000-0000-000000000004';
    v_rolAprob  UUID := '20000000-0000-0000-0000-000000000005';
    v_rolObs    UUID := '20000000-0000-0000-0000-000000000006';
    v_oldAgente UUID := '10000000-0000-0000-0000-000000000006';
    v_oldAprob  UUID := '10000000-0000-0000-0000-000000000007';

    -- IDs usuarios demo (fijos para idempotencia)
    v_uSup      UUID := '50000000-0000-0000-0000-000000000002';
    v_uAge1     UUID := '50000000-0000-0000-0000-000000000003';
    v_uAge2     UUID := '50000000-0000-0000-0000-000000000004';
    v_uUsr      UUID := '50000000-0000-0000-0000-000000000005';
    v_uAprob    UUID := '50000000-0000-0000-0000-000000000006';
    v_uObs      UUID := '50000000-0000-0000-0000-000000000007';
BEGIN

    -- ── 1. Migrar usuarios del viejo Agente/Aprobador ANTES de tocar roles ─
    -- Usuarios con el viejo Agente (10000000-...006) → ID del Tecnico (20000000-...003)
    -- (todavía se llama Tecnico, lo renombramos después)
    UPDATE "Usuarios" SET "RolId" = v_rolAgente
    WHERE "TenantId" = v_tenant AND "RolId" = v_oldAgente;

    -- Usuarios con el viejo Aprobador (10000000-...007) → nuevo ID fijo Aprobador
    UPDATE "Usuarios" SET "RolId" = v_rolAprob
    WHERE "TenantId" = v_tenant AND "RolId" = v_oldAprob;

    -- ── 2. Eliminar roles duplicados obsoletos (sin FK pendientes ya) ───────
    DELETE FROM "Roles" WHERE "Id" IN (v_oldAgente, v_oldAprob);

    -- ── 3. Renombrar Tecnico → Agente (ahora sin conflicto) ────────────────
    UPDATE "Roles"
    SET "Nombre"      = 'Agente',
        "Descripcion" = 'Atiende y resuelve tickets de soporte'
    WHERE "Id" = v_rolAgente;

    -- ── 4. Actualizar descripción del resto de roles ───────────────────────
    UPDATE "Roles" SET "Descripcion" = 'Control total del sistema — usuarios, configuración, auditoría'
    WHERE "Id" = v_rolAdmin;

    UPDATE "Roles" SET "Descripcion" = 'Gestión operativa — SLA, reportes, helpdesks, asignación de tickets'
    WHERE "Id" = v_rolSup;

    UPDATE "Roles" SET "Descripcion" = 'Usuario final — crea solicitudes y sigue el estado de sus tickets'
    WHERE "Id" = v_rolUsr;

    -- ── 5. Insertar Aprobador con ID fijo ──────────────────────────────────
    INSERT INTO "Roles" ("Id", "TenantId", "Nombre", "Descripcion")
    VALUES (v_rolAprob, v_tenant, 'Aprobador', 'Aprueba RFC, solicitudes de servicio y cambios críticos')
    ON CONFLICT ("Id") DO UPDATE SET "Nombre"      = 'Aprobador',
                                     "Descripcion" = 'Aprueba RFC, solicitudes de servicio y cambios críticos';

    -- ── 6. Insertar Observador (nuevo) ─────────────────────────────────────
    INSERT INTO "Roles" ("Id", "TenantId", "Nombre", "Descripcion")
    VALUES (v_rolObs, v_tenant, 'Observador', 'Acceso de solo lectura — gerentes y stakeholders externos')
    ON CONFLICT ("Id") DO NOTHING;

    -- ── 7. Crear/actualizar usuarios demo ─────────────────────────────────

    -- Supervisor: María González
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uSup, v_tenant, v_rolSup, 'María','González','supervisor@demo.com', v_hash, TRUE, NOW() - INTERVAL '60 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolSup, "Email" = 'supervisor@demo.com', "Nombre" = 'María', "Apellido" = 'González';

    -- Agente 1: Carlos Martínez
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uAge1, v_tenant, v_rolAgente, 'Carlos','Martínez','agente1@demo.com', v_hash, TRUE, NOW() - INTERVAL '45 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolAgente, "Email" = 'agente1@demo.com', "Nombre" = 'Carlos', "Apellido" = 'Martínez';

    -- Agente 2: Ana López
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uAge2, v_tenant, v_rolAgente, 'Ana','López','agente2@demo.com', v_hash, TRUE, NOW() - INTERVAL '30 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolAgente, "Email" = 'agente2@demo.com', "Nombre" = 'Ana', "Apellido" = 'López';

    -- Usuario: Juan Pérez
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uUsr, v_tenant, v_rolUsr, 'Juan','Pérez','usuario@demo.com', v_hash, TRUE, NOW() - INTERVAL '20 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolUsr, "Email" = 'usuario@demo.com', "Nombre" = 'Juan', "Apellido" = 'Pérez';

    -- Aprobador: Roberto Sánchez
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uAprob, v_tenant, v_rolAprob, 'Roberto','Sánchez','aprobador@demo.com', v_hash, TRUE, NOW() - INTERVAL '15 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolAprob, "Email" = 'aprobador@demo.com', "Nombre" = 'Roberto', "Apellido" = 'Sánchez';

    -- Observador: Laura Rodríguez
    INSERT INTO "Usuarios" ("Id","TenantId","RolId","Nombre","Apellido","Email","PasswordHash","Activo","FechaCreacion")
    VALUES (v_uObs, v_tenant, v_rolObs, 'Laura','Rodríguez','observador@demo.com', v_hash, TRUE, NOW() - INTERVAL '10 days')
    ON CONFLICT ("Id") DO UPDATE SET "RolId" = v_rolObs, "Email" = 'observador@demo.com', "Nombre" = 'Laura', "Apellido" = 'Rodríguez';

    RAISE NOTICE 'Script 11 ejecutado correctamente.';
END $$;

-- Permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deskflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;
