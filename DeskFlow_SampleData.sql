-- ============================================================
--  DeskFlow – Datos de prueba
--  Ejecutar conectado a "DeskFlowDb" en pgAdmin
-- ============================================================
--  Contraseña de TODOS los usuarios: Admin123!
-- ============================================================

-- ============================================================
-- BLOQUE 1: Sucursales, Áreas, Usuarios, Etiquetas, Tickets,
--           Comentarios e Historial
-- ============================================================
DO $$
DECLARE
    v_tenant   UUID := '10000000-0000-0000-0000-000000000001';
    v_rolSup   UUID := '20000000-0000-0000-0000-000000000002';
    v_rolTec   UUID := '20000000-0000-0000-0000-000000000003';
    v_rolUsr   UUID := '20000000-0000-0000-0000-000000000004';

    v_stNuevo  UUID := '30000000-0000-0000-0000-000000000001';
    v_stAsig   UUID := '30000000-0000-0000-0000-000000000002';
    v_stProc   UUID := '30000000-0000-0000-0000-000000000003';
    v_stRes    UUID := '30000000-0000-0000-0000-000000000006';
    v_stCer    UUID := '30000000-0000-0000-0000-000000000007';

    v_priCrit  UUID := '40000000-0000-0000-0000-000000000001';
    v_priAlta  UUID := '40000000-0000-0000-0000-000000000002';
    v_priMed   UUID := '40000000-0000-0000-0000-000000000003';
    v_priBaja  UUID := '40000000-0000-0000-0000-000000000004';

    v_sup1     UUID := 'a1000000-0000-0000-0000-000000000001';
    v_tec1     UUID := 'a2000000-0000-0000-0000-000000000001';
    v_tec2     UUID := 'a2000000-0000-0000-0000-000000000002';
    v_usr1     UUID := 'a3000000-0000-0000-0000-000000000001';
    v_usr2     UUID := 'a3000000-0000-0000-0000-000000000002';
    v_adminId  UUID := '50000000-0000-0000-0000-000000000001';

    v_sucursal UUID := 'b1000000-0000-0000-0000-000000000001';
    v_areaTI   UUID := 'b2000000-0000-0000-0000-000000000001';
    v_areaAdm  UUID := 'b2000000-0000-0000-0000-000000000002';

    v_hash     TEXT;
    v_catHW    UUID;
    v_catSW    UUID;
    v_catNet   UUID;

    v_t1  UUID; v_t2  UUID; v_t3  UUID; v_t4  UUID; v_t5  UUID;
    v_t6  UUID; v_t7  UUID; v_t8  UUID; v_t9  UUID; v_t10 UUID;
    v_t11 UUID; v_t12 UUID; v_t13 UUID; v_t14 UUID; v_t15 UUID;
BEGIN

    -- Verificar hash del admin
    SELECT "PasswordHash" INTO v_hash FROM "Usuarios" WHERE "Id" = v_adminId;
    IF v_hash IS NULL OR v_hash LIKE '%placeholder%' THEN
        RAISE EXCEPTION 'El usuario admin no tiene hash válido. Arrancá la API primero.';
    END IF;

    -- Sucursal
    INSERT INTO "Sucursales" ("Id", "TenantId", "Nombre", "Direccion", "Activo")
    VALUES (v_sucursal, v_tenant, 'Casa Central', 'Av. España 1234, Asunción', TRUE)
    ON CONFLICT DO NOTHING;

    -- Áreas
    INSERT INTO "Areas" ("Id", "TenantId", "Nombre", "Descripcion", "Activo")
    VALUES
        (v_areaTI,  v_tenant, 'Tecnología',    'Departamento de TI y soporte',      TRUE),
        (v_areaAdm, v_tenant, 'Administración','Recursos humanos y administración',  TRUE)
    ON CONFLICT DO NOTHING;

    -- Usuarios
    INSERT INTO "Usuarios"
        ("Id", "TenantId", "RolId", "Nombre", "Apellido",
         "Email", "PasswordHash", "SucursalId", "AreaId", "Activo", "FechaCreacion")
    VALUES
        (v_sup1, v_tenant, v_rolSup, 'María',  'González',  'maria.gonzalez@demo.com',
         v_hash, v_sucursal, v_areaTI,  TRUE, NOW() - INTERVAL '60 days'),
        (v_tec1, v_tenant, v_rolTec, 'Carlos', 'Martínez',  'carlos.martinez@demo.com',
         v_hash, v_sucursal, v_areaTI,  TRUE, NOW() - INTERVAL '45 days'),
        (v_tec2, v_tenant, v_rolTec, 'Ana',    'López',     'ana.lopez@demo.com',
         v_hash, v_sucursal, v_areaTI,  TRUE, NOW() - INTERVAL '30 days'),
        (v_usr1, v_tenant, v_rolUsr, 'Juan',   'Pérez',     'juan.perez@demo.com',
         v_hash, v_sucursal, v_areaAdm, TRUE, NOW() - INTERVAL '20 days'),
        (v_usr2, v_tenant, v_rolUsr, 'Laura',  'Rodríguez', 'laura.rodriguez@demo.com',
         v_hash, v_sucursal, v_areaAdm, TRUE, NOW() - INTERVAL '10 days')
    ON CONFLICT DO NOTHING;

    -- Categorías (lee las existentes)
    SELECT "Id" INTO v_catHW  FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Hardware' LIMIT 1;
    SELECT "Id" INTO v_catSW  FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Software' LIMIT 1;
    SELECT "Id" INTO v_catNet FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Red y Conectividad' LIMIT 1;

    IF v_catHW IS NULL THEN
        RAISE EXCEPTION 'No se encontraron categorías. Ejecutá DeskFlow_Database.sql primero.';
    END IF;

    -- Etiquetas
    INSERT INTO "Etiquetas" ("Id", "TenantId", "Nombre", "Color", "Activo")
    VALUES
        (gen_random_uuid(), v_tenant, 'Urgente',    '#EF4444', TRUE),
        (gen_random_uuid(), v_tenant, 'VIP',         '#8B5CF6', TRUE),
        (gen_random_uuid(), v_tenant, 'Seguimiento', '#F59E0B', TRUE),
        (gen_random_uuid(), v_tenant, 'En espera',   '#6B7280', TRUE),
        (gen_random_uuid(), v_tenant, 'Recurrente',  '#3B82F6', TRUE)
    ON CONFLICT DO NOTHING;

    -- Generar IDs de tickets
    v_t1  := gen_random_uuid(); v_t2  := gen_random_uuid();
    v_t3  := gen_random_uuid(); v_t4  := gen_random_uuid();
    v_t5  := gen_random_uuid(); v_t6  := gen_random_uuid();
    v_t7  := gen_random_uuid(); v_t8  := gen_random_uuid();
    v_t9  := gen_random_uuid(); v_t10 := gen_random_uuid();
    v_t11 := gen_random_uuid(); v_t12 := gen_random_uuid();
    v_t13 := gen_random_uuid(); v_t14 := gen_random_uuid();
    v_t15 := gen_random_uuid();

    -- Tickets
    INSERT INTO "Tickets" (
        "Id","TenantId","Numero","Asunto","Descripcion",
        "CategoriaId","PrioridadId","EstadoId",
        "UsuarioCreadorId","TecnicoAsignadoId","SupervisorId",
        "SucursalId","AreaId",
        "FechaCreacion","FechaAsignacion","FechaResolucion","FechaCierre",
        "FechaLimiteSLA","SLAEstado"
    ) VALUES
    (v_t1,  v_tenant,'TK-0001','Servidor de producción caído',
     'El servidor principal no responde desde las 08:00 hs.',
     v_catHW,v_priCrit,v_stNuevo, v_usr1,NULL,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '2 hours',NULL,NULL,NULL,
     NOW()+INTERVAL '2 hours',0),

    (v_t2,  v_tenant,'TK-0002','PC no enciende en recepción',
     'La computadora del escritorio de recepción no arranca.',
     v_catHW,v_priAlta,v_stAsig, v_usr1,v_tec1,v_sup1,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '5 hours',NOW()-INTERVAL '4 hours',NULL,NULL,
     NOW()+INTERVAL '3 hours',0),

    (v_t3,  v_tenant,'TK-0003','Error al abrir Excel',
     'Office no abre archivos .xlsx, muestra error de licencia.',
     v_catSW,v_priMed,v_stProc, v_usr2,v_tec1,v_sup1,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '1 day',NOW()-INTERVAL '23 hours',NULL,NULL,
     NOW()+INTERVAL '7 hours',0),

    (v_t4,  v_tenant,'TK-0004','VPN no conecta desde home office',
     'Varios usuarios reportan que la VPN corporativa falla.',
     v_catNet,v_priAlta,v_stProc, v_usr2,v_tec2,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '6 hours',NOW()-INTERVAL '5 hours',NULL,NULL,
     NOW()+INTERVAL '1 hour',1),

    (v_t5,  v_tenant,'TK-0005','Caída de internet en toda la oficina',
     'Sin conectividad desde hace 3 horas. Afecta a todos los puestos.',
     v_catNet,v_priCrit,v_stProc, v_usr1,v_tec2,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '5 hours',NOW()-INTERVAL '4 hours 30 minutes',NULL,NULL,
     NOW()-INTERVAL '1 hour',2),

    (v_t6,  v_tenant,'TK-0006','Impresora no imprime en color',
     'La impresora HP del piso 2 no imprime en color.',
     v_catHW,v_priMed,v_stRes, v_usr1,v_tec1,v_sup1,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days 20 hours',
     NOW()-INTERVAL '1 day',NULL,
     NOW()-INTERVAL '2 days',0),

    (v_t7,  v_tenant,'TK-0007','Solicitud de instalación de software',
     'Instalar Zoom en notebook de gerencia.',
     v_catSW,v_priBaja,v_stCer, v_usr2,v_tec2,v_sup1,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '5 days',NOW()-INTERVAL '4 days 18 hours',
     NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',
     NOW()-INTERVAL '4 days 12 hours',0),

    (v_t8,  v_tenant,'TK-0008','Teclado con teclas pegajosas',
     'El teclado del puesto 14 tiene teclas que no responden bien.',
     v_catHW,v_priBaja,v_stNuevo, v_usr2,NULL,NULL,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '30 minutes',NULL,NULL,NULL,
     NOW()+INTERVAL '70 hours',0),

    (v_t9,  v_tenant,'TK-0009','Sistema de facturación no abre',
     'El ERP da error Cannot connect to server al iniciar.',
     v_catSW,v_priAlta,v_stAsig, v_usr1,v_tec1,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '3 hours',NOW()-INTERVAL '2 hours',NULL,NULL,
     NOW()+INTERVAL '5 hours',0),

    (v_t10, v_tenant,'TK-0010','Actualización de Windows bloqueada',
     'Windows Update queda en 0 porciento sin avanzar.',
     v_catSW,v_priMed,v_stCer, v_usr2,v_tec2,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '7 days',NOW()-INTERVAL '6 days 22 hours',
     NOW()-INTERVAL '6 days',NOW()-INTERVAL '5 days',
     NOW()-INTERVAL '6 days 6 hours',0),

    (v_t11, v_tenant,'TK-0011','Pérdida de datos en carpeta compartida',
     'Archivos de la carpeta del servidor desaparecieron.',
     v_catHW,v_priCrit,v_stProc, v_usr1,v_tec1,v_sup1,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '4 hours',NOW()-INTERVAL '3 hours 30 minutes',NULL,NULL,
     NOW()+INTERVAL '30 minutes',1),

    (v_t12, v_tenant,'TK-0012','Mouse sin scroll',
     'El scroll del mouse del puesto 8 no funciona.',
     v_catHW,v_priMed,v_stNuevo, v_usr2,NULL,NULL,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '1 hour',NULL,NULL,NULL,
     NOW()+INTERVAL '23 hours',0),

    (v_t13, v_tenant,'TK-0013','Correo no envía adjuntos',
     'Outlook no puede enviar archivos de más de 5MB.',
     v_catSW,v_priAlta,v_stRes, v_usr1,v_tec2,v_sup1,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day 22 hours',
     NOW()-INTERVAL '1 day 12 hours',NULL,
     NOW()-INTERVAL '1 day 14 hours',0),

    (v_t14, v_tenant,'TK-0014','Solicitud de segundo monitor',
     'Usuario de contabilidad solicita monitor adicional.',
     v_catHW,v_priBaja,v_stAsig, v_usr2,v_tec1,NULL,
     v_sucursal,v_areaAdm,
     NOW()-INTERVAL '12 hours',NOW()-INTERVAL '10 hours',NULL,NULL,
     NOW()+INTERVAL '60 hours',0),

    (v_t15, v_tenant,'TK-0015','Configurar firma de email',
     'Configurar firma corporativa en Outlook para nuevo empleado.',
     v_catSW,v_priBaja,v_stCer, v_usr1,v_tec2,NULL,
     v_sucursal,v_areaTI,
     NOW()-INTERVAL '10 days',NOW()-INTERVAL '9 days 20 hours',
     NOW()-INTERVAL '9 days 12 hours',NOW()-INTERVAL '9 days',
     NOW()-INTERVAL '9 days 18 hours',0);

    -- Comentarios
    INSERT INTO "ComentariosTicket"
        ("Id","TicketId","UsuarioId","Contenido","EsInterno","FechaCreacion")
    VALUES
        (gen_random_uuid(),v_t1,v_sup1,
         'Escalando al proveedor de hosting. Ticket crítico.',
         TRUE,NOW()-INTERVAL '1 hour 45 minutes'),

        (gen_random_uuid(),v_t2,v_tec1,
         'Revisé la fuente de poder, parece quemada. Voy a solicitar repuesto.',
         FALSE,NOW()-INTERVAL '3 hours'),
        (gen_random_uuid(),v_t2,v_usr1,
         'Cuándo estará lista? La necesito para trabajar.',
         FALSE,NOW()-INTERVAL '2 hours 30 minutes'),
        (gen_random_uuid(),v_t2,v_tec1,
         'El repuesto llega mañana. Por hoy puede usar el puesto libre del piso 1.',
         FALSE,NOW()-INTERVAL '2 hours'),

        (gen_random_uuid(),v_t3,v_tec1,
         'La licencia expiró. Estoy gestionando la renovación con el área de compras.',
         FALSE,NOW()-INTERVAL '22 hours'),
        (gen_random_uuid(),v_t3,v_tec1,
         'Licencia renovada. Reinstalando Office.',
         TRUE,NOW()-INTERVAL '5 hours'),

        (gen_random_uuid(),v_t5,v_tec2,
         'El router principal se reinició solo. Revisando configuración.',
         TRUE,NOW()-INTERVAL '4 hours'),
        (gen_random_uuid(),v_t5,v_sup1,
         'URGENTE: coordinar con el proveedor de internet.',
         TRUE,NOW()-INTERVAL '3 hours 30 minutes'),

        (gen_random_uuid(),v_t6,v_tec1,
         'Cambié el cartucho de tinta cyan que estaba vacío. Impresora funcionando.',
         FALSE,NOW()-INTERVAL '1 day'),
        (gen_random_uuid(),v_t6,v_usr1,
         'Perfecto, muchas gracias!',
         FALSE,NOW()-INTERVAL '23 hours'),

        (gen_random_uuid(),v_t9,v_tec1,
         'Revisando conectividad con el servidor. El servicio de base de datos está caído.',
         TRUE,NOW()-INTERVAL '1 hour 45 minutes'),

        (gen_random_uuid(),v_t11,v_tec1,
         'Encontré los archivos en la papelera del servidor. Recuperando.',
         TRUE,NOW()-INTERVAL '3 hours'),
        (gen_random_uuid(),v_t11,v_usr1,
         'Por favor avisen cuando estén recuperados, son urgentes.',
         FALSE,NOW()-INTERVAL '2 hours');

    -- Historial de cambios de estado
    INSERT INTO "HistorialTickets"
        ("Id","TicketId","UsuarioId","EstadoAnteriorId","EstadoNuevoId","Descripcion","FechaCreacion")
    VALUES
        (gen_random_uuid(),v_t2,v_sup1,v_stNuevo,v_stAsig,
         'Ticket asignado a Carlos Martínez',NOW()-INTERVAL '4 hours'),

        (gen_random_uuid(),v_t3,v_sup1,v_stNuevo,v_stAsig,
         'Ticket asignado a Carlos Martínez',NOW()-INTERVAL '23 hours'),
        (gen_random_uuid(),v_t3,v_tec1,v_stAsig,v_stProc,
         'Iniciando diagnóstico del problema de licencia',NOW()-INTERVAL '22 hours'),

        (gen_random_uuid(),v_t6,v_sup1,v_stNuevo,v_stAsig,
         'Ticket asignado a Carlos Martínez',NOW()-INTERVAL '2 days 20 hours'),
        (gen_random_uuid(),v_t6,v_tec1,v_stAsig,v_stProc,
         'Revisando impresora HP',NOW()-INTERVAL '2 days 18 hours'),
        (gen_random_uuid(),v_t6,v_tec1,v_stProc,v_stRes,
         'Problema resuelto: cartucho de tinta reemplazado',NOW()-INTERVAL '1 day'),

        (gen_random_uuid(),v_t7,v_sup1,v_stNuevo,v_stAsig,
         'Ticket asignado a Ana López',NOW()-INTERVAL '4 days 18 hours'),
        (gen_random_uuid(),v_t7,v_tec2,v_stAsig,v_stRes,
         'Zoom instalado y configurado correctamente',NOW()-INTERVAL '4 days'),
        (gen_random_uuid(),v_t7,v_sup1,v_stRes,v_stCer,
         'Usuario confirmó que funciona. Ticket cerrado.',NOW()-INTERVAL '3 days');

END $$;


-- ============================================================
-- BLOQUE 2: Encuestas de satisfacción
-- ============================================================
DO $enc$
DECLARE
    v_tenant UUID := '10000000-0000-0000-0000-000000000001';
    v_usr1   UUID := 'a3000000-0000-0000-0000-000000000001';
    v_usr2   UUID := 'a3000000-0000-0000-0000-000000000002';
    v_tec2   UUID := 'a2000000-0000-0000-0000-000000000002';
    v_t7     UUID;
    v_t10    UUID;
    v_t15    UUID;
BEGIN
    SELECT "Id" INTO v_t7  FROM "Tickets" WHERE "Numero" = 'TK-0007' AND "TenantId" = v_tenant;
    SELECT "Id" INTO v_t10 FROM "Tickets" WHERE "Numero" = 'TK-0010' AND "TenantId" = v_tenant;
    SELECT "Id" INTO v_t15 FROM "Tickets" WHERE "Numero" = 'TK-0015' AND "TenantId" = v_tenant;

    IF v_t7 IS NULL THEN
        RAISE NOTICE 'No se encontraron tickets cerrados, omitiendo encuestas.';
        RETURN;
    END IF;

    INSERT INTO "EncuestaRespuestas"
        ("Id","TenantId","TicketId","UsuarioId","TecnicoId",
         "Puntuacion","Comentario","FechaCreacion","FechaRespuesta")
    VALUES
        (gen_random_uuid(),v_tenant,v_t7,v_usr2,v_tec2,
         5,'Excelente atención, resolvieron muy rápido!',
         NOW()-INTERVAL '3 days 12 hours',NOW()-INTERVAL '3 days 6 hours'),
        (gen_random_uuid(),v_tenant,v_t10,v_usr2,v_tec2,
         4,'Muy buena atención, aunque tardó un poco.',
         NOW()-INTERVAL '5 days 12 hours',NOW()-INTERVAL '5 days 6 hours'),
        (gen_random_uuid(),v_tenant,v_t15,v_usr1,v_tec2,
         5,NULL,
         NOW()-INTERVAL '9 days',NOW()-INTERVAL '8 days 18 hours')
    ON CONFLICT DO NOTHING;
END $enc$;


-- ============================================================
-- BLOQUE 3: Especialidades de técnicos
-- ============================================================
DO $tec$
DECLARE
    v_tenant UUID := '10000000-0000-0000-0000-000000000001';
    v_tec1   UUID := 'a2000000-0000-0000-0000-000000000001';
    v_tec2   UUID := 'a2000000-0000-0000-0000-000000000002';
    v_catHW  UUID;
    v_catSW  UUID;
    v_catNet UUID;
BEGIN
    SELECT "Id" INTO v_catHW  FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Hardware' LIMIT 1;
    SELECT "Id" INTO v_catSW  FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Software' LIMIT 1;
    SELECT "Id" INTO v_catNet FROM "Categorias"
    WHERE "TenantId" = v_tenant AND "Nombre" = 'Red y Conectividad' LIMIT 1;

    INSERT INTO "TecnicoCategorias" ("Id","TenantId","TecnicoId","CategoriaId")
    VALUES
        (gen_random_uuid(),v_tenant,v_tec1,v_catHW),
        (gen_random_uuid(),v_tenant,v_tec1,v_catSW),
        (gen_random_uuid(),v_tenant,v_tec2,v_catNet),
        (gen_random_uuid(),v_tenant,v_tec2,v_catHW)
    ON CONFLICT DO NOTHING;
END $tec$;


-- ============================================================
-- BLOQUE 4: Resumen final
-- ============================================================
DO $fin$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  Datos de prueba cargados exitosamente';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  Usuarios (contraseña: Admin123!):';
    RAISE NOTICE '    admin@demo.com              - Administrador';
    RAISE NOTICE '    maria.gonzalez@demo.com     - Supervisor';
    RAISE NOTICE '    carlos.martinez@demo.com    - Técnico';
    RAISE NOTICE '    ana.lopez@demo.com          - Técnico';
    RAISE NOTICE '    juan.perez@demo.com         - Usuario';
    RAISE NOTICE '    laura.rodriguez@demo.com    - Usuario';
    RAISE NOTICE '';
    RAISE NOTICE '  Tickets creados : 15';
    RAISE NOTICE '  Comentarios     : 13';
    RAISE NOTICE '  Encuestas       :  3';
    RAISE NOTICE '================================================';
END $fin$;
