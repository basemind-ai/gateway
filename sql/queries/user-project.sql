---- user_project

-- name: CreateUserProject :one
INSERT INTO user_project (user_id, project_id, permission)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateUserProjectPermission :one
UPDATE user_project
SET
    permission = $3,
    updated_at = NOW()
WHERE
    user_id = $1
    AND project_id = $2
RETURNING *;

-- name: RetrieveUserProject :one
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
    AND p.id = $2 AND p.deleted_at IS NULL;
