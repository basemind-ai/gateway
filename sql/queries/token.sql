---- token

-- name: CreateToken :one
INSERT INTO token (application_id, name)
VALUES ($1, $2)
RETURNING *;

-- name: RetrieveTokens :many
SELECT
    id,
    name,
    created_at
FROM token
WHERE
    application_id = $1
    AND deleted_at IS NULL
ORDER BY created_at;

-- name: DeleteToken :exec
UPDATE token
SET deleted_at = NOW()
WHERE id = $1;
