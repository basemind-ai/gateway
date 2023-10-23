---- token

-- name: CreateToken :one
INSERT INTO token (application_id, name, is_internal)
VALUES ($1, $2, $3)
RETURNING *;

-- name: RetrieveTokens :many
SELECT
    t.id,
    t.name,
    t.created_at
FROM token AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    app.id = $1
    AND t.deleted_at IS NULL AND app.deleted_at IS NULL AND t.is_internal = FALSE
ORDER BY t.created_at;

-- name: DeleteToken :exec
UPDATE token
SET deleted_at = NOW()
WHERE id = $1;

-- name: RetrieveApplicationIDForToken :one
SELECT app.id
FROM token AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    t.id = $1
    AND t.deleted_at IS NULL
    AND app.deleted_at IS NULL;

-- name: RetrieveApplicationInternalTokenID :one
SELECT t.id
FROM token AS t
LEFT JOIN application AS app ON t.application_id = app.id
WHERE
    app.id = $1
    AND t.deleted_at IS NULL
    AND app.deleted_at IS NULL
    AND t.is_internal = TRUE;
