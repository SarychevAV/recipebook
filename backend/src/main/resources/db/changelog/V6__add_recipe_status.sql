ALTER TABLE recipes
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN rejection_reason TEXT;

-- Тестовый admin-пользователь (пароль: admin123 — BCrypt хэш)
INSERT INTO users (id, username, email, password, role, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin', 'admin@recipebook.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN',
        now(), now())
ON CONFLICT (email) DO NOTHING;

-- rollback: ALTER TABLE recipes DROP COLUMN status, DROP COLUMN rejection_reason;
-- rollback: DELETE FROM users WHERE email = 'admin@recipebook.com';
