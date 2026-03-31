-- ============================================================
--  DeskFlow – PASO 2: Esquema completo de la base de datos
--  PostgreSQL 15/16/17  |  Compatible con pgAdmin 4+
-- ============================================================
--
--  INSTRUCCIONES EN pgAdmin:
--    1. Primero ejecutar DeskFlow_00_Setup.sql conectado a "postgres"
--    2. En el panel izquierdo, expandir Databases > DeskFlowDb
--    3. Click derecho sobre "DeskFlowDb" > Query Tool
--    4. Pegar y ejecutar TODO este archivo
--
--  NOTA: Si no ejecutaste DeskFlow_00_Setup.sql, podés crear la
--  base de datos manualmente: click derecho Databases > Create >
--  Database > nombre: DeskFlowDb
--
-- ============================================================
--  Contenido:
--    1.  Extensiones requeridas
--    2.  Tablas (24 tablas en orden de dependencia)
--    3.  Índices (incluyendo GIN para full-text search)
--    4.  Datos semilla
--    5.  Vistas (8 vistas)
--    6.  Funciones PL/pgSQL
--    7.  Stored Procedures PL/pgSQL
--    8.  Triggers
--    9.  Row Level Security — multi-tenancy a nivel de DB
--   10.  Permisos de tablas para los roles
--   11.  EF Migrations History
-- ============================================================

-- ============================================================
-- 1. EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- búsqueda fuzzy / LIKE acelerado
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- búsqueda sin acentos
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- índices GIN sobre tipos simples

-- Permisos de schema para los roles de la aplicación
GRANT USAGE ON SCHEMA public TO deskflow_app, deskflow_readonly, deskflow_admin;

-- ============================================================
-- 2. TABLAS
-- ============================================================

-- ------------------------------------------------------------
-- 2.01  EstadosTicket  (dato global compartido, sin TenantId)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EstadosTicket" (
    "Id"      UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "Nombre"  VARCHAR(100) NOT NULL,
    "Color"   VARCHAR(20)  NOT NULL,
    "EsFinal" BOOLEAN      NOT NULL DEFAULT FALSE,
    "Orden"   INTEGER      NOT NULL,
    CONSTRAINT "PK_EstadosTicket" PRIMARY KEY ("Id")
);

-- ------------------------------------------------------------
-- 2.02  Tenants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Tenants" (
    "Id"            UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "Nombre"        VARCHAR(200) NOT NULL,
    "Dominio"       VARCHAR(100),
    "Logo"          VARCHAR(500),
    "ColorPrimario" VARCHAR(20),
    "Activo"        BOOLEAN      NOT NULL DEFAULT TRUE,
    "FechaCreacion" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Tenants" PRIMARY KEY ("Id")
);

-- ------------------------------------------------------------
-- 2.03  Areas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Areas" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID         NOT NULL,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Descripcion" VARCHAR(400),
    "Activo"      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_Areas"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Areas_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.04  Categorias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Categorias" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID         NOT NULL,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Descripcion" VARCHAR(400),
    "Icono"       VARCHAR(100),
    "Activo"      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_Categorias"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Categorias_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.05  Prioridades
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Prioridades" (
    "Id"                        UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"                  UUID         NOT NULL,
    "Nombre"                    VARCHAR(100) NOT NULL,
    "Color"                     VARCHAR(20)  NOT NULL,
    "TiempoRespuestaSLA_Horas"  INTEGER      NOT NULL,
    "TiempoResolucionSLA_Horas" INTEGER      NOT NULL,
    "Orden"                     INTEGER      NOT NULL,
    CONSTRAINT "PK_Prioridades"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Prioridades_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.06  Roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID         NOT NULL,
    "Nombre"      VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(300),
    CONSTRAINT "PK_Roles"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Roles_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.07  Sucursales
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Sucursales" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID         NOT NULL,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Direccion"   VARCHAR(400),
    "Activo"      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_Sucursales"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Sucursales_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.08  Subcategorias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Subcategorias" (
    "Id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID         NOT NULL,
    "CategoriaId" UUID         NOT NULL,
    "Nombre"      VARCHAR(200) NOT NULL,
    "Descripcion" VARCHAR(400),
    "Activo"      BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_Subcategorias"            PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Subcategorias_Tenants"    FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Subcategorias_Categorias" FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 2.09  SLAConfiguraciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SLAConfiguraciones" (
    "Id"                     UUID    NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"               UUID    NOT NULL,
    "PrioridadId"            UUID    NOT NULL,
    "CategoriaId"            UUID,
    "TiempoRespuesta_Horas"  INTEGER NOT NULL,
    "TiempoResolucion_Horas" INTEGER NOT NULL,
    "Activo"                 BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_SLAConfiguraciones"             PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SLAConfiguraciones_Tenants"     FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_SLAConfiguraciones_Prioridades" FOREIGN KEY ("PrioridadId")
        REFERENCES "Prioridades"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_SLAConfiguraciones_Categorias"  FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.10  Usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Usuarios" (
    "Id"                 UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"           UUID         NOT NULL,
    "RolId"              UUID         NOT NULL,
    "Nombre"             VARCHAR(100) NOT NULL,
    "Apellido"           VARCHAR(100) NOT NULL,
    "Email"              VARCHAR(200) NOT NULL,
    "PasswordHash"       VARCHAR(500) NOT NULL,
    "SucursalId"         UUID,
    "AreaId"             UUID,
    "Activo"             BOOLEAN      NOT NULL DEFAULT TRUE,
    "FechaCreacion"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "RefreshToken"       VARCHAR(500),
    "RefreshTokenExpiry" TIMESTAMPTZ,
    CONSTRAINT "PK_Usuarios"            PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Usuarios_Tenants"    FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Usuarios_Roles"      FOREIGN KEY ("RolId")
        REFERENCES "Roles"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Usuarios_Sucursales" FOREIGN KEY ("SucursalId")
        REFERENCES "Sucursales"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Usuarios_Areas"      FOREIGN KEY ("AreaId")
        REFERENCES "Areas"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.11  Tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Tickets" (
    "Id"                     UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"               UUID         NOT NULL,
    "Numero"                 VARCHAR(20)  NOT NULL,
    "Asunto"                 VARCHAR(300) NOT NULL,
    "Descripcion"            TEXT         NOT NULL,
    "CategoriaId"            UUID         NOT NULL,
    "SubcategoriaId"         UUID,
    "PrioridadId"            UUID         NOT NULL,
    "EstadoId"               UUID         NOT NULL,
    "UsuarioCreadorId"       UUID         NOT NULL,
    "TecnicoAsignadoId"      UUID,
    "SupervisorId"           UUID,
    "SucursalId"             UUID,
    "AreaId"                 UUID,
    "FechaCreacion"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "FechaAsignacion"        TIMESTAMPTZ,
    "FechaResolucion"        TIMESTAMPTZ,
    "FechaCierre"            TIMESTAMPTZ,
    "FechaLimiteSLA"         TIMESTAMPTZ,
    "SLAEstado"              INTEGER      NOT NULL DEFAULT 0,
    -- 0 = EnTiempo | 1 = EnRiesgo | 2 = Vencido
    "TiempoPausadoMinutos"   INTEGER      NOT NULL DEFAULT 0,
    "FechaInicioUltimaPausa" TIMESTAMPTZ,
    CONSTRAINT "PK_Tickets"                PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Tickets_SLAEstado"      CHECK ("SLAEstado" IN (0, 1, 2)),
    CONSTRAINT "FK_Tickets_Tenants"        FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Categorias"     FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Subcategorias"  FOREIGN KEY ("SubcategoriaId")
        REFERENCES "Subcategorias"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Prioridades"    FOREIGN KEY ("PrioridadId")
        REFERENCES "Prioridades"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_EstadosTicket"  FOREIGN KEY ("EstadoId")
        REFERENCES "EstadosTicket"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Sucursales"     FOREIGN KEY ("SucursalId")
        REFERENCES "Sucursales"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Areas"          FOREIGN KEY ("AreaId")
        REFERENCES "Areas"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_UsuarioCreador" FOREIGN KEY ("UsuarioCreadorId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Tecnico"        FOREIGN KEY ("TecnicoAsignadoId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Tickets_Supervisor"     FOREIGN KEY ("SupervisorId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.12  ComentariosTicket
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ComentariosTicket" (
    "Id"            UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "TicketId"      UUID        NOT NULL,
    "UsuarioId"     UUID        NOT NULL,
    "Contenido"     TEXT        NOT NULL,
    "EsInterno"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "FechaCreacion" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_ComentariosTicket"          PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ComentariosTicket_Tickets"   FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ComentariosTicket_Usuarios"  FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.13  HistorialTickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "HistorialTickets" (
    "Id"               UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TicketId"         UUID         NOT NULL,
    "UsuarioId"        UUID         NOT NULL,
    "EstadoAnteriorId" UUID,
    "EstadoNuevoId"    UUID,
    "Descripcion"      VARCHAR(500) NOT NULL,
    "FechaCreacion"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_HistorialTickets"                PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HistorialTickets_Tickets"         FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_HistorialTickets_Usuarios"        FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_HistorialTickets_EstadoAnterior"  FOREIGN KEY ("EstadoAnteriorId")
        REFERENCES "EstadosTicket"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_HistorialTickets_EstadoNuevo"     FOREIGN KEY ("EstadoNuevoId")
        REFERENCES "EstadosTicket"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.14  AdjuntosTicket
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AdjuntosTicket" (
    "Id"            UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TicketId"      UUID         NOT NULL,
    "ComentarioId"  UUID,
    "NombreArchivo" VARCHAR(255) NOT NULL,
    "RutaArchivo"   VARCHAR(500) NOT NULL,
    "TipoArchivo"   VARCHAR(100) NOT NULL,
    "Tamaño"        BIGINT       NOT NULL,
    "FechaCreacion" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_AdjuntosTicket"                    PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AdjuntosTicket_Tickets"            FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AdjuntosTicket_ComentariosTicket"  FOREIGN KEY ("ComentarioId")
        REFERENCES "ComentariosTicket"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.15  Notificaciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notificaciones" (
    "Id"            UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"      UUID          NOT NULL,
    "UsuarioId"     UUID          NOT NULL,
    "Titulo"        VARCHAR(200)  NOT NULL,
    "Mensaje"       VARCHAR(1000) NOT NULL,
    "Tipo"          INTEGER       NOT NULL,
    -- 1=TicketCreado 2=TicketAsignado 3=NuevoComentario
    -- 4=SLAEnRiesgo  5=SLAVencido    6=TicketResuelto 7=CambioEstado
    "Leida"         BOOLEAN       NOT NULL DEFAULT FALSE,
    "TicketId"      UUID,
    "FechaCreacion" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Notificaciones"          PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notificaciones_Tenants"  FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Notificaciones_Usuarios" FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Notificaciones_Tickets"  FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 2.16  TecnicoCategorias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "TecnicoCategorias" (
    "Id"          UUID NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"    UUID NOT NULL,
    "TecnicoId"   UUID NOT NULL,
    "CategoriaId" UUID NOT NULL,
    CONSTRAINT "PK_TecnicoCategorias"            PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TecnicoCategorias_Tenants"    FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_TecnicoCategorias_Usuarios"   FOREIGN KEY ("TecnicoId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_TecnicoCategorias_Categorias" FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.17  Plantillas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Plantillas" (
    "Id"            UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"      UUID         NOT NULL,
    "Nombre"        VARCHAR(200) NOT NULL,
    "Contenido"     TEXT         NOT NULL,
    "CategoriaId"   UUID,
    "CreadoPorId"   UUID         NOT NULL,
    "Activo"        BOOLEAN      NOT NULL DEFAULT TRUE,
    "FechaCreacion" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Plantillas"            PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Plantillas_Tenants"    FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Plantillas_Categorias" FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Plantillas_CreadoPor"  FOREIGN KEY ("CreadoPorId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.18  BaseConocimiento
--       Columna tsvector generada para full-text search nativo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BaseConocimiento" (
    "Id"                 UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"           UUID         NOT NULL,
    "Titulo"             VARCHAR(500) NOT NULL,
    "Contenido"          TEXT         NOT NULL,
    "CategoriaId"        UUID         NOT NULL,
    "SubcategoriaId"     UUID,
    "Etiquetas"          VARCHAR(1000),
    "AutorId"            UUID         NOT NULL,
    "Vistas"             INTEGER      NOT NULL DEFAULT 0,
    "EsPublico"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "Activo"             BOOLEAN      NOT NULL DEFAULT TRUE,
    "FechaCreacion"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "FechaActualizacion" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "BusquedaVector"     TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce("Titulo", '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce("Etiquetas", '')), 'B')
    ) STORED,
    CONSTRAINT "PK_BaseConocimiento"               PRIMARY KEY ("Id"),
    CONSTRAINT "FK_BaseConocimiento_Tenants"        FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_BaseConocimiento_Categorias"     FOREIGN KEY ("CategoriaId")
        REFERENCES "Categorias"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_BaseConocimiento_Subcategorias"  FOREIGN KEY ("SubcategoriaId")
        REFERENCES "Subcategorias"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_BaseConocimiento_Usuarios"       FOREIGN KEY ("AutorId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.19  ArticulosRelacionados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ArticulosRelacionados" (
    "Id"                    UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ArticuloOrigenId"      UUID NOT NULL,
    "ArticuloRelacionadoId" UUID NOT NULL,
    CONSTRAINT "PK_ArticulosRelacionados"              PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ArticulosRelacionados_Origen"       FOREIGN KEY ("ArticuloOrigenId")
        REFERENCES "BaseConocimiento"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ArticulosRelacionados_Relacionado"  FOREIGN KEY ("ArticuloRelacionadoId")
        REFERENCES "BaseConocimiento"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.20  EncuestaConfiguraciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EncuestaConfiguraciones" (
    "Id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"     UUID         NOT NULL,
    "Pregunta"     VARCHAR(500) NOT NULL DEFAULT '¿Cómo evaluaría la atención recibida?',
    "EscalaMinima" INTEGER      NOT NULL DEFAULT 1,
    "EscalaMaxima" INTEGER      NOT NULL DEFAULT 5,
    "Activo"       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_EncuestaConfiguraciones"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_EncuestaConfiguraciones_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_EncuestaConfiguraciones_Escala"  CHECK ("EscalaMinima" < "EscalaMaxima")
);

-- ------------------------------------------------------------
-- 2.21  EncuestaRespuestas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EncuestaRespuestas" (
    "Id"             UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"       UUID          NOT NULL,
    "TicketId"       UUID          NOT NULL,
    "UsuarioId"      UUID          NOT NULL,
    "TecnicoId"      UUID,
    "Puntuacion"     INTEGER,
    "Comentario"     VARCHAR(1000),
    "FechaCreacion"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "FechaRespuesta" TIMESTAMPTZ,
    CONSTRAINT "PK_EncuestaRespuestas"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_EncuestaRespuestas_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_EncuestaRespuestas_Tickets" FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_EncuestaRespuestas_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_EncuestaRespuestas_Tecnico" FOREIGN KEY ("TecnicoId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.22  Etiquetas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Etiquetas" (
    "Id"       UUID        NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId" UUID        NOT NULL,
    "Nombre"   VARCHAR(50) NOT NULL,
    "Color"    VARCHAR(7)  NOT NULL DEFAULT '#6366f1',
    "Activo"   BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_Etiquetas"         PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Etiquetas_Tenants" FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 2.23  TicketEtiquetas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "TicketEtiquetas" (
    "Id"         UUID NOT NULL DEFAULT uuid_generate_v4(),
    "TicketId"   UUID NOT NULL,
    "EtiquetaId" UUID NOT NULL,
    CONSTRAINT "PK_TicketEtiquetas"           PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TicketEtiquetas_Tickets"   FOREIGN KEY ("TicketId")
        REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TicketEtiquetas_Etiquetas" FOREIGN KEY ("EtiquetaId")
        REFERENCES "Etiquetas"("Id") ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 2.24  AuditLogs  (JSONB para consultas sobre el contenido)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id"              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "TenantId"        UUID         NOT NULL,
    "UsuarioId"       UUID         NOT NULL,
    "Accion"          VARCHAR(50)  NOT NULL,
    -- Created | Updated | Deleted | Login | Logout | PasswordChanged
    "Entidad"         VARCHAR(100) NOT NULL,
    "EntidadId"       UUID,
    "DatosAnteriores" JSONB,
    "DatosNuevos"     JSONB,
    "IP"              VARCHAR(50),
    "FechaCreacion"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_AuditLogs"          PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_Tenants"  FOREIGN KEY ("TenantId")
        REFERENCES "Tenants"("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AuditLogs_Usuarios" FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);


-- ============================================================
-- 3. ÍNDICES
-- ============================================================

-- Tenants
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Tenants_Dominio"
    ON "Tenants"("Dominio") WHERE "Dominio" IS NOT NULL;

-- Roles
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Roles_TenantId_Nombre"
    ON "Roles"("TenantId", "Nombre");

-- Areas / Categorias / Prioridades / Sucursales
CREATE INDEX IF NOT EXISTS "IX_Areas_TenantId"       ON "Areas"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Categorias_TenantId"  ON "Categorias"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Prioridades_TenantId" ON "Prioridades"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Sucursales_TenantId"  ON "Sucursales"("TenantId");

-- Subcategorias
CREATE INDEX IF NOT EXISTS "IX_Subcategorias_TenantId"   ON "Subcategorias"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Subcategorias_CategoriaId" ON "Subcategorias"("CategoriaId");

-- SLAConfiguraciones
CREATE INDEX IF NOT EXISTS "IX_SLAConfiguraciones_TenantId"    ON "SLAConfiguraciones"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_SLAConfiguraciones_PrioridadId" ON "SLAConfiguraciones"("PrioridadId");
CREATE INDEX IF NOT EXISTS "IX_SLAConfiguraciones_CategoriaId" ON "SLAConfiguraciones"("CategoriaId");

-- Usuarios
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Usuarios_TenantId_Email" ON "Usuarios"("TenantId", "Email");
CREATE INDEX IF NOT EXISTS "IX_Usuarios_RolId"                 ON "Usuarios"("RolId");
CREATE INDEX IF NOT EXISTS "IX_Usuarios_SucursalId"            ON "Usuarios"("SucursalId");
CREATE INDEX IF NOT EXISTS "IX_Usuarios_AreaId"                ON "Usuarios"("AreaId");

-- Tickets
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Tickets_TenantId_Numero"
    ON "Tickets"("TenantId", "Numero");
CREATE INDEX IF NOT EXISTS "IX_Tickets_TenantId_EstadoId"
    ON "Tickets"("TenantId", "EstadoId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_TenantId_TecnicoAsignadoId"
    ON "Tickets"("TenantId", "TecnicoAsignadoId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_FechaCreacion"       ON "Tickets"("FechaCreacion");
CREATE INDEX IF NOT EXISTS "IX_Tickets_CategoriaId"         ON "Tickets"("CategoriaId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_SubcategoriaId"      ON "Tickets"("SubcategoriaId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_PrioridadId"         ON "Tickets"("PrioridadId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_EstadoId"            ON "Tickets"("EstadoId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_SucursalId"          ON "Tickets"("SucursalId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_AreaId"              ON "Tickets"("AreaId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_UsuarioCreadorId"    ON "Tickets"("UsuarioCreadorId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_TecnicoAsignadoId"   ON "Tickets"("TecnicoAsignadoId");
CREATE INDEX IF NOT EXISTS "IX_Tickets_SupervisorId"        ON "Tickets"("SupervisorId");
-- Índice cubriente para monitoreo de SLA
CREATE INDEX IF NOT EXISTS "IX_Tickets_SLA"
    ON "Tickets"("TenantId", "SLAEstado", "FechaLimiteSLA")
    INCLUDE ("EstadoId") WHERE "FechaLimiteSLA" IS NOT NULL;

-- ComentariosTicket
CREATE INDEX IF NOT EXISTS "IX_ComentariosTicket_TicketId"  ON "ComentariosTicket"("TicketId");
CREATE INDEX IF NOT EXISTS "IX_ComentariosTicket_UsuarioId" ON "ComentariosTicket"("UsuarioId");

-- HistorialTickets
CREATE INDEX IF NOT EXISTS "IX_HistorialTickets_TicketId"  ON "HistorialTickets"("TicketId");
CREATE INDEX IF NOT EXISTS "IX_HistorialTickets_UsuarioId" ON "HistorialTickets"("UsuarioId");

-- AdjuntosTicket
CREATE INDEX IF NOT EXISTS "IX_AdjuntosTicket_TicketId"     ON "AdjuntosTicket"("TicketId");
CREATE INDEX IF NOT EXISTS "IX_AdjuntosTicket_ComentarioId" ON "AdjuntosTicket"("ComentarioId");

-- Notificaciones
CREATE INDEX IF NOT EXISTS "IX_Notificaciones_TenantId_UsuarioId_Leida"
    ON "Notificaciones"("TenantId", "UsuarioId", "Leida");
CREATE INDEX IF NOT EXISTS "IX_Notificaciones_FechaCreacion" ON "Notificaciones"("FechaCreacion");
CREATE INDEX IF NOT EXISTS "IX_Notificaciones_TicketId"      ON "Notificaciones"("TicketId");
CREATE INDEX IF NOT EXISTS "IX_Notificaciones_UsuarioId"     ON "Notificaciones"("UsuarioId");

-- TecnicoCategorias
CREATE UNIQUE INDEX IF NOT EXISTS "IX_TecnicoCategorias_Unique"
    ON "TecnicoCategorias"("TenantId", "TecnicoId", "CategoriaId");
CREATE INDEX IF NOT EXISTS "IX_TecnicoCategorias_TecnicoId"   ON "TecnicoCategorias"("TecnicoId");
CREATE INDEX IF NOT EXISTS "IX_TecnicoCategorias_CategoriaId" ON "TecnicoCategorias"("CategoriaId");

-- Plantillas
CREATE INDEX IF NOT EXISTS "IX_Plantillas_TenantId"    ON "Plantillas"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_Plantillas_CreadoPorId" ON "Plantillas"("CreadoPorId");
CREATE INDEX IF NOT EXISTS "IX_Plantillas_CategoriaId" ON "Plantillas"("CategoriaId");

-- BaseConocimiento
CREATE INDEX IF NOT EXISTS "IX_BaseConocimiento_TenantId_CategoriaId"
    ON "BaseConocimiento"("TenantId", "CategoriaId");
CREATE INDEX IF NOT EXISTS "IX_BaseConocimiento_TenantId_Activo"
    ON "BaseConocimiento"("TenantId", "Activo");
CREATE INDEX IF NOT EXISTS "IX_BaseConocimiento_AutorId"
    ON "BaseConocimiento"("AutorId");
-- Índice GIN para full-text search (usa la columna tsvector generada)
CREATE INDEX IF NOT EXISTS "IX_BaseConocimiento_BusquedaVector"
    ON "BaseConocimiento" USING GIN("BusquedaVector");
-- Índice trigram para búsqueda parcial LIKE '%...%' en Titulo
CREATE INDEX IF NOT EXISTS "IX_BaseConocimiento_Titulo_Trgm"
    ON "BaseConocimiento" USING GIN("Titulo" gin_trgm_ops);

-- ArticulosRelacionados
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ArticulosRelacionados_Unique"
    ON "ArticulosRelacionados"("ArticuloOrigenId", "ArticuloRelacionadoId");
CREATE INDEX IF NOT EXISTS "IX_ArticulosRelacionados_RelacionadoId"
    ON "ArticulosRelacionados"("ArticuloRelacionadoId");

-- EncuestaConfiguraciones
CREATE INDEX IF NOT EXISTS "IX_EncuestaConfiguraciones_TenantId"
    ON "EncuestaConfiguraciones"("TenantId");

-- EncuestaRespuestas
CREATE UNIQUE INDEX IF NOT EXISTS "IX_EncuestaRespuestas_TenantId_TicketId"
    ON "EncuestaRespuestas"("TenantId", "TicketId");
CREATE INDEX IF NOT EXISTS "IX_EncuestaRespuestas_TicketId"  ON "EncuestaRespuestas"("TicketId");
CREATE INDEX IF NOT EXISTS "IX_EncuestaRespuestas_UsuarioId" ON "EncuestaRespuestas"("UsuarioId");
CREATE INDEX IF NOT EXISTS "IX_EncuestaRespuestas_TecnicoId" ON "EncuestaRespuestas"("TecnicoId");

-- Etiquetas
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Etiquetas_TenantId_Nombre"
    ON "Etiquetas"("TenantId", "Nombre");

-- TicketEtiquetas
CREATE UNIQUE INDEX IF NOT EXISTS "IX_TicketEtiquetas_TicketId_EtiquetaId"
    ON "TicketEtiquetas"("TicketId", "EtiquetaId");
CREATE INDEX IF NOT EXISTS "IX_TicketEtiquetas_EtiquetaId"
    ON "TicketEtiquetas"("EtiquetaId");

-- AuditLogs
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_TenantId_Entidad"
    ON "AuditLogs"("TenantId", "Entidad", "EntidadId");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_FechaCreacion" ON "AuditLogs"("FechaCreacion");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_UsuarioId"     ON "AuditLogs"("UsuarioId");
-- Índice GIN sobre JSONB: permite consultas como WHERE "DatosNuevos" @> '{"EstadoId":"..."}'
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_DatosNuevos_GIN"
    ON "AuditLogs" USING GIN("DatosNuevos");


-- ============================================================
-- 4. DATOS SEMILLA
-- ============================================================

-- EstadosTicket  (IDs fijos — datos globales compartidos)
INSERT INTO "EstadosTicket" ("Id", "Nombre", "Color", "EsFinal", "Orden")
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Nuevo',                  '#6B7280', FALSE, 1),
    ('30000000-0000-0000-0000-000000000002', 'Asignado',               '#3B82F6', FALSE, 2),
    ('30000000-0000-0000-0000-000000000003', 'En Proceso',             '#F59E0B', FALSE, 3),
    ('30000000-0000-0000-0000-000000000004', 'Pendiente de Usuario',   '#8B5CF6', FALSE, 4),
    ('30000000-0000-0000-0000-000000000005', 'Pendiente de Proveedor', '#EC4899', FALSE, 5),
    ('30000000-0000-0000-0000-000000000006', 'Resuelto',               '#10B981', FALSE, 6),
    ('30000000-0000-0000-0000-000000000007', 'Cerrado',                '#1F2937', TRUE,  7),
    ('30000000-0000-0000-0000-000000000008', 'Cancelado',              '#EF4444', TRUE,  8)
ON CONFLICT DO NOTHING;

-- Tenant Demo
INSERT INTO "Tenants" ("Id", "Nombre", "Dominio", "ColorPrimario", "Activo", "FechaCreacion")
VALUES ('10000000-0000-0000-0000-000000000001',
        'Empresa Demo', 'demo.deskflow.com', '#3B82F6', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Roles del Tenant Demo
INSERT INTO "Roles" ("Id", "TenantId", "Nombre", "Descripcion")
VALUES
    ('20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Administrador', 'Acceso total al sistema'),
    ('20000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     'Supervisor', 'Asigna tickets y supervisa SLA'),
    ('20000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     'Tecnico', 'Atiende y resuelve tickets'),
    ('20000000-0000-0000-0000-000000000004',
     '10000000-0000-0000-0000-000000000001',
     'Usuario', 'Crea y sigue sus tickets')
ON CONFLICT DO NOTHING;

-- Prioridades
INSERT INTO "Prioridades"
    ("Id", "TenantId", "Nombre", "Color",
     "TiempoRespuestaSLA_Horas", "TiempoResolucionSLA_Horas", "Orden")
VALUES
    ('40000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Crítica', '#EF4444',  1,  4, 1),
    ('40000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     'Alta',    '#F97316',  4,  8, 2),
    ('40000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     'Media',   '#F59E0B',  8, 24, 3),
    ('40000000-0000-0000-0000-000000000004',
     '10000000-0000-0000-0000-000000000001',
     'Baja',    '#10B981', 24, 72, 4)
ON CONFLICT DO NOTHING;

-- Usuario Administrador Demo
-- Contraseña: Admin123!
-- El hash BCrypt se regenera automáticamente al arrancar la API.
-- Para actualizar manualmente, reemplazá el valor del PasswordHash.
INSERT INTO "Usuarios"
    ("Id", "TenantId", "RolId", "Nombre", "Apellido",
     "Email", "PasswordHash", "Activo", "FechaCreacion")
VALUES
    ('50000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     'Admin', 'DeskFlow', 'admin@demo.com',
     '$2a$11$hashed_placeholder_run_api_to_generate',
     TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Categorías y Subcategorías de ejemplo
DO $$
DECLARE
    v_hw  UUID := gen_random_uuid();
    v_sw  UUID := gen_random_uuid();
    v_net UUID := gen_random_uuid();
    v_tid UUID := '10000000-0000-0000-0000-000000000001';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Categorias" WHERE "TenantId" = v_tid) THEN
        INSERT INTO "Categorias" ("Id", "TenantId", "Nombre", "Descripcion", "Icono", "Activo")
        VALUES
            (v_hw,  v_tid, 'Hardware',           'Equipos, impresoras, periféricos',   'cpu',     TRUE),
            (v_sw,  v_tid, 'Software',           'Aplicaciones y sistemas operativos', 'monitor', TRUE),
            (v_net, v_tid, 'Red y Conectividad', 'Internet, VPN, switches',            'wifi',    TRUE);

        INSERT INTO "Subcategorias" ("Id", "TenantId", "CategoriaId", "Nombre", "Activo")
        VALUES
            (gen_random_uuid(), v_tid, v_hw,  'PC de escritorio',       TRUE),
            (gen_random_uuid(), v_tid, v_hw,  'Notebook / Laptop',      TRUE),
            (gen_random_uuid(), v_tid, v_hw,  'Impresora',              TRUE),
            (gen_random_uuid(), v_tid, v_sw,  'Sistema Operativo',      TRUE),
            (gen_random_uuid(), v_tid, v_sw,  'Office / Productividad', TRUE),
            (gen_random_uuid(), v_tid, v_sw,  'Antivirus / Seguridad',  TRUE),
            (gen_random_uuid(), v_tid, v_net, 'Sin acceso a internet',  TRUE),
            (gen_random_uuid(), v_tid, v_net, 'VPN',                    TRUE);
    END IF;
END $$;

-- Configuración de encuesta por defecto
INSERT INTO "EncuestaConfiguraciones"
    ("Id", "TenantId", "Pregunta", "EscalaMinima", "EscalaMaxima", "Activo")
VALUES
    (gen_random_uuid(),
     '10000000-0000-0000-0000-000000000001',
     '¿Cómo evaluaría la atención recibida?',
     1, 5, TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. VISTAS
-- ============================================================

-- ------------------------------------------------------------
-- 5.01  vw_TicketsCompletos
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_TicketsCompletos" AS
SELECT
    t."Id",
    t."TenantId",
    t."Numero",
    t."Asunto",
    t."FechaCreacion",
    t."FechaAsignacion",
    t."FechaResolucion",
    t."FechaCierre",
    t."FechaLimiteSLA",
    t."SLAEstado",
    CASE t."SLAEstado"
        WHEN 0 THEN 'En Tiempo'
        WHEN 1 THEN 'En Riesgo'
        WHEN 2 THEN 'Vencido'
    END                                       AS "SLAEstadoNombre",
    t."TiempoPausadoMinutos",
    e."Id"                                    AS "EstadoId",
    e."Nombre"                                AS "EstadoNombre",
    e."Color"                                 AS "EstadoColor",
    e."EsFinal",
    p."Id"                                    AS "PrioridadId",
    p."Nombre"                                AS "PrioridadNombre",
    p."Color"                                 AS "PrioridadColor",
    p."TiempoResolucionSLA_Horas",
    c."Id"                                    AS "CategoriaId",
    c."Nombre"                                AS "CategoriaNombre",
    sc."Id"                                   AS "SubcategoriaId",
    sc."Nombre"                               AS "SubcategoriaNombre",
    uc."Id"                                   AS "UsuarioCreadorId",
    uc."Nombre" || ' ' || uc."Apellido"       AS "UsuarioCreadorNombre",
    uc."Email"                                AS "UsuarioCreadorEmail",
    ta."Id"                                   AS "TecnicoAsignadoId",
    ta."Nombre" || ' ' || ta."Apellido"       AS "TecnicoAsignadoNombre",
    sv."Id"                                   AS "SupervisorId",
    sv."Nombre" || ' ' || sv."Apellido"       AS "SupervisorNombre",
    su."Nombre"                               AS "SucursalNombre",
    ar."Nombre"                               AS "AreaNombre",
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', et."Id", 'nombre', et."Nombre", 'color', et."Color"))
         FROM "TicketEtiquetas" te2
         JOIN "Etiquetas" et ON et."Id" = te2."EtiquetaId"
         WHERE te2."TicketId" = t."Id"),
        '[]'::json
    )                                         AS "Etiquetas",
    CASE
        WHEN t."FechaCierre" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (t."FechaCierre" - t."FechaCreacion"))::INT / 60
                 - t."TiempoPausadoMinutos"
        WHEN t."FechaResolucion" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (t."FechaResolucion" - t."FechaCreacion"))::INT / 60
                 - t."TiempoPausadoMinutos"
        ELSE EXTRACT(EPOCH FROM (NOW() - t."FechaCreacion"))::INT / 60
             - t."TiempoPausadoMinutos"
    END                                       AS "TiempoActivoMinutos",
    CASE
        WHEN t."FechaLimiteSLA" IS NOT NULL
          AND t."FechaResolucion" IS NULL
          AND t."FechaCierre" IS NULL
            THEN EXTRACT(EPOCH FROM (t."FechaLimiteSLA" - NOW()))::INT / 60
    END                                       AS "MinutosRestantesSLA"
FROM "Tickets" t
JOIN "EstadosTicket"   e  ON e."Id"  = t."EstadoId"
JOIN "Prioridades"     p  ON p."Id"  = t."PrioridadId"
JOIN "Categorias"      c  ON c."Id"  = t."CategoriaId"
LEFT JOIN "Subcategorias" sc ON sc."Id" = t."SubcategoriaId"
JOIN "Usuarios"        uc ON uc."Id" = t."UsuarioCreadorId"
LEFT JOIN "Usuarios"   ta ON ta."Id" = t."TecnicoAsignadoId"
LEFT JOIN "Usuarios"   sv ON sv."Id" = t."SupervisorId"
LEFT JOIN "Sucursales" su ON su."Id" = t."SucursalId"
LEFT JOIN "Areas"      ar ON ar."Id" = t."AreaId";

-- ------------------------------------------------------------
-- 5.02  vw_DashboardPorTenant — KPIs globales
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_DashboardPorTenant" AS
SELECT
    t."TenantId",
    COUNT(*)                                                           AS "TotalTickets",
    COUNT(*) FILTER (WHERE e."EsFinal" = FALSE)                        AS "TicketsAbiertos",
    COUNT(*) FILTER (WHERE e."EsFinal" = TRUE)                         AS "TicketsCerrados",
    COUNT(*) FILTER (WHERE t."SLAEstado" = 2 AND e."EsFinal" = FALSE)  AS "TicketsSLAVencido",
    COUNT(*) FILTER (WHERE t."SLAEstado" = 1 AND e."EsFinal" = FALSE)  AS "TicketsSLAEnRiesgo",
    COUNT(*) FILTER (WHERE t."TecnicoAsignadoId" IS NULL
                       AND e."EsFinal" = FALSE)                        AS "TicketsSinAsignar",
    ROUND(AVG(
        CASE WHEN t."FechaCierre" IS NOT NULL
            THEN (EXTRACT(EPOCH FROM (t."FechaCierre" - t."FechaCreacion"))
                  - t."TiempoPausadoMinutos" * 60) / 3600.0
        END
    )::NUMERIC, 2)                                                     AS "PromHorasResolucion",
    ROUND(AVG(er."Puntuacion")::NUMERIC, 2)                            AS "PromedioSatisfaccion"
FROM "Tickets" t
JOIN "EstadosTicket" e ON e."Id" = t."EstadoId"
LEFT JOIN "EncuestaRespuestas" er
    ON er."TicketId" = t."Id" AND er."TenantId" = t."TenantId"
GROUP BY t."TenantId";

-- ------------------------------------------------------------
-- 5.03  vw_SLAResumen — Tickets activos con estado SLA
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_SLAResumen" AS
SELECT
    t."Id",
    t."TenantId",
    t."Numero",
    t."Asunto",
    p."Nombre"                                AS "Prioridad",
    p."Color"                                 AS "PrioridadColor",
    e."Nombre"                                AS "Estado",
    ta."Nombre" || ' ' || ta."Apellido"       AS "Tecnico",
    t."FechaCreacion",
    t."FechaLimiteSLA",
    t."SLAEstado",
    CASE t."SLAEstado"
        WHEN 0 THEN 'En Tiempo'
        WHEN 1 THEN 'En Riesgo'
        WHEN 2 THEN 'Vencido'
    END                                       AS "SLAEstadoNombre",
    EXTRACT(EPOCH FROM (t."FechaLimiteSLA" - NOW()))::INT / 60 AS "MinutosRestantes",
    p."TiempoResolucionSLA_Horas"             AS "HorasSLATotal"
FROM "Tickets" t
JOIN "EstadosTicket" e  ON e."Id"  = t."EstadoId"
JOIN "Prioridades"   p  ON p."Id"  = t."PrioridadId"
LEFT JOIN "Usuarios" ta ON ta."Id" = t."TecnicoAsignadoId"
WHERE e."EsFinal" = FALSE;

-- ------------------------------------------------------------
-- 5.04  vw_EncuestasPromedioPorTecnico
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_EncuestasPromedioPorTecnico" AS
SELECT
    er."TenantId",
    er."TecnicoId",
    u."Nombre" || ' ' || u."Apellido"       AS "TecnicoNombre",
    COUNT(*)                                AS "TotalEncuestas",
    COUNT(*) FILTER (WHERE er."Puntuacion" IS NOT NULL) AS "Respondidas",
    ROUND(AVG(er."Puntuacion")::NUMERIC, 2) AS "PromedioGeneral",
    MIN(er."Puntuacion")                    AS "PuntMinima",
    MAX(er."Puntuacion")                    AS "PuntMaxima"
FROM "EncuestaRespuestas" er
JOIN "Usuarios" u ON u."Id" = er."TecnicoId"
WHERE er."TecnicoId" IS NOT NULL
GROUP BY er."TenantId", er."TecnicoId", u."Nombre", u."Apellido";

-- ------------------------------------------------------------
-- 5.05  vw_TicketsPorTecnico — Carga de trabajo
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_TicketsPorTecnico" AS
SELECT
    t."TenantId",
    t."TecnicoAsignadoId"                     AS "TecnicoId",
    u."Nombre" || ' ' || u."Apellido"         AS "TecnicoNombre",
    COUNT(*)                                  AS "TotalAsignados",
    COUNT(*) FILTER (WHERE e."EsFinal" = FALSE) AS "Abiertos",
    COUNT(*) FILTER (WHERE e."EsFinal" = TRUE)  AS "Cerrados",
    COUNT(*) FILTER (WHERE t."SLAEstado" = 2
                      AND e."EsFinal" = FALSE)  AS "SLAVencidos",
    ROUND(AVG(
        CASE WHEN t."FechaCierre" IS NOT NULL
            THEN (EXTRACT(EPOCH FROM (t."FechaCierre" - t."FechaCreacion"))
                  - t."TiempoPausadoMinutos" * 60) / 3600.0
        END
    )::NUMERIC, 2)                            AS "PromHorasResolucion"
FROM "Tickets" t
JOIN "EstadosTicket" e ON e."Id" = t."EstadoId"
JOIN "Usuarios"      u ON u."Id" = t."TecnicoAsignadoId"
WHERE t."TecnicoAsignadoId" IS NOT NULL
GROUP BY t."TenantId", t."TecnicoAsignadoId", u."Nombre", u."Apellido";

-- ------------------------------------------------------------
-- 5.06  vw_EtiquetasEstadisticas
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_EtiquetasEstadisticas" AS
SELECT
    et."TenantId",
    et."Id"       AS "EtiquetaId",
    et."Nombre"   AS "EtiquetaNombre",
    et."Color",
    COUNT(te."Id") AS "CantidadTickets"
FROM "Etiquetas" et
LEFT JOIN "TicketEtiquetas" te ON te."EtiquetaId" = et."Id"
WHERE et."Activo" = TRUE
GROUP BY et."TenantId", et."Id", et."Nombre", et."Color";

-- ------------------------------------------------------------
-- 5.07  vw_UsuariosConRoles — Gestión de asignación de roles
--       Muestra cada usuario con su rol actual, métricas y la
--       lista de roles disponibles del tenant (para un selector).
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_UsuariosConRoles" AS
SELECT
    u."Id"                               AS "UsuarioId",
    u."TenantId",
    u."Nombre",
    u."Apellido",
    u."Nombre" || ' ' || u."Apellido"    AS "NombreCompleto",
    u."Email",
    u."Activo",
    u."FechaCreacion",
    r."Id"                               AS "RolId",
    r."Nombre"                           AS "RolNombre",
    r."Descripcion"                      AS "RolDescripcion",
    (SELECT json_agg(json_build_object(
                'id',          rr."Id",
                'nombre',      rr."Nombre",
                'descripcion', rr."Descripcion",
                'esActual',    (rr."Id" = u."RolId")
             ) ORDER BY rr."Nombre")
     FROM "Roles" rr
     WHERE rr."TenantId" = u."TenantId") AS "RolesDisponibles",
    a."Id"                               AS "AreaId",
    a."Nombre"                           AS "AreaNombre",
    s."Id"                               AS "SucursalId",
    s."Nombre"                           AS "SucursalNombre",
    (SELECT COUNT(*) FROM "Tickets" tk
     JOIN "EstadosTicket" ek ON ek."Id" = tk."EstadoId"
     WHERE tk."TecnicoAsignadoId" = u."Id"
       AND ek."EsFinal" = FALSE)         AS "TicketsActivosAsignados",
    (SELECT COUNT(*) FROM "Tickets" tk
     WHERE tk."UsuarioCreadorId" = u."Id") AS "TotalTicketsCreados",
    (SELECT ROUND(AVG(er."Puntuacion")::NUMERIC, 2)
     FROM "EncuestaRespuestas" er
     WHERE er."TecnicoId" = u."Id"
       AND er."Puntuacion" IS NOT NULL)  AS "PromedioSatisfaccion"
FROM "Usuarios" u
JOIN "Roles"           r ON r."Id" = u."RolId"
LEFT JOIN "Areas"      a ON a."Id" = u."AreaId"
LEFT JOIN "Sucursales" s ON s."Id" = u."SucursalId";

-- ------------------------------------------------------------
-- 5.08  vw_BaseConocimientoActiva
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "vw_BaseConocimientoActiva" AS
SELECT
    b."Id",
    b."TenantId",
    b."Titulo",
    b."CategoriaId",
    c."Nombre"                               AS "CategoriaNombre",
    sc."Nombre"                              AS "SubcategoriaNombre",
    b."Etiquetas",
    b."Vistas",
    b."EsPublico",
    b."FechaCreacion",
    b."FechaActualizacion",
    u."Nombre" || ' ' || u."Apellido"        AS "AutorNombre",
    (SELECT COUNT(*) FROM "ArticulosRelacionados" ar
     WHERE ar."ArticuloOrigenId" = b."Id")   AS "CantidadRelacionados"
FROM "BaseConocimiento" b
JOIN "Categorias"     c  ON c."Id"  = b."CategoriaId"
LEFT JOIN "Subcategorias" sc ON sc."Id" = b."SubcategoriaId"
JOIN "Usuarios"       u  ON u."Id"  = b."AutorId"
WHERE b."Activo" = TRUE;


-- ============================================================
-- 6. FUNCIONES
-- ============================================================

-- ------------------------------------------------------------
-- 6.01  fn_tiempo_resolucion_horas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tiempo_resolucion_horas(
    p_ticket_id       UUID,
    p_incluir_pausado BOOLEAN DEFAULT FALSE
)
RETURNS NUMERIC
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_fecha_creacion TIMESTAMPTZ;
    v_fecha_fin      TIMESTAMPTZ;
    v_tiempo_pausado INTEGER;
    v_total_segundos NUMERIC;
BEGIN
    SELECT "FechaCreacion",
           COALESCE("FechaCierre", "FechaResolucion"),
           "TiempoPausadoMinutos"
    INTO   v_fecha_creacion, v_fecha_fin, v_tiempo_pausado
    FROM   "Tickets"
    WHERE  "Id" = p_ticket_id;

    IF v_fecha_fin IS NULL THEN
        v_fecha_fin := NOW();
    END IF;

    v_total_segundos := EXTRACT(EPOCH FROM (v_fecha_fin - v_fecha_creacion));

    IF NOT p_incluir_pausado THEN
        v_total_segundos := v_total_segundos - (v_tiempo_pausado * 60);
    END IF;

    RETURN ROUND((v_total_segundos / 3600.0)::NUMERIC, 2);
END;
$$;

-- ------------------------------------------------------------
-- 6.02  fn_sla_estado_color
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sla_estado_color(p_estado INTEGER)
RETURNS VARCHAR(7)
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_estado
        WHEN 0 THEN '#10B981'
        WHEN 1 THEN '#F59E0B'
        WHEN 2 THEN '#EF4444'
        ELSE '#6B7280'
    END;
$$;

-- ------------------------------------------------------------
-- 6.03  fn_etiquetas_ticket_csv
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_etiquetas_ticket_csv(p_ticket_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
    SELECT NULLIF(
        STRING_AGG(e."Nombre", ', ' ORDER BY e."Nombre"),
        ''
    )
    FROM "TicketEtiquetas" te
    JOIN "Etiquetas" e ON e."Id" = te."EtiquetaId"
    WHERE te."TicketId" = p_ticket_id;
$$;

-- ------------------------------------------------------------
-- 6.04  fn_buscar_conocimiento  (usa índice GIN tsvector)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_buscar_conocimiento(
    p_tenant_id UUID,
    p_query     TEXT,
    p_limite    INTEGER DEFAULT 20
)
RETURNS TABLE (
    "Id"         UUID,
    "Titulo"     VARCHAR,
    "Vistas"     INTEGER,
    "Relevancia" REAL
)
LANGUAGE sql STABLE
AS $$
    SELECT
        b."Id",
        b."Titulo",
        b."Vistas",
        ts_rank(b."BusquedaVector", plainto_tsquery('spanish', p_query)) AS "Relevancia"
    FROM "BaseConocimiento" b
    WHERE b."TenantId" = p_tenant_id
      AND b."Activo" = TRUE
      AND b."BusquedaVector" @@ plainto_tsquery('spanish', p_query)
    ORDER BY "Relevancia" DESC, b."Vistas" DESC
    LIMIT p_limite;
$$;

-- ------------------------------------------------------------
-- 6.05  fn_resumen_tickets_por_periodo  (usable con SELECT)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_resumen_tickets_por_periodo(
    p_tenant_id   UUID,
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE (
    "Anio"                    INTEGER,
    "Mes"                     INTEGER,
    "Estado"                  VARCHAR,
    "Prioridad"               VARCHAR,
    "Cantidad"                BIGINT,
    "PromedioHorasResolucion" NUMERIC,
    "ConSLAVencido"           BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        EXTRACT(YEAR  FROM t."FechaCreacion")::INTEGER,
        EXTRACT(MONTH FROM t."FechaCreacion")::INTEGER,
        e."Nombre",
        p."Nombre",
        COUNT(*),
        ROUND(AVG(fn_tiempo_resolucion_horas(t."Id", FALSE)), 2),
        COUNT(*) FILTER (WHERE t."SLAEstado" = 2)
    FROM "Tickets" t
    JOIN "EstadosTicket" e ON e."Id" = t."EstadoId"
    JOIN "Prioridades"   p ON p."Id" = t."PrioridadId"
    WHERE t."TenantId"      = p_tenant_id
      AND t."FechaCreacion" >= p_fecha_desde::TIMESTAMPTZ
      AND t."FechaCreacion" <  (p_fecha_hasta + 1)::TIMESTAMPTZ
    GROUP BY 1, 2, e."Nombre", p."Nombre"
    ORDER BY 1, 2, e."Nombre", p."Nombre";
$$;


-- ============================================================
-- 7. STORED PROCEDURES
-- ============================================================

-- ------------------------------------------------------------
-- 7.01  sp_actualizar_sla_vencidos
--       Llamar desde el background service .NET o un pg_cron.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_actualizar_sla_vencidos()
LANGUAGE plpgsql
AS $$
DECLARE
    v_vencidos  INTEGER := 0;
    v_en_riesgo INTEGER := 0;
BEGIN
    UPDATE "Tickets" t
    SET    "SLAEstado" = 2
    FROM   "EstadosTicket" e
    WHERE  e."Id" = t."EstadoId"
      AND  e."EsFinal" = FALSE
      AND  t."FechaLimiteSLA" IS NOT NULL
      AND  t."FechaLimiteSLA" < NOW()
      AND  t."SLAEstado" <> 2;
    GET DIAGNOSTICS v_vencidos = ROW_COUNT;

    UPDATE "Tickets" t
    SET    "SLAEstado" = 1
    FROM   "EstadosTicket" e, "Prioridades" p
    WHERE  e."Id" = t."EstadoId"
      AND  p."Id" = t."PrioridadId"
      AND  e."EsFinal" = FALSE
      AND  t."FechaLimiteSLA" IS NOT NULL
      AND  t."FechaLimiteSLA" >= NOW()
      AND  t."SLAEstado" = 0
      AND  EXTRACT(EPOCH FROM (t."FechaLimiteSLA" - NOW())) <
           (p."TiempoResolucionSLA_Horas" * 3600 * 0.20);
    GET DIAGNOSTICS v_en_riesgo = ROW_COUNT;

    RAISE NOTICE 'SLA actualizado: % vencidos, % en riesgo', v_vencidos, v_en_riesgo;
END;
$$;

-- ------------------------------------------------------------
-- 7.02  sp_limpiar_notificaciones_antiguas
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_limpiar_notificaciones_antiguas(
    p_dias_retencion INTEGER DEFAULT 90
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_eliminadas INTEGER;
BEGIN
    DELETE FROM "Notificaciones"
    WHERE "Leida" = TRUE
      AND "FechaCreacion" < NOW() - (p_dias_retencion || ' days')::INTERVAL;
    GET DIAGNOSTICS v_eliminadas = ROW_COUNT;
    RAISE NOTICE 'Notificaciones eliminadas: %', v_eliminadas;
END;
$$;

-- ------------------------------------------------------------
-- 7.03  sp_limpiar_audit_logs_antiguos
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_limpiar_audit_logs_antiguos(
    p_dias_retencion INTEGER DEFAULT 365
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_eliminados INTEGER;
BEGIN
    DELETE FROM "AuditLogs"
    WHERE "FechaCreacion" < NOW() - (p_dias_retencion || ' days')::INTERVAL;
    GET DIAGNOSTICS v_eliminados = ROW_COUNT;
    RAISE NOTICE 'AuditLogs eliminados: %', v_eliminados;
END;
$$;

-- ------------------------------------------------------------
-- 7.04  sp_resumen_tickets_por_periodo
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_resumen_tickets_por_periodo(
    p_tenant_id   UUID,
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE 'Resumen de tickets del % al % para tenant %',
        p_fecha_desde, p_fecha_hasta, p_tenant_id;
END;
$$;


-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- 8.01  Auto-setea FechaResolucion/FechaCierre al cambiar estado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tickets_set_fechas_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."EstadoId" = OLD."EstadoId" THEN
        RETURN NEW;
    END IF;

    -- Pasa a Resuelto
    IF NEW."EstadoId" = '30000000-0000-0000-0000-000000000006'
       AND NEW."FechaResolucion" IS NULL
    THEN
        NEW."FechaResolucion" := NOW();
    END IF;

    -- Pasa a Cerrado o Cancelado
    IF NEW."EstadoId" IN (
        '30000000-0000-0000-0000-000000000007',
        '30000000-0000-0000-0000-000000000008'
    ) AND NEW."FechaCierre" IS NULL
    THEN
        NEW."FechaCierre" := NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tickets_set_fechas_estado ON "Tickets";
CREATE TRIGGER trg_tickets_set_fechas_estado
    BEFORE UPDATE ON "Tickets"
    FOR EACH ROW
    EXECUTE FUNCTION fn_tickets_set_fechas_estado();

-- ------------------------------------------------------------
-- 8.02  Valida puntuación de encuesta y setea FechaRespuesta
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_encuesta_validar_puntuacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_min INTEGER;
    v_max INTEGER;
BEGIN
    IF NEW."Puntuacion" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "EscalaMinima", "EscalaMaxima"
    INTO   v_min, v_max
    FROM   "EncuestaConfiguraciones"
    WHERE  "TenantId" = NEW."TenantId"
      AND  "Activo" = TRUE
    LIMIT 1;

    IF FOUND AND (NEW."Puntuacion" < v_min OR NEW."Puntuacion" > v_max) THEN
        RAISE EXCEPTION 'Puntuación % fuera del rango permitido [%, %]',
            NEW."Puntuacion", v_min, v_max;
    END IF;

    IF OLD."Puntuacion" IS NULL AND NEW."Puntuacion" IS NOT NULL THEN
        NEW."FechaRespuesta" := NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_encuesta_validar_puntuacion ON "EncuestaRespuestas";
CREATE TRIGGER trg_encuesta_validar_puntuacion
    BEFORE INSERT OR UPDATE ON "EncuestaRespuestas"
    FOR EACH ROW
    EXECUTE FUNCTION fn_encuesta_validar_puntuacion();

-- ------------------------------------------------------------
-- 8.03  Actualiza FechaActualizacion en BaseConocimiento
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_base_conocimiento_update_ts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW."FechaActualizacion" := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_base_conocimiento_fecha_actualizacion ON "BaseConocimiento";
CREATE TRIGGER trg_base_conocimiento_fecha_actualizacion
    BEFORE UPDATE ON "BaseConocimiento"
    FOR EACH ROW
    EXECUTE FUNCTION fn_base_conocimiento_update_ts();


-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
--    Multi-tenancy a nivel de base de datos.
--    La app setea: SET LOCAL app.tenant_id = '<guid>';
--    al inicio de cada transacción.
-- ============================================================

ALTER TABLE "Roles"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuarios"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Areas"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categorias"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subcategorias"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prioridades"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sucursales"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SLAConfiguraciones"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tickets"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notificaciones"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TecnicoCategorias"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plantillas"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BaseConocimiento"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EncuestaConfiguraciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EncuestaRespuestas"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Etiquetas"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLogs"               ENABLE ROW LEVEL SECURITY;

-- Política para el rol de la app (DML completo, filtrado por tenant)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'Roles', 'Usuarios', 'Areas', 'Categorias', 'Subcategorias',
        'Prioridades', 'Sucursales', 'SLAConfiguraciones', 'Tickets',
        'Notificaciones', 'TecnicoCategorias', 'Plantillas',
        'BaseConocimiento', 'EncuestaConfiguraciones', 'EncuestaRespuestas',
        'Etiquetas', 'AuditLogs'
    ] LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS rls_tenant ON %I;
             CREATE POLICY rls_tenant ON %I
             FOR ALL TO deskflow_app
             USING ("TenantId" = current_setting(''app.tenant_id'', TRUE)::UUID);',
            t, t
        );
    END LOOP;
END $$;

-- Política para el rol readonly (solo SELECT)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'Roles', 'Usuarios', 'Areas', 'Categorias', 'Subcategorias',
        'Prioridades', 'Sucursales', 'Tickets', 'Notificaciones',
        'BaseConocimiento', 'EncuestaRespuestas', 'Etiquetas', 'AuditLogs'
    ] LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS rls_readonly ON %I;
             CREATE POLICY rls_readonly ON %I
             FOR SELECT TO deskflow_readonly
             USING ("TenantId" = current_setting(''app.tenant_id'', TRUE)::UUID);',
            t, t
        );
    END LOOP;
END $$;

-- Forzar RLS incluso para el dueño de la tabla
ALTER TABLE "Roles"    FORCE ROW LEVEL SECURITY;
ALTER TABLE "Usuarios" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Tickets"  FORCE ROW LEVEL SECURITY;

-- Para que deskflow_admin omita RLS (requiere superuser):
-- ALTER ROLE deskflow_admin BYPASSRLS;


-- ============================================================
-- 10. PERMISOS DE TABLAS PARA LOS ROLES
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO deskflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO deskflow_app;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO deskflow_readonly;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deskflow_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deskflow_admin;


-- ============================================================
-- 11. EF MIGRATIONS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId"    VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260324000000_InitialPostgres', '9.0.4')
ON CONFLICT DO NOTHING;


-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  DeskFlowDb lista y configurada';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  Tenant demo  : Empresa Demo';
    RAISE NOTICE '  Admin email  : admin@demo.com';
    RAISE NOTICE '  Admin pass   : Admin123!';
    RAISE NOTICE '  (Arrancar la API para regenerar el hash)';
    RAISE NOTICE '';
    RAISE NOTICE '  Tablas       : 24';
    RAISE NOTICE '  Vistas       :  8';
    RAISE NOTICE '  Funciones    :  5';
    RAISE NOTICE '  Procedures   :  4';
    RAISE NOTICE '  Triggers     :  3';
    RAISE NOTICE '  RLS policies : 17 tablas';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  Connection string:';
    RAISE NOTICE '  Host=localhost;Port=5432;';
    RAISE NOTICE '  Database=DeskFlowDb;';
    RAISE NOTICE '  Username=deskflow_app;';
    RAISE NOTICE '  Password=DeskFlow2024!';
    RAISE NOTICE '================================================';
END $$;
