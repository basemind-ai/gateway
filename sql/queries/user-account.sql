---- user_account

-- name: CheckUserAccountExists :one
SELECT EXISTS(SELECT 1 FROM user_account WHERE firebase_id = $1);

-- name: RetrieveUserAccount :one
SELECT
    id,
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url,
    created_at
FROM user_account
WHERE firebase_id = $1;

-- name: CreateUserAccount :one
INSERT INTO user_account (
    display_name,
    email,
    firebase_id,
    phone_number,
    photo_url
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
