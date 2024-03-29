// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.25.0
// source: api-key.sql

package models

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createAPIKey = `-- name: CreateAPIKey :one

INSERT INTO api_key (application_id, name, is_internal)
VALUES ($1, $2, $3)
RETURNING id, name, is_internal, created_at, deleted_at, application_id
`

type CreateAPIKeyParams struct {
	ApplicationID pgtype.UUID `json:"applicationId"`
	Name          string      `json:"name"`
	IsInternal    bool        `json:"isInternal"`
}

// -- api-key
func (q *Queries) CreateAPIKey(ctx context.Context, arg CreateAPIKeyParams) (ApiKey, error) {
	row := q.db.QueryRow(ctx, createAPIKey, arg.ApplicationID, arg.Name, arg.IsInternal)
	var i ApiKey
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.IsInternal,
		&i.CreatedAt,
		&i.DeletedAt,
		&i.ApplicationID,
	)
	return i, err
}

const deleteAPIKey = `-- name: DeleteAPIKey :exec
UPDATE api_key
SET deleted_at = NOW()
WHERE id = $1
`

func (q *Queries) DeleteAPIKey(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteAPIKey, id)
	return err
}

const retrieveAPIKeys = `-- name: RetrieveAPIKeys :many
SELECT
    t.id,
    t.name,
    t.created_at
FROM api_key AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    app.id = $1
    AND t.deleted_at IS NULL AND app.deleted_at IS NULL AND t.is_internal = FALSE
ORDER BY t.created_at
`

type RetrieveAPIKeysRow struct {
	ID        pgtype.UUID        `json:"id"`
	Name      string             `json:"name"`
	CreatedAt pgtype.Timestamptz `json:"createdAt"`
}

func (q *Queries) RetrieveAPIKeys(ctx context.Context, id pgtype.UUID) ([]RetrieveAPIKeysRow, error) {
	rows, err := q.db.Query(ctx, retrieveAPIKeys, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []RetrieveAPIKeysRow
	for rows.Next() {
		var i RetrieveAPIKeysRow
		if err := rows.Scan(&i.ID, &i.Name, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const retrieveApplicationDataForAPIKey = `-- name: RetrieveApplicationDataForAPIKey :one
SELECT
    app.id AS application_id,
    app.project_id AS project_id
FROM api_key AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    t.id = $1
    AND t.deleted_at IS NULL
    AND app.deleted_at IS NULL
`

type RetrieveApplicationDataForAPIKeyRow struct {
	ApplicationID pgtype.UUID `json:"applicationId"`
	ProjectID     pgtype.UUID `json:"projectId"`
}

func (q *Queries) RetrieveApplicationDataForAPIKey(ctx context.Context, id pgtype.UUID) (RetrieveApplicationDataForAPIKeyRow, error) {
	row := q.db.QueryRow(ctx, retrieveApplicationDataForAPIKey, id)
	var i RetrieveApplicationDataForAPIKeyRow
	err := row.Scan(&i.ApplicationID, &i.ProjectID)
	return i, err
}

const retrieveApplicationInternalAPIKeyID = `-- name: RetrieveApplicationInternalAPIKeyID :one
SELECT t.id
FROM api_key AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    app.id = $1
    AND t.deleted_at IS NULL
    AND app.deleted_at IS NULL
    AND t.is_internal = TRUE
`

func (q *Queries) RetrieveApplicationInternalAPIKeyID(ctx context.Context, id pgtype.UUID) (pgtype.UUID, error) {
	row := q.db.QueryRow(ctx, retrieveApplicationInternalAPIKeyID, id)
	err := row.Scan(&id)
	return id, err
}
