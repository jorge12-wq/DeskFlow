-- ============================================================
--  DeskFlow – PASO 2: Actualización de flujo de trabajo
--  Ejecutar en pgAdmin sobre "DeskFlowDb"
-- ============================================================
--  Cambios:
--  1. Renombrar estado "Nuevo" → "Pendiente de Asignación"
--  2. El SLA ya no corre desde creación sino desde asignación
-- ============================================================

-- Renombrar estado inicial
UPDATE "EstadosTicket"
SET "Nombre" = 'Pendiente de Asignación',
    "Color"  = '#F59E0B'
WHERE "Id" = '30000000-0000-0000-0000-000000000001';

-- Limpiar SLA de tickets ya existentes que están sin asignar
-- (para que el SLA empiece correctamente al ser asignados)
UPDATE "Tickets"
SET "FechaLimiteSLA" = NULL,
    "SLAEstado" = 0
WHERE "TecnicoAsignadoId" IS NULL
  AND "EstadoId" = '30000000-0000-0000-0000-000000000001';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  Workflow actualizado:';
    RAISE NOTICE '  - Estado "Nuevo" → "Pendiente de Asignación"';
    RAISE NOTICE '  - SLA de tickets sin asignar reseteado';
    RAISE NOTICE '================================================';
END $$;
