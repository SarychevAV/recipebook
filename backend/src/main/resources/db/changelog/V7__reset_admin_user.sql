-- Remove the hardcoded admin user seeded in V6.
-- The admin account is now created programmatically on startup from
-- environment variables ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_USERNAME.
DELETE FROM users WHERE email = 'admin@recipebook.com' AND username = 'admin';

-- rollback: see AdminInitializer — re-start the application to recreate the admin.
