-- =============================================================
-- DeskFlow — Script 09: Multi-Helpdesk / ESM
-- =============================================================

-- ── HelpDesks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HelpDesks" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    UUID         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Descripcion" TEXT,
    "Icono"       VARCHAR(10),          -- emoji
    "Color"       VARCHAR(20)  NOT NULL DEFAULT '#3B82F6',
    "Activo"      BOOLEAN      NOT NULL DEFAULT true,
    "Orden"       INTEGER      NOT NULL DEFAULT 0,
    "EsPublico"   BOOLEAN      NOT NULL DEFAULT true,
    "FechaCreacion" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_HelpDesks_TenantId" ON "HelpDesks"("TenantId");

-- ── HelpDesk ↔ Agentes (many-to-many) ────────────────────────
CREATE TABLE IF NOT EXISTS "HelpDeskAgentes" (
    "Id"             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID        NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "HelpDeskId"     UUID        NOT NULL REFERENCES "HelpDesks"("Id") ON DELETE CASCADE,
    "UsuarioId"      UUID        NOT NULL REFERENCES "Usuarios"("Id") ON DELETE CASCADE,
    "EsResponsable"  BOOLEAN     NOT NULL DEFAULT false,
    "FechaAsignacion" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_HelpDeskAgente" UNIQUE ("HelpDeskId", "UsuarioId")
);

CREATE INDEX IF NOT EXISTS "IX_HelpDeskAgentes_HelpDeskId" ON "HelpDeskAgentes"("HelpDeskId");
CREATE INDEX IF NOT EXISTS "IX_HelpDeskAgentes_UsuarioId"  ON "HelpDeskAgentes"("UsuarioId");

-- ── Agregar HelpDeskId a Tickets ──────────────────────────────
ALTER TABLE "Tickets"
    ADD COLUMN IF NOT EXISTS "HelpDeskId" UUID REFERENCES "HelpDesks"("Id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "IX_Tickets_HelpDeskId" ON "Tickets"("HelpDeskId");

-- ── Agregar HelpDeskId a Categorias ───────────────────────────
ALTER TABLE "Categorias"
    ADD COLUMN IF NOT EXISTS "HelpDeskId" UUID REFERENCES "HelpDesks"("Id") ON DELETE SET NULL;

-- ── Datos iniciales — 4 Help Desks para el tenant demo ────────
DO $$
DECLARE
    v_tenant UUID := '10000000-0000-0000-0000-000000000001';
    v_hd_it    UUID := 'A1000000-0000-0000-0000-000000000001';
    v_hd_rrhh  UUID := 'A1000000-0000-0000-0000-000000000002';
    v_hd_comp  UUID := 'A1000000-0000-0000-0000-000000000003';
    v_hd_fac   UUID := 'A1000000-0000-0000-0000-000000000004';
BEGIN
    INSERT INTO "HelpDesks" ("Id","TenantId","Nombre","Descripcion","Icono","Color","Orden") VALUES
      (v_hd_it,   v_tenant, 'IT Help Desk',        'Soporte técnico, hardware, software y redes',             '💻', '#3B82F6', 1),
      (v_hd_rrhh, v_tenant, 'Recursos Humanos',    'Consultas de RRHH, licencias, incorporaciones y bajas',   '👥', '#10B981', 2),
      (v_hd_comp, v_tenant, 'Compras',             'Solicitudes de compra, proveedores y aprobaciones',       '🛒', '#F59E0B', 3),
      (v_hd_fac,  v_tenant, 'Instalaciones',       'Mantenimiento, espacios de trabajo y servicios generales','🏢', '#8B5CF6', 4)
    ON CONFLICT ("Id") DO NOTHING;

    -- Vincular categorías existentes al IT Help Desk por defecto
    UPDATE "Categorias"
    SET "HelpDeskId" = v_hd_it
    WHERE "TenantId" = v_tenant AND "HelpDeskId" IS NULL;
END $$;

-- Permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deskflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;
