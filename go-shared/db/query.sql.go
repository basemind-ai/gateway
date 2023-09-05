// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.20.0
// source: query.sql

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const checkUserExists = `-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM "user" WHERE firebase_id = $1)
`

func (q *Queries) CheckUserExists(ctx context.Context, firebaseID string) (bool, error) {
	row := q.db.QueryRow(ctx, checkUserExists, firebaseID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}

const createProject = `-- name: CreateProject :one
INSERT INTO project (name, description)  values ($1, $2)
RETURNING id, name, description, created_at
`

type CreateProjectParams struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (q *Queries) CreateProject(ctx context.Context, arg CreateProjectParams) (Project, error) {
	row := q.db.QueryRow(ctx, createProject, arg.Name, arg.Description)
	var i Project
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Description,
		&i.CreatedAt,
	)
	return i, err
}

const createUser = `-- name: CreateUser :one
INSERT INTO  "user" (firebase_id) values ($1)
RETURNING id, firebase_id, created_at
`

func (q *Queries) CreateUser(ctx context.Context, firebaseID string) (User, error) {
	row := q.db.QueryRow(ctx, createUser, firebaseID)
	var i User
	err := row.Scan(&i.ID, &i.FirebaseID, &i.CreatedAt)
	return i, err
}

const createUserProject = `-- name: CreateUserProject :one
INSERT INTO user_project (user_id, project_id, permission, is_user_default_project) values ($1, $2, $3, $4)
RETURNING user_id, project_id, permission, is_user_default_project
`

type CreateUserProjectParams struct {
	UserID               pgtype.UUID          `json:"user_id"`
	ProjectID            pgtype.UUID          `json:"project_id"`
	Permission           AccessPermissionType `json:"permission"`
	IsUserDefaultProject bool                 `json:"is_user_default_project"`
}

func (q *Queries) CreateUserProject(ctx context.Context, arg CreateUserProjectParams) (UserProject, error) {
	row := q.db.QueryRow(ctx, createUserProject,
		arg.UserID,
		arg.ProjectID,
		arg.Permission,
		arg.IsUserDefaultProject,
	)
	var i UserProject
	err := row.Scan(
		&i.UserID,
		&i.ProjectID,
		&i.Permission,
		&i.IsUserDefaultProject,
	)
	return i, err
}

const deleteProject = `-- name: DeleteProject :exec
DELETE FROM "project" WHERE id = $1
`

func (q *Queries) DeleteProject(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteProject, id)
	return err
}

const deleteUser = `-- name: DeleteUser :exec
DELETE FROM "user" where firebase_id = $1
`

func (q *Queries) DeleteUser(ctx context.Context, firebaseID string) error {
	_, err := q.db.Exec(ctx, deleteUser, firebaseID)
	return err
}

const deleteUserProject = `-- name: DeleteUserProject :exec
DELETE FROM "user_project" WHERE project_id = $1
`

func (q *Queries) DeleteUserProject(ctx context.Context, projectID pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteUserProject, projectID)
	return err
}

const findProjectsByUserId = `-- name: FindProjectsByUserId :many
Select id, name, description, permission, is_user_default_project, created_at from project p inner join user_project up on p.id = up.project_id where up.user_id = $1
`

type FindProjectsByUserIdRow struct {
	ID                   pgtype.UUID          `json:"id"`
	Name                 string               `json:"name"`
	Description          string               `json:"description"`
	Permission           AccessPermissionType `json:"permission"`
	IsUserDefaultProject bool                 `json:"is_user_default_project"`
	CreatedAt            pgtype.Timestamptz   `json:"created_at"`
}

func (q *Queries) FindProjectsByUserId(ctx context.Context, userID pgtype.UUID) ([]FindProjectsByUserIdRow, error) {
	rows, err := q.db.Query(ctx, findProjectsByUserId, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []FindProjectsByUserIdRow
	for rows.Next() {
		var i FindProjectsByUserIdRow
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Description,
			&i.Permission,
			&i.IsUserDefaultProject,
			&i.CreatedAt,
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

const findUserByFirebaseId = `-- name: FindUserByFirebaseId :one
SELECT id, firebase_id, created_at from "user" where firebase_id = $1
`

func (q *Queries) FindUserByFirebaseId(ctx context.Context, firebaseID string) (User, error) {
	row := q.db.QueryRow(ctx, findUserByFirebaseId, firebaseID)
	var i User
	err := row.Scan(&i.ID, &i.FirebaseID, &i.CreatedAt)
	return i, err
}
