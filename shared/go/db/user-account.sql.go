// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.22.0
// source: user-account.sql

package db

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

const createUserAccount = `-- name: CreateUserAccount :one
INSERT INTO user_account (firebase_id)
VALUES ($1)
RETURNING id, firebase_id, created_at
`

func (q *Queries) CreateUserAccount(ctx context.Context, firebaseID string) (UserAccount, error) {
	row := q.db.QueryRow(ctx, createUserAccount, firebaseID)
	var i UserAccount
	err := row.Scan(&i.ID, &i.FirebaseID, &i.CreatedAt)
	return i, err
}

const retrieveUserAccount = `-- name: RetrieveUserAccount :one
SELECT
    id,
    firebase_id,
    created_at
FROM user_account
WHERE firebase_id = $1
`

func (q *Queries) RetrieveUserAccount(ctx context.Context, firebaseID string) (UserAccount, error) {
	row := q.db.QueryRow(ctx, retrieveUserAccount, firebaseID)
	var i UserAccount
	err := row.Scan(&i.ID, &i.FirebaseID, &i.CreatedAt)
	return i, err
}

const retrieveUserAccountData = `-- name: RetrieveUserAccountData :many
SELECT
    u.id AS user_id,
    u.firebase_id,
    u.created_at AS user_created_at,
    up.is_user_default_project,
    up.permission,
    p.id AS project_id,
    p.created_at AS project_created_at,
    p.name AS project_name,
    p.description AS project_description,
    a.id AS application_id,
    a.name AS application_name,
    a.description AS application_description,
    a.created_at AS application_created_at,
    a.updated_at AS application_updated_at
FROM user_account AS u
LEFT JOIN user_project AS up ON u.id = up.user_id
LEFT JOIN project AS p ON up.project_id = p.id
LEFT JOIN application AS a ON p.id = a.project_id
WHERE
    u.firebase_id = $1
    AND p.deleted_at IS NULL
`

type RetrieveUserAccountDataRow struct {
	UserID                 pgtype.UUID              `json:"userId"`
	FirebaseID             string                   `json:"firebaseId"`
	UserCreatedAt          pgtype.Timestamptz       `json:"userCreatedAt"`
	IsUserDefaultProject   pgtype.Bool              `json:"isUserDefaultProject"`
	Permission             NullAccessPermissionType `json:"permission"`
	ProjectID              pgtype.UUID              `json:"projectId"`
	ProjectCreatedAt       pgtype.Timestamptz       `json:"projectCreatedAt"`
	ProjectName            pgtype.Text              `json:"projectName"`
	ProjectDescription     pgtype.Text              `json:"projectDescription"`
	ApplicationID          pgtype.UUID              `json:"applicationId"`
	ApplicationName        pgtype.Text              `json:"applicationName"`
	ApplicationDescription pgtype.Text              `json:"applicationDescription"`
	ApplicationCreatedAt   pgtype.Timestamptz       `json:"applicationCreatedAt"`
	ApplicationUpdatedAt   pgtype.Timestamptz       `json:"applicationUpdatedAt"`
}

func (q *Queries) RetrieveUserAccountData(ctx context.Context, firebaseID string) ([]RetrieveUserAccountDataRow, error) {
	rows, err := q.db.Query(ctx, retrieveUserAccountData, firebaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RetrieveUserAccountDataRow
	for rows.Next() {
		var i RetrieveUserAccountDataRow
		if err := rows.Scan(
			&i.UserID,
			&i.FirebaseID,
			&i.UserCreatedAt,
			&i.IsUserDefaultProject,
			&i.Permission,
			&i.ProjectID,
			&i.ProjectCreatedAt,
			&i.ProjectName,
			&i.ProjectDescription,
			&i.ApplicationID,
			&i.ApplicationName,
			&i.ApplicationDescription,
			&i.ApplicationCreatedAt,
			&i.ApplicationUpdatedAt,
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
