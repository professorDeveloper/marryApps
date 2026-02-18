-- Fix superadmin: set bcrypt-hashed password for existing user
UPDATE users SET hash_password = '$2a$10$yA5z17s2UyujjSjMuDYhaOQaau308wBl9X77o0VruihOrEzEyGb0y'
WHERE username = 'superadmin' AND (hash_password IS NULL OR hash_password = '');

