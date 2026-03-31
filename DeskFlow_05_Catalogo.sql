-- ============================================================
--  DeskFlow – PASO 5: Catálogo de Servicios (estilo InvGate)
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
--  Departamentos: IT, RRHH, Compras
--  14 servicios con formularios dinámicos y tareas automáticas
-- ============================================================

-- ── UUIDs de referencia (ya existen en la DB) ────────────────
-- Tenant:           10000000-0000-0000-0000-000000000001
-- Prioridad Crítica: 40000000-0000-0000-0000-000000000001
-- Prioridad Alta:    40000000-0000-0000-0000-000000000002
-- Prioridad Media:   40000000-0000-0000-0000-000000000003
-- Prioridad Baja:    40000000-0000-0000-0000-000000000004

-- ── Nuevas UUIDs del catálogo ─────────────────────────────────
-- Departamentos:    A0000000-0000-0000-0000-00000000000{1-3}
-- Categorías:       B0000000-0000-0000-0000-00000000000{1-3}
-- Servicios IT:     C0000000-0000-0000-0000-00000000000{1-6}
-- Servicios RRHH:   C0000000-0000-0000-0000-00000000000{7-B}
-- Servicios Compras:C0000000-0000-0000-0000-00000000000{C-E}

-- ── 1. Tabla Departamentos ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "Departamentos" (
    "Id"          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"    uuid         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Nombre"      varchar(100) NOT NULL,
    "Descripcion" text,
    "Icono"       varchar(10),
    "Color"       varchar(20),
    "Orden"       integer      NOT NULL DEFAULT 0,
    "Activo"      boolean      NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS "IX_Departamentos_TenantId" ON "Departamentos"("TenantId");

-- ── 2. Tabla ServiciosCatalogo ───────────────────────────────
CREATE TABLE IF NOT EXISTS "ServiciosCatalogo" (
    "Id"                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"            uuid         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "DepartamentoId"      uuid         NOT NULL REFERENCES "Departamentos"("Id") ON DELETE CASCADE,
    "CategoriaId"         uuid         REFERENCES "Categorias"("Id") ON DELETE SET NULL,
    "PrioridadId"         uuid         REFERENCES "Prioridades"("Id") ON DELETE SET NULL,
    "Nombre"              varchar(200) NOT NULL,
    "Descripcion"         text,
    "Icono"               varchar(10),
    "Color"               varchar(20),
    "Orden"               integer      NOT NULL DEFAULT 0,
    "TiempoEntregaHoras"  integer,
    "RequiereAprobacion"  boolean      NOT NULL DEFAULT false,
    "Activo"              boolean      NOT NULL DEFAULT true,
    "EsPublico"           boolean      NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS "IX_ServiciosCatalogo_TenantId"       ON "ServiciosCatalogo"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_ServiciosCatalogo_DepartamentoId" ON "ServiciosCatalogo"("DepartamentoId");

-- ── 3. Tabla CamposServicio ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "CamposServicio" (
    "Id"           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     uuid         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "ServicioId"   uuid         NOT NULL REFERENCES "ServiciosCatalogo"("Id") ON DELETE CASCADE,
    "Nombre"       varchar(100) NOT NULL,
    "Etiqueta"     varchar(200) NOT NULL,
    "TipoCampo"    varchar(30)  NOT NULL,
    "Placeholder"  varchar(200),
    "Requerido"    boolean      NOT NULL DEFAULT false,
    "Orden"        integer      NOT NULL DEFAULT 0,
    "OpcionesJson" text
);

CREATE INDEX IF NOT EXISTS "IX_CamposServicio_ServicioId" ON "CamposServicio"("ServicioId");

-- ── 4. Tabla PlantillasTareas ────────────────────────────────
CREATE TABLE IF NOT EXISTS "PlantillasTareas" (
    "Id"           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"     uuid         NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "ServicioId"   uuid         NOT NULL REFERENCES "ServiciosCatalogo"("Id") ON DELETE CASCADE,
    "Titulo"       varchar(200) NOT NULL,
    "Descripcion"  text,
    "Orden"        integer      NOT NULL DEFAULT 0,
    "AsignarARol"  varchar(50)
);

CREATE INDEX IF NOT EXISTS "IX_PlantillasTareas_ServicioId" ON "PlantillasTareas"("ServicioId");

-- ── 5. Tabla RespuestasFormulario ────────────────────────────
CREATE TABLE IF NOT EXISTS "RespuestasFormulario" (
    "Id"        uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId"  uuid  NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "TicketId"  uuid  NOT NULL REFERENCES "Tickets"("Id") ON DELETE CASCADE,
    "CampoId"   uuid  NOT NULL REFERENCES "CamposServicio"("Id") ON DELETE CASCADE,
    "Valor"     text
);

CREATE INDEX IF NOT EXISTS "IX_RespuestasFormulario_TicketId" ON "RespuestasFormulario"("TicketId");

-- ── 6. Columna ServicioId en Tickets ────────────────────────
ALTER TABLE "Tickets"
    ADD COLUMN IF NOT EXISTS "ServicioId" uuid REFERENCES "ServiciosCatalogo"("Id") ON DELETE SET NULL;

-- ── 7. Actualizar tabla Tareas (si falta FK a Usuarios) ──────
-- La tabla Tareas se creó en el script 04; aquí confirmamos que existe
-- y agregamos las FK si no están.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='Tareas' AND column_name='CreadoPorId'
    ) THEN
        ALTER TABLE "Tareas" ADD COLUMN "CreadoPorId" uuid REFERENCES "Usuarios"("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- ── 8. SEED DATA ─────────────────────────────────────────────
DO $$
DECLARE
    v_tid  uuid := '10000000-0000-0000-0000-000000000001';
    -- Departamentos
    v_dep_it     uuid := 'A0000000-0000-0000-0000-000000000001';
    v_dep_rrhh   uuid := 'A0000000-0000-0000-0000-000000000002';
    v_dep_comp   uuid := 'A0000000-0000-0000-0000-000000000003';
    -- Categorías para tickets del catálogo
    v_cat_it     uuid := 'B0000000-0000-0000-0000-000000000001';
    v_cat_rrhh   uuid := 'B0000000-0000-0000-0000-000000000002';
    v_cat_comp   uuid := 'B0000000-0000-0000-0000-000000000003';
    -- Prioridades
    v_pri_alta   uuid := '40000000-0000-0000-0000-000000000002';
    v_pri_media  uuid := '40000000-0000-0000-0000-000000000003';
    v_pri_baja   uuid := '40000000-0000-0000-0000-000000000004';
    -- Servicios IT
    v_svc_01 uuid := 'C0000000-0000-0000-0000-000000000001'; -- Alta de Usuario
    v_svc_02 uuid := 'C0000000-0000-0000-0000-000000000002'; -- Baja de Usuario
    v_svc_03 uuid := 'C0000000-0000-0000-0000-000000000003'; -- Solicitud de Hardware
    v_svc_04 uuid := 'C0000000-0000-0000-0000-000000000004'; -- Acceso a Sistema
    v_svc_05 uuid := 'C0000000-0000-0000-0000-000000000005'; -- Instalación de Software
    v_svc_06 uuid := 'C0000000-0000-0000-0000-000000000006'; -- Soporte Técnico General
    -- Servicios RRHH
    v_svc_07 uuid := 'C0000000-0000-0000-0000-000000000007'; -- Alta de Empleado
    v_svc_08 uuid := 'C0000000-0000-0000-0000-000000000008'; -- Solicitud de Vacaciones
    v_svc_09 uuid := 'C0000000-0000-0000-0000-000000000009'; -- Certificado Laboral
    v_svc_10 uuid := 'C0000000-0000-0000-0000-00000000000A'; -- Cambio de Datos Personales
    v_svc_11 uuid := 'C0000000-0000-0000-0000-00000000000B'; -- Solicitud de Capacitación
    -- Servicios Compras
    v_svc_12 uuid := 'C0000000-0000-0000-0000-00000000000C'; -- Solicitud de Compra
    v_svc_13 uuid := 'C0000000-0000-0000-0000-00000000000D'; -- Reembolso de Gastos
    v_svc_14 uuid := 'C0000000-0000-0000-0000-00000000000E'; -- Servicio Externo

BEGIN

-- ── Departamentos ─────────────────────────────────────────
INSERT INTO "Departamentos" ("Id","TenantId","Nombre","Descripcion","Icono","Color","Orden")
VALUES
    (v_dep_it,   v_tid, 'Tecnología (IT)', 'Soporte técnico, hardware, software y accesos', '💻', '#3B82F6', 1),
    (v_dep_rrhh, v_tid, 'Recursos Humanos', 'Gestión de personal, vacaciones y certificaciones', '👥', '#8B5CF6', 2),
    (v_dep_comp, v_tid, 'Compras', 'Solicitudes de compra, reembolsos y servicios externos', '🛒', '#10B981', 3)
ON CONFLICT ("Id") DO NOTHING;

-- ── Categorías (para vincular tickets) ───────────────────
INSERT INTO "Categorias" ("Id","TenantId","Nombre","Descripcion","Icono","Activo")
VALUES
    (v_cat_it,   v_tid, 'Solicitudes IT',    'Solicitudes generadas desde el catálogo IT',    'laptop',   TRUE),
    (v_cat_rrhh, v_tid, 'Solicitudes RRHH',  'Solicitudes generadas desde el catálogo RRHH',  'users',    TRUE),
    (v_cat_comp, v_tid, 'Solicitudes Compras','Solicitudes generadas desde el catálogo Compras','shopping-cart', TRUE)
ON CONFLICT ("Id") DO NOTHING;

-- ── SERVICIOS IT ──────────────────────────────────────────

-- S01: Alta de Usuario
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_01, v_tid, v_dep_it, v_cat_it, v_pri_alta,
    'Alta de Usuario',
    'Creación de cuenta corporativa en Active Directory, configuración de email y accesos a sistemas para un nuevo colaborador.',
    '👤', '#3B82F6', 1, 24, true, false)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_01, 'nombre_empleado', 'Nombre completo del empleado', 'texto', 'Ej: Juan García López', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'cargo', 'Cargo / Puesto', 'texto', 'Ej: Analista de Sistemas', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'departamento', 'Departamento / Área', 'texto', 'Ej: IT, RRHH, Ventas', true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'fecha_ingreso', 'Fecha de ingreso', 'fecha', NULL, true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'tipo_contrato', 'Tipo de contrato', 'select', NULL, true, 5, '["Relación de dependencia","Contratado","Pasante","Freelance"]'),
    (gen_random_uuid(), v_tid, v_svc_01, 'supervisor', 'Supervisor directo', 'texto', 'Nombre del supervisor', true, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'email_deseado', 'Email corporativo deseado', 'email', 'nombre@empresa.com', false, 7, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'sistemas_acceso', 'Sistemas / aplicaciones que necesita acceder', 'textarea', 'Listá los sistemas que necesita acceder', false, 8, NULL),
    (gen_random_uuid(), v_tid, v_svc_01, 'observaciones', 'Observaciones adicionales', 'textarea', NULL, false, 9, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_01, 'Crear cuenta en Active Directory', 'Crear usuario en AD con los datos del formulario y asignar grupos correspondientes', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_01, 'Configurar cuenta de email corporativo', 'Crear y configurar el email corporativo del nuevo empleado', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_01, 'Asignar accesos a sistemas solicitados', 'Dar de alta al usuario en los sistemas y aplicaciones listados', 3, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_01, 'Entregar credenciales al empleado', 'Generar credenciales iniciales y entregar al supervisor o directamente al empleado', 4, 'Tecnico')
ON CONFLICT DO NOTHING;

-- S02: Baja de Usuario
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_02, v_tid, v_dep_it, v_cat_it, v_pri_alta,
    'Baja de Usuario',
    'Desactivación de cuenta corporativa, revocación de accesos y recepción de equipos de un empleado que se desvincula.',
    '🚪', '#EF4444', 2, 4, true, false)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_02, 'nombre_empleado', 'Nombre completo del empleado', 'texto', NULL, true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_02, 'departamento', 'Departamento / Área', 'texto', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_02, 'fecha_baja', 'Fecha efectiva de baja', 'fecha', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_02, 'motivo', 'Motivo de la baja', 'select', NULL, true, 4, '["Renuncia voluntaria","Desvinculación por empresa","Jubilación","Vencimiento de contrato","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_02, 'devolucion_equipos', '¿El empleado devolverá equipos?', 'checkbox', NULL, false, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_02, 'equipos_a_devolver', 'Detalle de equipos a devolver', 'textarea', 'Laptop, mouse, teléfono, etc.', false, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_02, 'observaciones', 'Observaciones', 'textarea', NULL, false, 7, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_02, 'Deshabilitar cuenta en Active Directory', 'Deshabilitar el usuario en AD y moverlo a la OU de inactivos', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_02, 'Revocar accesos a todos los sistemas', 'Eliminar o deshabilitar accesos en todos los sistemas y aplicaciones', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_02, 'Recibir equipos y materiales del empleado', 'Coordinar la devolución y verificar el estado de los equipos', 3, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_02, 'Archivar datos y documentación', 'Realizar backup de datos y archivar según política de retención', 4, 'Tecnico')
ON CONFLICT DO NOTHING;

-- S03: Solicitud de Hardware
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_03, v_tid, v_dep_it, v_cat_it, v_pri_media,
    'Solicitud de Hardware',
    'Solicitud de equipos de computación, periféricos o accesorios. Incluye laptops, monitores, teclados, mouse, auriculares, impresoras y más.',
    '🖥️', '#F97316', 3, 72, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_03, 'tipo_equipo', 'Tipo de equipo', 'select', NULL, true, 1, '["Laptop / Notebook","PC de escritorio","Monitor","Mouse","Teclado","Auriculares / Headset","Impresora","Teléfono IP","Tablet","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_03, 'cantidad', 'Cantidad', 'numero', '1', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_03, 'para_quien', 'Para quién es el equipo', 'texto', 'Nombre del usuario o área', true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_03, 'justificacion', 'Justificación del pedido', 'textarea', '¿Por qué se necesita este equipo?', true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_03, 'urgencia', 'Nivel de urgencia', 'select', NULL, true, 5, '["Normal – puede esperar","Urgente – esta semana","Crítica – necesario hoy"]'),
    (gen_random_uuid(), v_tid, v_svc_03, 'especificaciones', 'Especificaciones técnicas deseadas', 'textarea', 'RAM, procesador, almacenamiento, etc.', false, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_03, 'fecha_requerida', 'Fecha en que lo necesita', 'fecha', NULL, false, 7, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_03, 'Verificar disponibilidad en stock', 'Revisar si existe el equipo solicitado en el inventario', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_03, 'Gestionar compra si no hay stock', 'Si no está disponible, coordinar con Compras para adquirirlo', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_03, 'Configurar y preparar el equipo', 'Instalar sistema operativo, software base y configurar el equipo', 3, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_03, 'Realizar entrega con firma de recepción', 'Entregar el equipo al solicitante y registrar la entrega', 4, 'Tecnico')
ON CONFLICT DO NOTHING;

-- S04: Acceso a Sistema
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_04, v_tid, v_dep_it, v_cat_it, v_pri_media,
    'Acceso a Sistema / Aplicación',
    'Solicitud de acceso a un sistema interno, aplicación de gestión o plataforma empresarial.',
    '🔑', '#8B5CF6', 4, 8, false, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_04, 'sistema', 'Sistema o aplicación', 'texto', 'Ej: ERP, CRM, Intranet, Drive', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_04, 'tipo_acceso', 'Tipo de acceso requerido', 'select', NULL, true, 2, '["Solo lectura","Lectura y escritura","Administrador","Acceso temporal (indicar fecha)"]'),
    (gen_random_uuid(), v_tid, v_svc_04, 'para_quien', 'Para quién es el acceso', 'texto', 'Nombre del usuario', true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_04, 'justificacion', 'Justificación del acceso', 'textarea', '¿Para qué necesita este acceso?', true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_04, 'fecha_requerida', 'Fecha en que lo necesita', 'fecha', NULL, false, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_04, 'fecha_vencimiento', 'Fecha de vencimiento del acceso (si aplica)', 'fecha', NULL, false, 6, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_04, 'Validar autorización del solicitante', 'Confirmar con el supervisor o responsable del área que el acceso es correcto', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_04, 'Crear o asignar acceso en el sistema', 'Dar de alta el acceso con el nivel indicado en el formulario', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_04, 'Notificar al usuario con las credenciales', 'Informar al solicitante que el acceso fue habilitado', 3, 'Tecnico')
ON CONFLICT DO NOTHING;

-- S05: Instalación de Software
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_05, v_tid, v_dep_it, v_cat_it, v_pri_media,
    'Instalación de Software',
    'Instalación de programas, aplicaciones o herramientas en equipos corporativos.',
    '📦', '#06B6D4', 5, 4, false, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_05, 'software', 'Software a instalar', 'texto', 'Ej: Adobe Acrobat, Visual Studio Code, AutoCAD', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_05, 'version', 'Versión (si aplica)', 'texto', 'Ej: 2024, v3.2, última', false, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_05, 'equipo_usuario', 'Equipo o usuario destino', 'texto', 'Nombre del equipo o usuario', true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_05, 'tiene_licencia', '¿La empresa cuenta con licencia de este software?', 'checkbox', NULL, false, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_05, 'justificacion', 'Justificación y uso del software', 'textarea', '¿Para qué lo van a usar?', true, 5, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_05, 'Verificar disponibilidad de licencia', 'Confirmar que existe licencia disponible para el software solicitado', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_05, 'Instalar software en el equipo indicado', 'Realizar la instalación y configuración inicial del software', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_05, 'Verificar funcionamiento con el usuario', 'Confirmar con el solicitante que el software funciona correctamente', 3, 'Tecnico')
ON CONFLICT DO NOTHING;

-- S06: Soporte Técnico General
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_06, v_tid, v_dep_it, v_cat_it, v_pri_media,
    'Soporte Técnico',
    'Asistencia técnica para problemas de hardware, software, red, email o cualquier inconveniente informático.',
    '🔧', '#64748B', 6, 4, false, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_06, 'tipo_problema', 'Tipo de problema', 'select', NULL, true, 1, '["Hardware (equipo, periférico)","Software (aplicación, sistema)","Red / Conectividad / VPN","Email / Calendario","Impresora / Escáner","Acceso / Contraseña","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_06, 'descripcion_problema', 'Descripción del problema', 'textarea', 'Describí el problema con el mayor detalle posible...', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_06, 'dispositivo_afectado', 'Equipo o dispositivo afectado', 'texto', 'Nombre del equipo, número de activo o descripción', false, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_06, 'urgencia', 'Impacto en tu trabajo', 'select', NULL, true, 4, '["Puedo trabajar con alternativas","Afecta mi productividad parcialmente","No puedo trabajar en absoluto"]')
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_06, 'Diagnóstico inicial del problema', 'Contactar al usuario y realizar diagnóstico del inconveniente reportado', 1, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_06, 'Resolución o escalamiento', 'Resolver el problema o escalar al nivel correspondiente si es necesario', 2, 'Tecnico'),
    (gen_random_uuid(), v_tid, v_svc_06, 'Verificar resolución con el usuario', 'Confirmar con el usuario que el problema fue resuelto satisfactoriamente', 3, 'Tecnico')
ON CONFLICT DO NOTHING;

-- ── SERVICIOS RRHH ────────────────────────────────────────

-- S07: Alta de Empleado (Onboarding)
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_07, v_tid, v_dep_rrhh, v_cat_rrhh, v_pri_alta,
    'Alta de Empleado (Onboarding)',
    'Proceso completo de incorporación de un nuevo colaborador: documentación, sistemas, equipos e inducción.',
    '🎉', '#8B5CF6', 1, 72, true, false)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_07, 'nombre_completo', 'Nombre completo del nuevo empleado', 'texto', NULL, true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'cargo', 'Cargo / Puesto', 'texto', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'departamento', 'Departamento / Área', 'texto', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'fecha_ingreso', 'Fecha de ingreso', 'fecha', NULL, true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'tipo_contrato', 'Tipo de contrato', 'select', NULL, true, 5, '["Relación de dependencia","Contratado","Pasante","Freelance"]'),
    (gen_random_uuid(), v_tid, v_svc_07, 'supervisor', 'Supervisor directo', 'texto', NULL, true, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'beneficios', 'Beneficios acordados', 'textarea', 'Ej: Obra social, tickets alimentación, celular corporativo', false, 7, NULL),
    (gen_random_uuid(), v_tid, v_svc_07, 'observaciones', 'Observaciones para la incorporación', 'textarea', NULL, false, 8, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_07, 'Preparar documentación de ingreso', 'Contrato, legajo, CUIL, formularios impositivos y obra social', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_07, 'Gestionar apertura de cuenta bancaria', 'Iniciar trámite de acreditación de sueldos en banco corporativo', 2, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_07, 'Registrar en sistema de RRHH', 'Dar de alta en sistema de liquidación y control de asistencia', 3, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_07, 'Coordinar equipos IT con el área de Sistemas', 'Notificar a IT para preparar laptop, accesos y email corporativo', 4, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_07, 'Realizar inducción al empleado', 'Presentar la empresa, políticas, equipo y beneficios al nuevo colaborador', 5, 'Agente')
ON CONFLICT DO NOTHING;

-- S08: Solicitud de Vacaciones
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_08, v_tid, v_dep_rrhh, v_cat_rrhh, v_pri_baja,
    'Solicitud de Vacaciones / Licencia',
    'Solicitud formal de días de vacaciones, licencias o ausencias justificadas.',
    '🌴', '#10B981', 2, 24, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_08, 'fecha_desde', 'Fecha de inicio', 'fecha', NULL, true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_08, 'fecha_hasta', 'Fecha de fin', 'fecha', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_08, 'dias_solicitados', 'Cantidad de días hábiles', 'numero', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_08, 'tipo_ausencia', 'Tipo de ausencia', 'select', NULL, true, 4, '["Vacaciones anuales","Licencia sin goce de sueldo","Licencia médica","Licencia por paternidad","Licencia por maternidad","Duelo","Casamiento","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_08, 'supervisor_informado', '¿Ya informaste a tu supervisor?', 'checkbox', NULL, false, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_08, 'observaciones', 'Observaciones', 'textarea', NULL, false, 6, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_08, 'Verificar saldo de días disponibles', 'Confirmar que el empleado tiene días disponibles para el período solicitado', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_08, 'Registrar ausencia en sistema', 'Cargar la ausencia en el sistema de control de asistencia y liquidación', 2, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_08, 'Notificar al equipo y supervisor', 'Informar al equipo sobre la ausencia planificada', 3, 'Agente')
ON CONFLICT DO NOTHING;

-- S09: Certificado Laboral
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_09, v_tid, v_dep_rrhh, v_cat_rrhh, v_pri_media,
    'Certificado Laboral',
    'Solicitud de certificados de trabajo, antigüedad, ingresos o cualquier documentación oficial del empleador.',
    '📄', '#F59E0B', 3, 24, false, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_09, 'tipo_certificado', 'Tipo de certificado', 'select', NULL, true, 1, '["Certificado de trabajo","Certificado de antigüedad","Certificado de ingresos","Para banco / crédito","Para embajada / visa","Para obra social","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_09, 'dirigido_a', 'Dirigido a', 'texto', 'Institución o ente al que va destinado', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_09, 'requiere_apostilla', '¿Requiere apostilla?', 'checkbox', NULL, false, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_09, 'fecha_requerida', 'Fecha en que lo necesita', 'fecha', NULL, false, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_09, 'observaciones', 'Información adicional o aclaraciones', 'textarea', NULL, false, 5, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_09, 'Generar el certificado solicitado', 'Preparar el documento con los datos correctos del empleado', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_09, 'Firmar y sellar el documento', 'Obtener firma autorizada y sello de la empresa', 2, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_09, 'Entregar al solicitante', 'Entregar el certificado al empleado o enviarlo digitalmente', 3, 'Agente')
ON CONFLICT DO NOTHING;

-- S10: Cambio de Datos Personales
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_10, v_tid, v_dep_rrhh, v_cat_rrhh, v_pri_baja,
    'Actualización de Datos Personales',
    'Solicitud para actualizar información personal en el legajo: domicilio, teléfono, estado civil, CUIL/CUIT, cuenta bancaria, etc.',
    '✏️', '#64748B', 4, 48, false, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_10, 'tipo_cambio', 'Dato a modificar', 'select', NULL, true, 1, '["Domicilio","Teléfono / Celular","Estado civil","CUIL / CUIT","Cuenta bancaria (CBU)","Nombre o apellido","Contacto de emergencia","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_10, 'valor_nuevo', 'Nuevo dato', 'texto', 'Indicá el nuevo valor a registrar', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_10, 'motivo', 'Motivo del cambio', 'textarea', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_10, 'adjunta_documentacion', '¿Adjuntarás documentación respaldatoria?', 'checkbox', NULL, false, 4, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_10, 'Verificar documentación respaldatoria', 'Solicitar y revisar documentos que respaldan el cambio', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_10, 'Actualizar datos en el sistema', 'Modificar la información en el legajo y sistema de RRHH', 2, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_10, 'Confirmar el cambio al empleado', 'Notificar al empleado que sus datos fueron actualizados', 3, 'Agente')
ON CONFLICT DO NOTHING;

-- S11: Solicitud de Capacitación
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_11, v_tid, v_dep_rrhh, v_cat_rrhh, v_pri_media,
    'Solicitud de Capacitación',
    'Solicitud de cursos, certificaciones, talleres o formación profesional financiada por la empresa.',
    '🎓', '#6366F1', 5, 72, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_11, 'tipo_capacitacion', 'Tipo de capacitación', 'select', NULL, true, 1, '["Curso presencial","Curso online / e-learning","Certificación profesional","Congreso / Evento","Posgrado / Maestría","Taller interno","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_11, 'nombre_capacitacion', 'Nombre del curso o programa', 'texto', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_11, 'institucion', 'Institución o proveedor', 'texto', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_11, 'costo_estimado', 'Costo estimado (en $)', 'numero', NULL, false, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_11, 'fecha_inicio', 'Fecha de inicio', 'fecha', NULL, true, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_11, 'duracion_horas', 'Duración total (horas)', 'numero', NULL, false, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_11, 'justificacion', 'Justificación e impacto en el rol', 'textarea', '¿Cómo aporta esta capacitación a tu trabajo y a la empresa?', true, 7, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_11, 'Evaluar pertinencia y ROI de la capacitación', 'Analizar si la capacitación aporta valor al rol y a la organización', 1, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_11, 'Aprobar presupuesto con gerencia', 'Gestionar la aprobación del gasto con el área de finanzas o gerencia', 2, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_11, 'Coordinar inscripción y logística', 'Inscribir al empleado y coordinar horarios y materiales', 3, 'Agente')
ON CONFLICT DO NOTHING;

-- ── SERVICIOS COMPRAS ─────────────────────────────────────

-- S12: Solicitud de Compra
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_12, v_tid, v_dep_comp, v_cat_comp, v_pri_media,
    'Solicitud de Compra',
    'Solicitud formal para la adquisición de bienes, materiales, insumos o equipamiento para uso de la empresa.',
    '🛍️', '#10B981', 1, 48, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_12, 'descripcion_articulo', 'Artículo o servicio a comprar', 'texto', 'Descripción clara del bien o servicio', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'cantidad', 'Cantidad', 'numero', '1', true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'precio_estimado', 'Precio estimado ($ por unidad)', 'numero', NULL, false, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'proveedor_sugerido', 'Proveedor sugerido', 'texto', 'Nombre o sitio web del proveedor', false, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'area_solicitante', 'Área que solicita la compra', 'texto', NULL, true, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'justificacion', 'Justificación de la compra', 'textarea', '¿Por qué se necesita? ¿Cuál es el uso?', true, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_12, 'urgencia', 'Nivel de urgencia', 'select', NULL, true, 7, '["Normal – dentro de los plazos habituales","Urgente – esta semana","Crítica – necesaria hoy"]'),
    (gen_random_uuid(), v_tid, v_svc_12, 'fecha_requerida', 'Fecha en que lo necesita', 'fecha', NULL, false, 8, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_12, 'Solicitar al menos 3 cotizaciones', 'Contactar proveedores y obtener presupuestos comparativos', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_12, 'Analizar y comparar ofertas', 'Evaluar precio, calidad, plazo de entrega y condiciones de pago', 2, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_12, 'Emitir orden de compra', 'Generar y enviar la orden de compra al proveedor seleccionado', 3, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_12, 'Confirmar recepción conforme', 'Verificar que el pedido llegó completo y en buen estado, registrar ingreso', 4, 'Agente')
ON CONFLICT DO NOTHING;

-- S13: Reembolso de Gastos
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_13, v_tid, v_dep_comp, v_cat_comp, v_pri_media,
    'Reembolso de Gastos',
    'Solicitud de reembolso por gastos realizados por cuenta del empleado en nombre de la empresa.',
    '💰', '#F59E0B', 2, 72, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_13, 'concepto', 'Concepto del gasto', 'texto', 'Ej: Viáticos, materiales de oficina, almuerzo de trabajo', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_13, 'monto', 'Monto total a reembolsar ($)', 'numero', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_13, 'fecha_gasto', 'Fecha del gasto', 'fecha', NULL, true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_13, 'proveedor', 'Proveedor / Establecimiento', 'texto', NULL, true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_13, 'tipo_comprobante', 'Tipo de comprobante', 'select', NULL, true, 5, '["Factura A","Factura B","Ticket de caja","Recibo","Otro"]'),
    (gen_random_uuid(), v_tid, v_svc_13, 'numero_comprobante', 'Número de comprobante', 'texto', NULL, false, 6, NULL),
    (gen_random_uuid(), v_tid, v_svc_13, 'cuenta_bancaria', 'CBU o Alias para la transferencia', 'texto', NULL, true, 7, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_13, 'Verificar comprobantes y montos', 'Revisar que los comprobantes sean válidos y coincidan con los montos declarados', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_13, 'Obtener aprobación de gerencia', 'El gasto debe ser aprobado por el responsable del área o gerencia', 2, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_13, 'Procesar transferencia bancaria', 'Realizar el reembolso al CBU/alias indicado por el empleado', 3, 'Agente')
ON CONFLICT DO NOTHING;

-- S14: Solicitud de Servicio Externo
INSERT INTO "ServiciosCatalogo" ("Id","TenantId","DepartamentoId","CategoriaId","PrioridadId","Nombre","Descripcion","Icono","Color","Orden","TiempoEntregaHoras","RequiereAprobacion","EsPublico")
VALUES (v_svc_14, v_tid, v_dep_comp, v_cat_comp, v_pri_media,
    'Contratación de Servicio Externo',
    'Solicitud para contratar un proveedor o servicio externo: consultoría, mantenimiento, desarrollo, limpieza, seguridad, etc.',
    '🤝', '#EC4899', 3, 48, true, true)
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CamposServicio" ("Id","TenantId","ServicioId","Nombre","Etiqueta","TipoCampo","Placeholder","Requerido","Orden","OpcionesJson") VALUES
    (gen_random_uuid(), v_tid, v_svc_14, 'tipo_servicio', 'Tipo de servicio externo', 'texto', 'Ej: Consultoría, desarrollo web, mantenimiento edilicio', true, 1, NULL),
    (gen_random_uuid(), v_tid, v_svc_14, 'proveedor', 'Proveedor / Empresa', 'texto', NULL, true, 2, NULL),
    (gen_random_uuid(), v_tid, v_svc_14, 'descripcion', 'Descripción del servicio', 'textarea', 'Detallá qué servicio se va a realizar', true, 3, NULL),
    (gen_random_uuid(), v_tid, v_svc_14, 'monto_estimado', 'Monto estimado ($)', 'numero', NULL, true, 4, NULL),
    (gen_random_uuid(), v_tid, v_svc_14, 'vigencia_meses', 'Vigencia del contrato (en meses)', 'numero', NULL, false, 5, NULL),
    (gen_random_uuid(), v_tid, v_svc_14, 'justificacion', 'Justificación de la contratación', 'textarea', '¿Por qué se necesita este servicio externo?', true, 6, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "PlantillasTareas" ("Id","TenantId","ServicioId","Titulo","Descripcion","Orden","AsignarARol") VALUES
    (gen_random_uuid(), v_tid, v_svc_14, 'Validar proveedor y antecedentes', 'Verificar datos fiscales, referencias y antecedentes del proveedor', 1, 'Agente'),
    (gen_random_uuid(), v_tid, v_svc_14, 'Revisar contrato y condiciones', 'Analizar el contrato, alcance, penalidades y condiciones de pago', 2, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_14, 'Obtener aprobación del gasto', 'El monto debe ser aprobado por gerencia o dirección según política de gastos', 3, 'Supervisor'),
    (gen_random_uuid(), v_tid, v_svc_14, 'Notificar y coordinar inicio del servicio', 'Informar al área solicitante y coordinar el inicio de las actividades', 4, 'Agente')
ON CONFLICT DO NOTHING;

END $$;

-- ── Resumen ──────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '  Catálogo de Servicios aplicado:';
  RAISE NOTICE '  + Tablas: Departamentos, ServiciosCatalogo,';
  RAISE NOTICE '            CamposServicio, PlantillasTareas,';
  RAISE NOTICE '            RespuestasFormulario';
  RAISE NOTICE '  + Columna: Tickets.ServicioId';
  RAISE NOTICE '  + Departamentos: IT, RRHH, Compras';
  RAISE NOTICE '  + Servicios: 14 servicios con formularios';
  RAISE NOTICE '  + Campos de formulario: ~80 campos dinámicos';
  RAISE NOTICE '  + Plantillas de tareas: ~42 tareas automáticas';
  RAISE NOTICE '====================================================';
END $$;
