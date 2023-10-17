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

-- name: RetrieveApplicationAPIRequestCount :one
SELECT COUNT(prr.id) AS total_requests
FROM application AS a
INNER JOIN prompt_config AS pc ON a.id = pc.application_id
INNER JOIN prompt_request_record AS prr ON pc.id = prr.prompt_config_id
WHERE
    a.id = $1
    AND prr.created_at BETWEEN $2 AND $3;

-- name: RetrieveApplicationTokensCount :many
SELECT
    pc.model_type,
    SUM(prr.request_tokens + prr.response_tokens) AS total_tokens
FROM application AS a
INNER JOIN prompt_config AS pc ON a.id = pc.application_id
INNER JOIN prompt_request_record AS prr ON pc.id = prr.prompt_config_id
WHERE
    a.id = $1
    AND prr.created_at BETWEEN $2 AND $3
GROUP BY pc.model_type;
