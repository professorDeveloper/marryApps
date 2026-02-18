-- no-op: seed moved to app/internal/migrate/seed.go
INSERT INTO users (username, password, email, role) VALUES 
('superadmin', 'superadmin', 'admin@example.com', 'superadmin');

