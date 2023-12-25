// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.24.0
// source: user-project.sql

package models

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const checkUserProjectExists = `-- name: CheckUserProjectExists :one

SELECT EXISTS(
    SELECT 1
    FROM user_project AS up
    LEFT JOIN project AS p ON up.project_id = p.id
    LEFT JOIN user_account AS ua ON up.user_id = ua.id
    WHERE
        ua.email = $1
        AND up.project_id = $2
        AND p.deleted_at IS NULL
)
`

type CheckUserProjectExistsParams struct {
	Email     string      `json:"email"`
	ProjectID pgtype.UUID `json:"projectId"`
}

// -- user_project
func (q *Queries) CheckUserProjectExists(ctx context.Context, arg CheckUserProjectExistsParams) (bool, error) {
	row := q.db.QueryRow(ctx, checkUserProjectExists, arg.Email, arg.ProjectID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const createUserProject = `-- name: CreateUserProject :one
INSERT INTO user_project (user_id, project_id, permission)
VALUES ($1, $2, $3)
RETURNING user_id, project_id, permission, created_at, updated_at
`

type CreateUserProjectParams struct {
	UserID     pgtype.UUID          `json:"userId"`
	ProjectID  pgtype.UUID          `json:"projectId"`
	Permission AccessPermissionType `json:"permission"`
}

func (q *Queries) CreateUserProject(ctx context.Context, arg CreateUserProjectParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, createUserProject, arg.UserID, arg.ProjectID, arg.Permission)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteUserProject = `-- name: DeleteUserProject :exec
DELETE FROM user_project
WHERE
    user_id = $1
    AND project_id = $2
`

type DeleteUserProjectParams struct {
	UserID    pgtype.UUID `json:"userId"`
	ProjectID pgtype.UUID `json:"projectId"`
}

func (q *Queries) DeleteUserProject(ctx context.Context, arg DeleteUserProjectParams) error {
	_, err := q.db.Exec(ctx, deleteUserProject, arg.UserID, arg.ProjectID)
	return err
}

const retrieveUserProject = `-- name: RetrieveUserProject :one
SELECT
    up.user_id,
    up.project_id,
    up.permission,
    up.created_at,
    up.updated_at
FROM user_project AS up
LEFT JOIN user_account AS ua ON up.user_id = ua.id
LEFT JOIN project AS p ON up.project_id = p.id
WHERE
    ua.firebase_id = $1
    AND up.project_id = $2 AND p.deleted_at IS NULL
`

type RetrieveUserProjectParams struct {
	FirebaseID string      `json:"firebaseId"`
	ProjectID  pgtype.UUID `json:"projectId"`
}

func (q *Queries) RetrieveUserProject(ctx context.Context, arg RetrieveUserProjectParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, retrieveUserProject, arg.FirebaseID, arg.ProjectID)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateUserProjectPermission = `-- name: UpdateUserProjectPermission :one
UPDATE user_project
SET
    permission = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING user_id, project_id, permission, created_at, updated_at
`

type UpdateUserProjectPermissionParams struct {
	UserID     pgtype.UUID          `json:"userId"`
	ProjectID  pgtype.UUID          `json:"projectId"`
	Permission AccessPermissionType `json:"permission"`
}

func (q *Queries) UpdateUserProjectPermission(ctx context.Context, arg UpdateUserProjectPermissionParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, updateUserProjectPermission, arg.UserID, arg.ProjectID, arg.Permission)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
