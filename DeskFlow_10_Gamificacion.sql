-- =============================================================
-- DeskFlow — Script 10: Gamificación + Analytics Avanzado
-- =============================================================

-- ── Logros (global, sin TenantId) ─────────────────────────────
CREATE TABLE IF NOT EXISTS "Logros" (
    "Id"               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "Clave"            VARCHAR(50)  NOT NULL UNIQUE,
    "Nombre"           VARCHAR(100) NOT NULL,
    "Descripcion"      TEXT         NOT NULL,
    "Icono"            VARCHAR(10)  NOT NULL,
    "Criterio"         VARCHAR(200) NOT NULL,
    "PuntosRecompensa" INTEGER      NOT NULL DEFAULT 0,
    "Orden"            INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO "Logros" ("Id","Clave","Nombre","Descripcion","Icono","Criterio","PuntosRecompensa","Orden") VALUES
  (gen_random_uuid(),'primer_ticket',    'Primeros pasos',     'Resolvió su primer ticket',                    '🎯','1 ticket resuelto',          50,  1),
  (gen_random_uuid(),'cinco_tickets',    'Rodando',            'Resolvió 5 tickets',                           '⚡','5 tickets resueltos',         100, 2),
  (gen_random_uuid(),'diez_tickets',     'En forma',           'Resolvió 10 tickets',                          '🔥','10 tickets resueltos',        200, 3),
  (gen_random_uuid(),'cincuenta',        'Medio centenar',     'Resolvió 50 tickets',                          '💪','50 tickets resueltos',        500, 4),
  (gen_random_uuid(),'centurion',        'Centurión',          'Resolvió 100 tickets',                         '🏆','100 tickets resueltos',      1000, 5),
  (gen_random_uuid(),'sla_heroe',        'Héroe del SLA',      '20 tickets resueltos dentro del SLA',          '⏱','20 tickets en tiempo de SLA', 300, 6),
  (gen_random_uuid(),'csat_estrella',    'Estrella de 5',      '5 encuestas con puntuación máxima',            '⭐','5 encuestas 5 estrellas',     400, 7),
  (gen_random_uuid(),'velocidad',        'Relámpago',          '10 tickets resueltos en menos de 2 horas',     '💨','10 tickets < 2 h',            350, 8),
  (gen_random_uuid(),'comentarista',     'Comunicador',        '50 comentarios en tickets',                    '💬','50 comentarios',              150, 9),
  (gen_random_uuid(),'sin_vencer',       'Sin fallos',         'Mes completo sin tickets vencidos en SLA',     '🛡','0 tickets vencidos en el mes',300,10)
ON CONFLICT ("Clave") DO NOTHING;

-- ── Logros por agente ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LogrosAgente" (
    "Id"             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"       UUID        NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "UsuarioId"      UUID        NOT NULL REFERENCES "Usuarios"("Id") ON DELETE CASCADE,
    "LogroId"        UUID        NOT NULL REFERENCES "Logros"("Id")   ON DELETE CASCADE,
    "FechaObtenido"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_LogroAgente" UNIQUE ("UsuarioId", "LogroId")
);

CREATE INDEX IF NOT EXISTS "IX_LogrosAgente_UsuarioId" ON "LogrosAgente"("UsuarioId");
CREATE INDEX IF NOT EXISTS "IX_LogrosAgente_TenantId"  ON "LogrosAgente"("TenantId");

-- ── Dashboards personalizados (por usuario) ───────────────────
CREATE TABLE IF NOT EXISTS "DashboardsPersonalizados" (
    "Id"           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     UUID  NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "UsuarioId"    UUID  NOT NULL REFERENCES "Usuarios"("Id") ON DELETE CASCADE,
    "WidgetsJson"  TEXT  NOT NULL DEFAULT '[]',
    "FechaModif"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Dashboard_Usuario" UNIQUE ("UsuarioId")
);

-- ── Reportes compartidos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportesCompartidos" (
    "Id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"        UUID         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Token"           VARCHAR(64)  NOT NULL UNIQUE,
    "Titulo"          VARCHAR(200) NOT NULL,
    "ConfigJson"      TEXT         NOT NULL DEFAULT '{}',
    "DatosJson"       TEXT,
    "CreadoPorId"     UUID         REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "FechaCreacion"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "FechaExpiracion" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "IX_ReportesCompartidos_Token"    ON "ReportesCompartidos"("Token");
CREATE INDEX IF NOT EXISTS "IX_ReportesCompartidos_TenantId" ON "ReportesCompartidos"("TenantId");

-- Permisos
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deskflow_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;
