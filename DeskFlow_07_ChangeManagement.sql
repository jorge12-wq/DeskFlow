-- ============================================================
--  DeskFlow – PASO 7: Change Management (RFC / CAB / Calendario)
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
-- ============================================================

-- ── Tipos de cambio (global sin TenantId) ────────────────────
CREATE TABLE IF NOT EXISTS "TiposCambio" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "Nombre"      VARCHAR(100) NOT NULL,
    "Descripcion" TEXT,
    "Color"       VARCHAR(20)  NOT NULL DEFAULT '#6B7280',
    "Orden"       INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT "PK_TiposCambio" PRIMARY KEY ("Id")
);

INSERT INTO "TiposCambio" ("Id","Nombre","Descripcion","Color","Orden") VALUES
  ('60000000-0000-0000-0000-000000000001','Estándar',    'Cambio pre-aprobado, bajo riesgo, procedimiento conocido','#10B981', 1),
  ('60000000-0000-0000-0000-000000000002','Normal',      'Cambio planificado que requiere aprobación del CAB',      '#3B82F6', 2),
  ('60000000-0000-0000-0000-000000000003','Urgente',     'Cambio con plazo reducido, requiere aprobación rápida',   '#F59E0B', 3),
  ('60000000-0000-0000-0000-000000000004','Emergencia',  'Cambio inmediato para resolver incidente crítico',         '#EF4444', 4)
ON CONFLICT ("Id") DO NOTHING;

-- ── Estados de cambio (global sin TenantId) ───────────────────
CREATE TABLE IF NOT EXISTS "EstadosCambio" (
    "Id"      UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "Nombre"  VARCHAR(100) NOT NULL,
    "Color"   VARCHAR(20)  NOT NULL,
    "Orden"   INTEGER      NOT NULL,
    "EsFinal" BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_EstadosCambio" PRIMARY KEY ("Id")
);

INSERT INTO "EstadosCambio" ("Id","Nombre","Color","Orden","EsFinal") VALUES
  ('61000000-0000-0000-0000-000000000001','Borrador',                '#6B7280', 1, false),
  ('61000000-0000-0000-0000-000000000002','Enviado a CAB',           '#3B82F6', 2, false),
  ('61000000-0000-0000-0000-000000000003','Aprobado por CAB',        '#10B981', 3, false),
  ('61000000-0000-0000-0000-000000000004','En Implementación',       '#8B5CF6', 4, false),
  ('61000000-0000-0000-0000-000000000005','Revisión Post-Impl.',     '#F59E0B', 5, false),
  ('61000000-0000-0000-0000-000000000006','Cerrado',                 '#374151', 6, true),
  ('61000000-0000-0000-0000-000000000007','Rechazado',               '#DC2626', 7, true)
ON CONFLICT ("Id") DO NOTHING;

-- ── RFC / Cambios ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Cambios" (
    "Id"                        UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"                  UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Numero"                    VARCHAR(20)              NOT NULL,
    "Titulo"                    VARCHAR(500)             NOT NULL,
    "Descripcion"               TEXT                     NOT NULL,
    "TipoCambioId"              UUID                     NOT NULL REFERENCES "TiposCambio"("Id"),
    "EstadoId"                  UUID                     NOT NULL REFERENCES "EstadosCambio"("Id"),
    "PrioridadId"               UUID                     NOT NULL REFERENCES "Prioridades"("Id"),
    "CategoriaId"               UUID                     REFERENCES "Categorias"("Id") ON DELETE SET NULL,
    "SolicitanteId"             UUID                     NOT NULL REFERENCES "Usuarios"("Id"),
    "ImplementadorId"           UUID                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "Riesgo"                    VARCHAR(20)              NOT NULL DEFAULT 'Bajo',
    "Impacto"                   VARCHAR(20)              NOT NULL DEFAULT 'Bajo',
    "Urgencia"                  VARCHAR(20)              NOT NULL DEFAULT 'Baja',
    "DescripcionImpacto"        TEXT,
    "PlanImplementacion"        TEXT,
    "PlanPruebas"               TEXT,
    "PlanBackout"               TEXT,
    "ResultadoPostImpl"         TEXT,
    "FechaCreacion"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "FechaInicioPlaneado"       TIMESTAMP WITH TIME ZONE,
    "FechaFinPlaneado"          TIMESTAMP WITH TIME ZONE,
    "FechaInicioReal"           TIMESTAMP WITH TIME ZONE,
    "FechaFinReal"              TIMESTAMP WITH TIME ZONE,
    "FechaCierre"               TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "PK_Cambios" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_Cambios_Numero_Tenant" ON "Cambios"("TenantId","Numero");
CREATE INDEX IF NOT EXISTS "IX_Cambios_TenantId"        ON "Cambios"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Cambios_EstadoId"        ON "Cambios"("EstadoId");
CREATE INDEX IF NOT EXISTS "IX_Cambios_ImplementadorId" ON "Cambios"("ImplementadorId");
CREATE INDEX IF NOT EXISTS "IX_Cambios_FechaInicio"     ON "Cambios"("FechaInicioPlaneado");

-- ── Aprobadores CAB por cambio ────────────────────────────────
CREATE TABLE IF NOT EXISTS "AprobadoresCAB" (
    "Id"           UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"     UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "CambioId"     UUID                     NOT NULL REFERENCES "Cambios"("Id") ON DELETE CASCADE,
    "AprobadorId"  UUID                     NOT NULL REFERENCES "Usuarios"("Id") ON DELETE CASCADE,
    "Estado"       INTEGER                  NOT NULL DEFAULT 0,  -- 0=Pendiente 1=Aprobado 2=Rechazado
    "Comentario"   TEXT,
    "FechaDecision" TIMESTAMP WITH TIME ZONE,
    "FechaCreacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_AprobadoresCAB" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_CAB_CambioAprobador" UNIQUE ("CambioId","AprobadorId")
);

CREATE INDEX IF NOT EXISTS "IX_AprobadoresCAB_CambioId"    ON "AprobadoresCAB"("CambioId");
CREATE INDEX IF NOT EXISTS "IX_AprobadoresCAB_AprobadorId" ON "AprobadoresCAB"("AprobadorId");

-- ── Historial de cambio ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HistorialCambio" (
    "Id"          UUID                     NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID                     NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "CambioId"    UUID                     NOT NULL REFERENCES "Cambios"("Id") ON DELETE CASCADE,
    "UsuarioId"   UUID                     REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
    "Accion"      VARCHAR(200)             NOT NULL,
    "Detalle"     TEXT,
    "FechaAccion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_HistorialCambio" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_HistorialCambio_CambioId" ON "HistorialCambio"("CambioId");

-- ── Relación Cambio ↔ Problemas ───────────────────────────────
CREATE TABLE IF NOT EXISTS "CambioProblemas" (
    "Id"            UUID NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"      UUID NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "CambioId"      UUID NOT NULL REFERENCES "Cambios"("Id") ON DELETE CASCADE,
    "ProblemaId"    UUID NOT NULL REFERENCES "Problemas"("Id") ON DELETE CASCADE,
    "FechaVinculacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_CambioProblemas" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_CambioProblema" UNIQUE ("CambioId","ProblemaId")
);

-- ── Secuencia para numeración CHG-XXXXX ──────────────────────
CREATE SEQUENCE IF NOT EXISTS seq_cambio_numero START 1000 INCREMENT 1;

DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  Change Management aplicado:';
  RAISE NOTICE '  + Tabla: TiposCambio (4 tipos)';
  RAISE NOTICE '  + Tabla: EstadosCambio (7 estados)';
  RAISE NOTICE '  + Tabla: Cambios (RFC)';
  RAISE NOTICE '  + Tabla: AprobadoresCAB';
  RAISE NOTICE '  + Tabla: HistorialCambio';
  RAISE NOTICE '  + Tabla: CambioProblemas';
  RAISE NOTICE '  + Secuencia: seq_cambio_numero';
  RAISE NOTICE '====================================================';
END $$;
