package pg

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func scanUser(row interface {
	Scan(dest ...any) error
}) (User, error) {
	var u User
	err := row.Scan(
		&u.ID, &u.FullName, &u.Username, &u.Role, &u.Email,
		&u.ShiftID, &u.Pincode, &u.HashPassword, &u.BrandID,
		&u.BranchID, &u.PhoneNumber, &u.FcmToken, &u.IsActive,
		&u.CreatedAt, &u.UpdatedAt, &u.DeletedAt,
	)
	return u, err
}

const superadminSelect = `
	SELECT id, full_name, username, role, email, shift_id, pincode, hash_password,
	       brand_id, branch_id, phone_number, fcm_token, is_active, created_at, updated_at, deleted_at
	FROM users
`

func (q *Queries) GetBrandSuperadmins(ctx context.Context) ([]User, error) {
	rows, err := q.db.Query(ctx, superadminSelect+`WHERE role = 'superadmin' AND deleted_at = 0 ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (q *Queries) GetBrandSuperadminByID(ctx context.Context, id uuid.UUID) (User, error) {
	row := q.db.QueryRow(ctx, superadminSelect+`WHERE id = $1 AND role = 'superadmin' AND deleted_at = 0`, id)
	return scanUser(row)
}

type UpdateBrandSuperadminParams struct {
	ID           uuid.UUID
	FullName     *string
	Username     *string
	Email        *string
	PhoneNumber  *string
	HashPassword *string
	IsActive     *bool
}

func (q *Queries) UpdateBrandSuperadmin(ctx context.Context, p UpdateBrandSuperadminParams) (User, error) {
	const sql = `
		UPDATE users SET
		    full_name     = COALESCE($2, full_name),
		    username      = COALESCE($3, username),
		    email         = COALESCE($4, email),
		    phone_number  = COALESCE($5, phone_number),
		    hash_password = COALESCE($6, hash_password),
		    is_active     = COALESCE($7, is_active),
		    updated_at    = NOW()
		WHERE id = $1 AND role = 'superadmin' AND deleted_at = 0
		RETURNING id, full_name, username, role, email, shift_id, pincode, hash_password,
		          brand_id, branch_id, phone_number, fcm_token, is_active, created_at, updated_at, deleted_at
	`
	row := q.db.QueryRow(ctx, sql,
		p.ID, p.FullName, p.Username, p.Email, p.PhoneNumber, p.HashPassword,
		boolPtrToNullBool(p.IsActive),
	)
	return scanUser(row)
}

func (q *Queries) SoftDeleteBrandSuperadmin(ctx context.Context, id uuid.UUID) error {
	const sql = `UPDATE users SET deleted_at = $2, updated_at = NOW() WHERE id = $1 AND role = 'superadmin' AND deleted_at = 0`
	_, err := q.db.Exec(ctx, sql, id, time.Now().Unix())
	return err
}

func boolPtrToNullBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}
