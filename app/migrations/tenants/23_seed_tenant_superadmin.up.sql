-- Seed superadmin user with bcrypt-hashed password
INSERT INTO users (username, hash_password, email, role) VALUES
('superadmin', '$2a$10$yA5z17s2UyujjSjMuDYhaOQaau308wBl9X77o0VruihOrEzEyGb0y', 'admin@example.com', 'superadmin');

