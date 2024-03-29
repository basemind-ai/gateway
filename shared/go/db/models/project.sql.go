// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.25.0
// source: project.sql

package models

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createProject = `-- name: CreateProject :one

INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING id, name, description, credits, created_at, updated_at, deleted_at
`

type CreateProjectParams struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// -- project
func (q *Queries) CreateProject(ctx context.Context, arg CreateProjectParams) (Project, error) {
	row := q.db.QueryRow(ctx, createProject, arg.Name, arg.Description)
	var i Project
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Description,
		&i.Credits,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const deleteProject = `-- name: DeleteProject :exec
UPDATE project
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeleteProject(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteProject, id)
	return err
}

const retrieveProject = `-- name: RetrieveProject :one
SELECT
    p.id,
    p.description,
    p.name,
    p.credits,
    p.created_at,
    p.updated_at
FROM project AS p
WHERE p.id = $1 AND p.deleted_at IS NULL
`

type RetrieveProjectRow struct {
	ID          pgtype.UUID        `json:"id"`
	Description string             `json:"description"`
	Name        string             `json:"name"`
	Credits     pgtype.Numeric     `json:"credits"`
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz `json:"updatedAt"`
}

func (q *Queries) RetrieveProject(ctx context.Context, id pgtype.UUID) (RetrieveProjectRow, error) {
	row := q.db.QueryRow(ctx, retrieveProject, id)
	var i RetrieveProjectRow
	err := row.Scan(
		&i.ID,
		&i.Description,
		&i.Name,
		&i.Credits,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const retrieveProjectAPIRequestCount = `-- name: RetrieveProjectAPIRequestCount :one
SELECT COUNT(prr.id) AS total_requests
FROM project AS p
INNER JOIN application AS a ON p.id = a.project_id
INNER JOIN prompt_config AS pc ON a.id = pc.application_id
INNER JOIN prompt_request_record AS prr ON pc.id = prr.prompt_config_id
WHERE
    p.id = $1
    AND prr.created_at BETWEEN $2 AND $3
`

type RetrieveProjectAPIRequestCountParams struct {
	ID          pgtype.UUID        `json:"id"`
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	CreatedAt_2 pgtype.Timestamptz `json:"createdAt2"`
}

func (q *Queries) RetrieveProjectAPIRequestCount(ctx context.Context, arg RetrieveProjectAPIRequestCountParams) (int64, error) {
	row := q.db.QueryRow(ctx, retrieveProjectAPIRequestCount, arg.ID, arg.CreatedAt, arg.CreatedAt_2)
	var total_requests int64
	err := row.Scan(&total_requests)
	return total_requests, err
}

const retrieveProjectForUser = `-- name: RetrieveProjectForUser :one
SELECT
    p.id,
    p.description,
    p.name,
    up.permission,
    p.credits,
    p.created_at,
    p.updated_at
FROM project AS p
LEFT JOIN user_project AS up ON p.id = up.project_id
LEFT JOIN user_account AS ua ON up.user_id = ua.id
WHERE p.id = $1 AND ua.firebase_id = $2 AND p.deleted_at IS NULL
`

type RetrieveProjectForUserParams struct {
	ID         pgtype.UUID `json:"id"`
	FirebaseID string      `json:"firebaseId"`
}

type RetrieveProjectForUserRow struct {
	ID          pgtype.UUID              `json:"id"`
	Description string                   `json:"description"`
	Name        string                   `json:"name"`
	Permission  NullAccessPermissionType `json:"permission"`
	Credits     pgtype.Numeric           `json:"credits"`
	CreatedAt   pgtype.Timestamptz       `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz       `json:"updatedAt"`
}

func (q *Queries) RetrieveProjectForUser(ctx context.Context, arg RetrieveProjectForUserParams) (RetrieveProjectForUserRow, error) {
	row := q.db.QueryRow(ctx, retrieveProjectForUser, arg.ID, arg.FirebaseID)
	var i RetrieveProjectForUserRow
	err := row.Scan(
		&i.ID,
		&i.Description,
		&i.Name,
		&i.Permission,
		&i.Credits,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const retrieveProjectTokensTotalCost = `-- name: RetrieveProjectTokensTotalCost :one
SELECT COALESCE(SUM(prr.request_tokens_cost + prr.response_tokens_cost), 0)
FROM project AS p
INNER JOIN application AS app ON p.id = app.project_id
LEFT JOIN prompt_config AS pc ON app.id = pc.application_id
LEFT JOIN prompt_request_record AS prr ON pc.id = prr.prompt_config_id
WHERE
    p.id = $1
    AND prr.created_at BETWEEN $2 AND $3
`

type RetrieveProjectTokensTotalCostParams struct {
	ID          pgtype.UUID        `json:"id"`
	CreatedAt   pgtype.Timestamptz `json:"createdAt"`
	CreatedAt_2 pgtype.Timestamptz `json:"createdAt2"`
}

func (q *Queries) RetrieveProjectTokensTotalCost(ctx context.Context, arg RetrieveProjectTokensTotalCostParams) (pgtype.Numeric, error) {
	row := q.db.QueryRow(ctx, retrieveProjectTokensTotalCost, arg.ID, arg.CreatedAt, arg.CreatedAt_2)
	var coalesce pgtype.Numeric
	err := row.Scan(&coalesce)
	return coalesce, err
}

const retrieveProjects = `-- name: RetrieveProjects :many
SELECT
    p.id,
    p.name,
    p.description,
    up.permission,
    p.credits,
    p.created_at,
    p.updated_at
FROM user_project AS up
LEFT JOIN project AS p ON up.project_id = p.id
LEFT JOIN user_account AS ua ON up.user_id = ua.id
WHERE
    ua.firebase_id = $1 AND p.deleted_at IS NULL
`

type RetrieveProjectsRow struct {
	ID          pgtype.UUID          `json:"id"`
	Name        pgtype.Text          `json:"name"`
	Description pgtype.Text          `json:"description"`
	Permission  AccessPermissionType `json:"permission"`
	Credits     pgtype.Numeric       `json:"credits"`
	CreatedAt   pgtype.Timestamptz   `json:"createdAt"`
	UpdatedAt   pgtype.Timestamptz   `json:"updatedAt"`
}

func (q *Queries) RetrieveProjects(ctx context.Context, firebaseID string) ([]RetrieveProjectsRow, error) {
	rows, err := q.db.Query(ctx, retrieveProjects, firebaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RetrieveProjectsRow
	for rows.Next() {
		var i RetrieveProjectsRow
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.Description,
			&i.Permission,
			&i.Credits,
			&i.CreatedAt,
			&i.UpdatedAt,
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

const updateProject = `-- name: UpdateProject :one
UPDATE project
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING id, name, description, credits, created_at, updated_at, deleted_at
`

type UpdateProjectParams struct {
	ID          pgtype.UUID `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
}

func (q *Queries) UpdateProject(ctx context.Context, arg UpdateProjectParams) (Project, error) {
	row := q.db.QueryRow(ctx, updateProject, arg.ID, arg.Name, arg.Description)
	var i Project
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Description,
		&i.Credits,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const updateProjectCredits = `-- name: UpdateProjectCredits :exec
UPDATE project
SET credits = credits + $2
WHERE id = $1
`

type UpdateProjectCreditsParams struct {
	ID      pgtype.UUID    `json:"id"`
	Credits pgtype.Numeric `json:"credits"`
}

func (q *Queries) UpdateProjectCredits(ctx context.Context, arg UpdateProjectCreditsParams) error {
	_, err := q.db.Exec(ctx, updateProjectCredits, arg.ID, arg.Credits)
	return err
}
