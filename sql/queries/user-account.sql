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
