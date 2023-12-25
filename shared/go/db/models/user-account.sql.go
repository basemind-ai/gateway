// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.24.0
// source: user-account.sql

package models

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const checkUserAccountExists = `-- name: CheckUserAccountExists :one

SELECT EXISTS(SELECT 1 FROM user_account WHERE firebase_id = $1)
`

// -- user_account
func (q *Queries) CheckUserAccountExists(ctx context.Context, firebaseID string) (bool, error) {
	row := q.db.QueryRow(ctx, checkUserAccountExists, firebaseID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const checkUserIsSoleAdminInAnyProject = `-- name: CheckUserIsSoleAdminInAnyProject :one
SELECT EXISTS(
    SELECT 1
    FROM project AS p
    LEFT JOIN user_project AS up ON p.id = up.project_id
    WHERE
        up.user_id = $1 AND up.permission = 'ADMIN' AND p.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1
            FROM user_project AS up2
            WHERE up2.project_id = p.id AND up2.user_id != $1 AND up2.permission = 'ADMIN'
        )
)
`

func (q *Queries) CheckUserIsSoleAdminInAnyProject(ctx context.Context, userID pgtype.UUID) (bool, error) {
	row := q.db.QueryRow(ctx, checkUserIsSoleAdminInAnyProject, userID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const createUserAccount = `-- name: CreateUserAccount :one
INSERT INTO user_account (
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, display_name, email, firebase_id, phone_number, photo_url, created_at
`

type CreateUserAccountParams struct {
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	FirebaseID  string `json:"firebaseId"`
	PhoneNumber string `json:"phoneNumber"`
	PhotoUrl    string `json:"photoUrl"`
}

func (q *Queries) CreateUserAccount(ctx context.Context, arg CreateUserAccountParams) (UserAccount, error) {
	row := q.db.QueryRow(ctx, createUserAccount,
		arg.DisplayName,
		arg.Email,
		arg.FirebaseID,
		arg.PhoneNumber,
		arg.PhotoUrl,
	)
	var i UserAccount
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Email,
		&i.FirebaseID,
		&i.PhoneNumber,
		&i.PhotoUrl,
		&i.CreatedAt,
	)
	return i, err
}

const deleteUserAccount = `-- name: DeleteUserAccount :exec
DELETE FROM user_account WHERE id = $1
`

func (q *Queries) DeleteUserAccount(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteUserAccount, id)
	return err
}

const retrieveProjectUserAccounts = `-- name: RetrieveProjectUserAccounts :many
SELECT
    user_account.id,
    user_account.display_name,
    user_account.email,
    user_account.firebase_id,
    user_account.phone_number,
    user_account.photo_url,
    user_account.created_at,
    up.permission
FROM user_account
LEFT JOIN user_project AS up ON user_account.id = up.user_id
LEFT JOIN project AS p ON up.project_id = p.id
WHERE p.id = $1
ORDER BY user_account.display_name
`

type RetrieveProjectUserAccountsRow struct {
	ID          pgtype.UUID              `json:"id"`
	DisplayName string                   `json:"displayName"`
	Email       string                   `json:"email"`
	FirebaseID  string                   `json:"firebaseId"`
	PhoneNumber string                   `json:"phoneNumber"`
	PhotoUrl    string                   `json:"photoUrl"`
	CreatedAt   pgtype.Timestamptz       `json:"createdAt"`
	Permission  NullAccessPermissionType `json:"permission"`
}

func (q *Queries) RetrieveProjectUserAccounts(ctx context.Context, id pgtype.UUID) ([]RetrieveProjectUserAccountsRow, error) {
	rows, err := q.db.Query(ctx, retrieveProjectUserAccounts, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RetrieveProjectUserAccountsRow
	for rows.Next() {
		var i RetrieveProjectUserAccountsRow
		if err := rows.Scan(
			&i.ID,
			&i.DisplayName,
			&i.Email,
			&i.FirebaseID,
			&i.PhoneNumber,
			&i.PhotoUrl,
			&i.CreatedAt,
			&i.Permission,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const retrieveUserAccountByEmail = `-- name: RetrieveUserAccountByEmail :one
SELECT
    id,
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url,
    created_at
FROM user_account
WHERE email = $1
`

func (q *Queries) RetrieveUserAccountByEmail(ctx context.Context, email string) (UserAccount, error) {
	row := q.db.QueryRow(ctx, retrieveUserAccountByEmail, email)
	var i UserAccount
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Email,
		&i.FirebaseID,
		&i.PhoneNumber,
		&i.PhotoUrl,
		&i.CreatedAt,
	)
	return i, err
}

const retrieveUserAccountByFirebaseID = `-- name: RetrieveUserAccountByFirebaseID :one
SELECT
    id,
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url,
    created_at
FROM user_account
WHERE firebase_id = $1
`

func (q *Queries) RetrieveUserAccountByFirebaseID(ctx context.Context, firebaseID string) (UserAccount, error) {
	row := q.db.QueryRow(ctx, retrieveUserAccountByFirebaseID, firebaseID)
	var i UserAccount
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Email,
		&i.FirebaseID,
		&i.PhoneNumber,
		&i.PhotoUrl,
		&i.CreatedAt,
	)
	return i, err
}

const retrieveUserAccountByID = `-- name: RetrieveUserAccountByID :one
SELECT
    id,
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url,
    created_at
FROM user_account
WHERE id = $1
`

func (q *Queries) RetrieveUserAccountByID(ctx context.Context, id pgtype.UUID) (UserAccount, error) {
	row := q.db.QueryRow(ctx, retrieveUserAccountByID, id)
	var i UserAccount
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Email,
		&i.FirebaseID,
		&i.PhoneNumber,
		&i.PhotoUrl,
		&i.CreatedAt,
	)
	return i, err
}

const updateUserAccount = `-- name: UpdateUserAccount :one
UPDATE user_account
SET
    email = $2,
    display_name = $3,
    firebase_id = $4,
    phone_number = $5,
    photo_url = $6
WHERE id = $1
RETURNING id, display_name, email, firebase_id, phone_number, photo_url, created_at
`

type UpdateUserAccountParams struct {
	ID          pgtype.UUID `json:"id"`
	Email       string      `json:"email"`
	DisplayName string      `json:"displayName"`
	FirebaseID  string      `json:"firebaseId"`
	PhoneNumber string      `json:"phoneNumber"`
	PhotoUrl    string      `json:"photoUrl"`
}

func (q *Queries) UpdateUserAccount(ctx context.Context, arg UpdateUserAccountParams) (UserAccount, error) {
	row := q.db.QueryRow(ctx, updateUserAccount,
		arg.ID,
		arg.Email,
		arg.DisplayName,
		arg.FirebaseID,
		arg.PhoneNumber,
		arg.PhotoUrl,
	)
	var i UserAccount
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Email,
		&i.FirebaseID,
		&i.PhoneNumber,
		&i.PhotoUrl,
		&i.CreatedAt,
	)
	return i, err
}
