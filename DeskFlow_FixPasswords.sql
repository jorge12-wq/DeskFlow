-- =============================================================
-- Fix temporal: establece hash conocido para todos los usuarios demo
-- Hash = bcrypt de "Admin123!" generado manualmente
-- Después de esto, reiniciar la API para que el seeder genere
-- hashes reales con BCrypt.
-- =============================================================
-- Por ahora usamos el hash de "password" para poder entrar,
-- al reiniciar la API el seeder los sobreescribe con "Admin123!"
-- =============================================================

UPDATE "Usuarios"
SET "PasswordHash" = '$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE "Id" IN (
    '50000000-0000-0000-0000-000000000001',  -- admin@demo.com
    '50000000-0000-0000-0000-000000000002',  -- supervisor@demo.com
    '50000000-0000-0000-0000-000000000003',  -- agente1@demo.com
    '50000000-0000-0000-0000-000000000004',  -- agente2@demo.com
    '50000000-0000-0000-0000-000000000005',  -- usuario@demo.com
    '50000000-0000-0000-0000-000000000006',  -- aprobador@demo.com
    '50000000-0000-0000-0000-000000000007'   -- observador@demo.com
);

-- Verificar
SELECT "Email", LEFT("PasswordHash", 10) as "HashInicio", "Activo"
FROM "Usuarios"
WHERE "Id" IN (
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000004',
    '50000000-0000-0000-0000-000000000005',
    '50000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000007'
)
ORDER BY "Email";
