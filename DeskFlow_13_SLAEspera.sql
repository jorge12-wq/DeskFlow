-- =============================================================
-- DeskFlow — Script 13: SLA Horario Laboral + Motivos de Espera
-- =============================================================

-- ── 1. ConfiguracionesHorario ──────────────────────────────────
--    Una fila por tenant con el horario laboral para el cálculo
--    del SLA (sólo corre dentro de las horas configuradas).

CREATE TABLE IF NOT EXISTS "ConfiguracionesHorario" (
    "Id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     UUID         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "HoraInicio"   TIME         NOT NULL DEFAULT '08:00:00',
    "HoraFin"      TIME         NOT NULL DEFAULT '18:00:00',
    "Lunes"        BOOLEAN      NOT NULL DEFAULT true,
    "Martes"       BOOLEAN      NOT NULL DEFAULT true,
    "Miercoles"    BOOLEAN      NOT NULL DEFAULT true,
    "Jueves"       BOOLEAN      NOT NULL DEFAULT true,
    "Viernes"      BOOLEAN      NOT NULL DEFAULT true,
    "Sabado"       BOOLEAN      NOT NULL DEFAULT false,
    "Domingo"      BOOLEAN      NOT NULL DEFAULT false,
    "ZonaHoraria"  VARCHAR(100) NOT NULL DEFAULT 'UTC',
    CONSTRAINT "UQ_ConfiguracionHorario_Tenant" UNIQUE ("TenantId")
);

CREATE INDEX IF NOT EXISTS "IX_ConfiguracionesHorario_TenantId"
    ON "ConfiguracionesHorario"("TenantId");

-- Insertar configuración por defecto para el tenant demo
INSERT INTO "ConfiguracionesHorario"
    ("Id", "TenantId", "HoraInicio", "HoraFin",
     "Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo",
     "ZonaHoraria")
VALUES
    (gen_random_uuid(),
     '10000000-0000-0000-0000-000000000001',
     '08:00:00', '18:00:00',
     true, true, true, true, true, false, false,
     'America/Argentina/Buenos_Aires')
ON CONFLICT ("TenantId") DO NOTHING;


-- ── 2. MotivosEspera ──────────────────────────────────────────
--    Razones pre-configuradas para poner un ticket en espera.
--    El SLA se pausa automáticamente mientras el ticket está
--    en estado de espera.

CREATE TABLE IF NOT EXISTS "MotivosEspera" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    UUID         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Descripcion" TEXT,
    "Icono"       VARCHAR(10)  NOT NULL DEFAULT '⏳',
    "HelpDeskId"  UUID         REFERENCES "HelpDesks"("Id") ON DELETE SET NULL,
    "Activo"      BOOLEAN      NOT NULL DEFAULT true,
    "Orden"       INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_MotivosEspera_TenantId"
    ON "MotivosEspera"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_MotivosEspera_HelpDeskId"
    ON "MotivosEspera"("HelpDeskId");

-- Motivos globales para el tenant demo
DO $$
DECLARE
    v_tenant UUID := '10000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO "MotivosEspera" ("Id","TenantId","Nombre","Icono","Activo","Orden") VALUES
        (gen_random_uuid(), v_tenant, 'Esperando respuesta del cliente',   '👤', true,  1),
        (gen_random_uuid(), v_tenant, 'Esperando al proveedor',            '🏢', true,  2),
        (gen_random_uuid(), v_tenant, 'Esperando equipo / hardware',       '💻', true,  3),
        (gen_random_uuid(), v_tenant, 'Esperando acceso remoto',           '🔐', true,  4),
        (gen_random_uuid(), v_tenant, 'Esperando reunión técnica',         '📅', true,  5),
        (gen_random_uuid(), v_tenant, 'Esperando aprobación de cambio',    '✅', true,  6),
        (gen_random_uuid(), v_tenant, 'Esperando actualización del sistema','🔄', true,  7),
        (gen_random_uuid(), v_tenant, 'Esperando documentación',           '📄', true,  8),
        (gen_random_uuid(), v_tenant, 'Esperando presupuesto',             '💰', true,  9),
        (gen_random_uuid(), v_tenant, 'Esperando entrega / instalación',   '📦', true, 10),
        (gen_random_uuid(), v_tenant, 'Esperando licencia',                '🔑', true, 11),
        (gen_random_uuid(), v_tenant, 'Esperando reunión de seguimiento',  '👥', true, 12)
    ON CONFLICT DO NOTHING;
END $$;


-- ── 3. Columnas nuevas en Tickets ─────────────────────────────
--    Seguimiento del estado de espera por ticket.

ALTER TABLE "Tickets"
    ADD COLUMN IF NOT EXISTS "EstaEnEspera"   BOOLEAN      NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "MotivoEsperaId" UUID         REFERENCES "MotivosEspera"("Id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "FechaEnEspera"  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "IX_Tickets_MotivoEsperaId"
    ON "Tickets"("MotivoEsperaId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_EstaEnEspera"
    ON "Tickets"("EstaEnEspera")
    WHERE "EstaEnEspera" = true;   -- índice parcial, sólo los que están en espera


-- ── 4. Columnas de lado en WorkflowConexiones ─────────────────
--    Guardan desde/hacia qué lado de cada nodo sale/entra la flecha.

ALTER TABLE "WorkflowConexiones"
    ADD COLUMN IF NOT EXISTS "OrigenLado"  VARCHAR(10),   -- right | left | top | bottom
    ADD COLUMN IF NOT EXISTS "DestinoLado" VARCHAR(10),   -- right | left | top | bottom
    ADD COLUMN IF NOT EXISTS "MidOffsetX"  FLOAT,         -- desplazamiento del punto de curva en X
    ADD COLUMN IF NOT EXISTS "MidOffsetY"  FLOAT;         -- desplazamiento del punto de curva en Y


-- ── Permisos ──────────────────────────────────────────────────
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO deskflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;
