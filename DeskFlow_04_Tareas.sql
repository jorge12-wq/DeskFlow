-- ============================================================
--  DeskFlow – PASO 4: Módulo de Tareas (estilo InvGate)
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
-- ============================================================

-- ── Tabla de Tareas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Tareas" (
    "Id"               uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"         uuid                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "TicketId"         uuid                     REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    "Titulo"           varchar(200)             NOT NULL,
    "Descripcion"      text,
    "CreadoPorId"      uuid                     NOT NULL REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    "AsignadoAId"      uuid                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "FechaVencimiento" timestamp with time zone,
    "Completada"       boolean                  NOT NULL DEFAULT false,
    "FechaCompletada"  timestamp with time zone,
    "FechaCreacion"    timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_Tareas_TenantId"
  ON "Tareas"("TenantId");

CREATE INDEX IF NOT EXISTS "IX_Tareas_TicketId"
  ON "Tareas"("TicketId");

CREATE INDEX IF NOT EXISTS "IX_Tareas_AsignadoAId"
  ON "Tareas"("AsignadoAId");

CREATE INDEX IF NOT EXISTS "IX_Tareas_Completada"
  ON "Tareas"("Completada");

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  Módulo Tareas aplicado:';
  RAISE NOTICE '  + Tabla: Tareas';
  RAISE NOTICE '  + Índices: TenantId, TicketId, AsignadoAId, Completada';
  RAISE NOTICE '====================================================';
END $$;
