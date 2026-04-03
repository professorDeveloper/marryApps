-- name: GetPOSAuthSettings :one
SELECT id, pos_password_hash, created_at, updated_at
FROM pos_auth_settings
WHERE id = 1
LIMIT 1;

-- name: UpsertPOSAuthSettings :exec
INSERT INTO pos_auth_settings (id, pos_password_hash)
VALUES (1, $1)
ON CONFLICT (id)
DO UPDATE SET
  pos_password_hash = EXCLUDED.pos_password_hash,
  updated_at = NOW();