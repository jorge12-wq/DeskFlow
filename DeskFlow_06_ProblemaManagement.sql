-- ============================================================
--  DeskFlow – PASO 6: Problem Management
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
-- ============================================================

-- ── Estados de problema (tabla global sin TenantId) ─────────
CREATE TABLE IF NOT EXISTS "EstadosProblema" (
    "Id"      UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "Nombre"  VARCHAR(100) NOT NULL,
    "Color"   VARCHAR(20)  NOT NULL,
    "Orden"   INTEGER      NOT NULL,
    "EsFinal" BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_EstadosProblema" PRIMARY KEY ("Id")
);

INSERT INTO "EstadosProblema" ("Id","Nombre","Color","Orden","EsFinal") VALUES
  ('50000000-0000-0000-0000-000000000001','Nuevo',               '#6B7280', 1, false),
  ('50000000-0000-0000-0000-000000000002','En Investigación',    '#3B82F6', 2, false),
  ('50000000-0000-0000-0000-000000000003','Error Conocido',      '#F59E0B', 3, false),
  ('50000000-0000-0000-0000-000000000004','Resuelto',            '#10B981', 4, false),
  ('50000000-0000-0000-0000-000000000005','Cerrado',             '#374151', 5, true)
ON CONFLICT ("Id") DO NOTHING;

-- ── Tabla Problemas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Problemas" (
    "Id"                  UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"            UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Numero"              VARCHAR(20)              NOT NULL,
    "Titulo"              VARCHAR(500)             NOT NULL,
    "Descripcion"         TEXT                     NOT NULL,
    "EstadoId"            UUID                     NOT NULL REFERENCES "EstadosProblema"("Id"),
    "PrioridadId"         UUID                     NOT NULL REFERENCES "Prioridades"("Id"),
    "CategoriaId"         UUID                     REFERENCES "Categorias"("Id") ON DELETE SET NULL,
    "ResponsableId"       UUID                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "UsuarioCreadorId"    UUID                     NOT NULL REFERENCES "Usuarios"("Id"),
    "CausaRaiz"           TEXT,
    "Workaround"          TEXT,
    "Solucion"            TEXT,
    "EsErrorConocido"     BOOLEAN                  NOT NULL DEFAULT FALSE,
    "FechaCreacion"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "FechaIdentificacion" TIMESTAMP WITH TIME ZONE,
    "FechaResolucion"     TIMESTAMP WITH TIME ZONE,
    "FechaCierre"         TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "PK_Problemas" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_Problemas_Numero_Tenant"
    ON "Problemas"("TenantId","Numero");
CREATE INDEX IF NOT EXISTS "IX_Problemas_TenantId"      ON "Problemas"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Problemas_EstadoId"      ON "Problemas"("EstadoId");
CREATE INDEX IF NOT EXISTS "IX_Problemas_ResponsableId" ON "Problemas"("ResponsableId");

-- ── Relación Problema ↔ Incidentes (tickets) ─────────────────
CREATE TABLE IF NOT EXISTS "ProblemaIncidentes" (
    "Id"              UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"        UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "ProblemaId"      UUID                     NOT NULL REFERENCES "Problemas"("Id") ON DELETE CASCADE,
    "TicketId"        UUID                     NOT NULL REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    "VinculadoPorId"  UUID                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "FechaVinculacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_ProblemaIncidentes" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_ProblemaIncidente" UNIQUE ("ProblemaId","TicketId")
);

CREATE INDEX IF NOT EXISTS "IX_ProblemaIncidentes_ProblemaId" ON "ProblemaIncidentes"("ProblemaId");
CREATE INDEX IF NOT EXISTS "IX_ProblemaIncidentes_TicketId"   ON "ProblemaIncidentes"("TicketId");

-- ── Historial de problema ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HistorialProblema" (
    "Id"          UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "ProblemaId"  UUID                     NOT NULL REFERENCES "Problemas"("Id") ON DELETE CASCADE,
    "UsuarioId"   UUID                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "Accion"      VARCHAR(200)             NOT NULL,
    "Detalle"     TEXT,
    "FechaAccion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_HistorialProblema" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_HistorialProblema_ProblemaId" ON "HistorialProblema"("ProblemaId");

-- ── Secuencia para numeración PBM-XXXXX ──────────────────────
CREATE SEQUENCE IF NOT EXISTS seq_problema_numero START 1000 INCREMENT 1;

DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  Problem Management aplicado:';
  RAISE NOTICE '  + Tabla: EstadosProblema (5 estados)';
  RAISE NOTICE '  + Tabla: Problemas';
  RAISE NOTICE '  + Tabla: ProblemaIncidentes';
  RAISE NOTICE '  + Tabla: HistorialProblema';
  RAISE NOTICE '  + Secuencia: seq_problema_numero';
  RAISE NOTICE '====================================================';
END $$;
