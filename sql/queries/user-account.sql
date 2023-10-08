---- user_account

-- name: CheckUserAccountExists :one
SELECT EXISTS(SELECT 1 FROM user_account WHERE firebase_id = $1);

-- name: RetrieveUserAccount :one
SELECT
    id,
    firebase_id,
    created_at
FROM user_account
WHERE firebase_id = $1;

-- name: CreateUserAccount :one
INSERT INTO user_account (firebase_id)
VALUES ($1)
RETURNING *;

-- name: RetrieveUserAccountData :many
SELECT
    u.id AS user_id,
    u.firebase_id,
    u.created_at AS user_created_at,
    up.is_user_default_project,
    up.permission,
    p.id AS project_id,
    p.created_at AS project_created_at,
    p.name AS project_name,
    p.description AS project_description,
    a.id AS application_id,
    a.name AS application_name,
    a.description AS application_description,
    a.created_at AS application_created_at,
    a.updated_at AS application_updated_at
FROM user_account AS u
LEFT JOIN user_project AS up ON u.id = up.user_id
LEFT JOIN project AS p ON up.project_id = p.id
LEFT JOIN application AS a ON p.id = a.project_id
WHERE
    u.firebase_id = $1
    AND p.deleted_at IS NULL;
