-- =============================================================
-- DeskFlow — Script 15: Adjuntos Base de Conocimiento + Permisos por Módulo
-- =============================================================

-- ── 1. Tabla ConocimientoAdjuntos ──────────────────────────────
CREATE TABLE "ConocimientoAdjuntos" (
    "Id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
    "TenantId"         UUID         NOT NULL,
    "ArticuloId"       UUID         NOT NULL,
    "NombreOriginal"   VARCHAR(255) NOT NULL,
    "RutaAlmacenada"   VARCHAR(500) NOT NULL,
    "ContentType"      VARCHAR(100) NOT NULL,
    "TamanoBytes"      BIGINT       NOT NULL,
    "FechaCreacion"    TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_ConocimientoAdjuntos" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ConocimientoAdjuntos_Tenants"        FOREIGN KEY ("TenantId")  REFERENCES "Tenants"("Id"),
    CONSTRAINT "FK_ConocimientoAdjuntos_BaseConocimiento" FOREIGN KEY ("ArticuloId") REFERENCES "BaseConocimiento"("Id") ON DELETE CASCADE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON "ConocimientoAdjuntos" TO deskflow_app;

-- ── 2. Tabla PermisosModulo ─────────────────────────────────────
CREATE TABLE "PermisosModulo" (
    "Id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "TenantId"    UUID         NOT NULL,
    "RolId"       UUID         NOT NULL,
    "ModuloClave" VARCHAR(100) NOT NULL,
    "Activo"      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_PermisosModulo" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PermisosModulo_Tenants" FOREIGN KEY ("TenantId") REFERENCES "Tenants"("Id"),
    CONSTRAINT "FK_PermisosModulo_Roles"   FOREIGN KEY ("RolId")    REFERENCES "Roles"("Id"),
    CONSTRAINT "UQ_PermisosModulo_Rol_Modulo" UNIQUE ("TenantId", "RolId", "ModuloClave")
);

GRANT SELECT, INSERT, UPDATE, DELETE ON "PermisosModulo" TO deskflow_app;

-- ── 3. Verificar ───────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ConocimientoAdjuntos', 'PermisosModulo')
ORDER BY table_name;
