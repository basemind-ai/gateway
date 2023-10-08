---- project

-- name: CreateProject :one
INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateProject :one
UPDATE project
SET
    name = $2,
    description = $3,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING *;

-- name: DeleteProject :exec
UPDATE project
SET deleted_at = NOW()
WHERE id = $1;

-- name: RetrieveProject :one
SELECT
    p.id,
    p.description,
    p.name,
    up.permission,
    p.created_at,
    p.updated_at
FROM project AS p
LEFT JOIN user_project AS up ON p.id = up.project_id
LEFT JOIN user_account AS ua ON up.user_id = ua.id
WHERE p.id = $1 AND ua.firebase_id = $2 AND p.deleted_at IS NULL;

-- name: RetrieveProjects :many
SELECT
    p.id,
    p.name,
    p.description,
    up.permission,
    p.created_at,
    p.updated_at
FROM user_project AS up
LEFT JOIN project AS p ON up.project_id = p.id
LEFT JOIN user_account AS ua ON up.user_id = ua.id
WHERE
    ua.firebase_id = $1 AND p.deleted_at IS NULL;
