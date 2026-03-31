-- =============================================================
-- DeskFlow — Script 08: Visual Workflow Builder
-- =============================================================

-- ── Workflows ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Workflows" (
    "Id"                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"           UUID         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Nombre"             VARCHAR(200) NOT NULL,
    "Descripcion"        TEXT,
    "Tipo"               VARCHAR(50)  NOT NULL DEFAULT 'General',  -- General | Servicio | Cambio
    "ServicioId"         UUID         REFERENCES "ServiciosCatalogo"("Id") ON DELETE SET NULL,
    "Activo"             BOOLEAN      NOT NULL DEFAULT true,
    "FechaCreacion"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "FechaActualizacion" TIMESTAMPTZ,
    "CreadoPorId"        UUID         REFERENCES "Usuarios"("Id") ON DELETE SET NULL
);

-- ── Workflow Nodes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "WorkflowNodos" (
    "Id"         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "WorkflowId" UUID         NOT NULL REFERENCES "Workflows"("Id") ON DELETE CASCADE,
    "TipoNodo"   VARCHAR(50)  NOT NULL,   -- inicio | formulario | aprobacion | tareas | condicional | email | fin | cancelar
    "Nombre"     VARCHAR(200) NOT NULL DEFAULT '',
    "PosicionX"  FLOAT        NOT NULL DEFAULT 0,
    "PosicionY"  FLOAT        NOT NULL DEFAULT 0,
    "ConfigJson" TEXT                      -- node-specific JSON config
);

-- ── Workflow Edges ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "WorkflowConexiones" (
    "Id"            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "WorkflowId"    UUID         NOT NULL REFERENCES "Workflows"("Id")     ON DELETE CASCADE,
    "NodoOrigenId"  UUID         NOT NULL REFERENCES "WorkflowNodos"("Id") ON DELETE CASCADE,
    "NodoDestinoId" UUID         NOT NULL REFERENCES "WorkflowNodos"("Id") ON DELETE CASCADE,
    "Etiqueta"      VARCHAR(100),   -- "Sí" / "No" for conditional branches
    "Orden"         INT          NOT NULL DEFAULT 0
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "IX_Workflows_TenantId"          ON "Workflows"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowNodos_WorkflowId"    ON "WorkflowNodos"("WorkflowId");
CREATE INDEX IF NOT EXISTS "IX_WorkflowConexiones_WorkflowId" ON "WorkflowConexiones"("WorkflowId");
