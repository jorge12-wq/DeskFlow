-- ============================================================
--  DeskFlow – PASO 3: Roles, permisos y flujo de aprobación
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
-- ============================================================

DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT "Id" INTO v_tenant_id FROM "Tenants" LIMIT 1;

  -- ── Nuevos roles ─────────────────────────────────────────
  INSERT INTO "Roles" ("Id", "TenantId", "Nombre", "Descripcion")
  VALUES
    ('10000000-0000-0000-0000-000000000006', v_tenant_id,
     'Agente', 'Agente de soporte – puede tomar, escalar y resolver tickets'),
    ('10000000-0000-0000-0000-000000000007', v_tenant_id,
     'Aprobador', 'Aprueba o rechaza tickets que requieren validación')
  ON CONFLICT ("Id") DO NOTHING;

  -- ── Nuevos estados (EstadosTicket es global, sin TenantId) ──
  INSERT INTO "EstadosTicket" ("Id", "Nombre", "Color", "Orden", "EsFinal")
  VALUES
    ('30000000-0000-0000-0000-000000000009',
     'Escalado',                '#DC2626', 8, false),
    ('30000000-0000-0000-0000-000000000010',
     'Pendiente de Aprobación', '#7C3AED', 9, false),
    ('30000000-0000-0000-0000-000000000011',
     'Rechazado',               '#991B1B', 10, true)
  ON CONFLICT ("Id") DO NOTHING;

END $$;

-- ── Tabla de aprobaciones ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AprobacionesTicket" (
    "Id"            uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"      uuid                        NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "TicketId"      uuid                        NOT NULL REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    "AprobadorId"   uuid                        REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "Estado"        integer                     NOT NULL DEFAULT 0,
    "Comentario"    text,
    "FechaDecision" timestamp with time zone,
    "FechaCreacion" timestamp with time zone    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_AprobacionesTicket_TenantId"
  ON "AprobacionesTicket"("TenantId");

CREATE INDEX IF NOT EXISTS "IX_AprobacionesTicket_TicketId"
  ON "AprobacionesTicket"("TicketId");

CREATE INDEX IF NOT EXISTS "IX_AprobacionesTicket_Estado"
  ON "AprobacionesTicket"("Estado");

-- ── Columna de escalación en Tickets ────────────────────────
ALTER TABLE "Tickets"
  ADD COLUMN IF NOT EXISTS "FechaEscalacion" timestamp with time zone;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  Roles y permisos aplicados:';
  RAISE NOTICE '  + Rol: Agente';
  RAISE NOTICE '  + Rol: Aprobador';
  RAISE NOTICE '  + Estado: Escalado';
  RAISE NOTICE '  + Estado: Pendiente de Aprobación';
  RAISE NOTICE '  + Estado: Rechazado';
  RAISE NOTICE '  + Tabla: AprobacionesTicket';
  RAISE NOTICE '  + Columna: Tickets.FechaEscalacion';
  RAISE NOTICE '====================================================';
END $$;
