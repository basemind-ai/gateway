---- application

-- name: CreateApplication :one
INSERT INTO application (
    project_id,
    name,
    description
)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateApplication :one
UPDATE application
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteApplication :exec
UPDATE application
SET deleted_at = NOW()
WHERE id = $1;

-- name: RetrieveApplication :one
SELECT
    id,
    description,
    name,
    created_at,
    updated_at,
    project_id
FROM application
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: RetrieveApplications :many
SELECT
    id,
    description,
    name,
    created_at,
    updated_at,
    project_id
FROM application
WHERE
    project_id = $1
    AND deleted_at IS NULL;
