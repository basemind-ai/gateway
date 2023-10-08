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
    id,
    description,
    name,
    created_at,
    updated_at
FROM project
WHERE id = $1 AND deleted_at IS NULL;

-- name: RetrieveProjects :many
SELECT
    p.id,
    p.name,
    p.description,
    up.permission,
    up.is_user_default_project,
    p.created_at,
    p.updated_at
FROM user_project AS up
LEFT JOIN user_account AS ua ON up.user_id = ua.id
LEFT JOIN project AS p ON up.project_id = p.id
WHERE
    ua.firebase_id = $1 AND p.deleted_at IS NULL;
