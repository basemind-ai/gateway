-- name: CreateUser :one
INSERT INTO "user" (firebase_id, display_name, email, phone_number, photo_url, provider_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByFirebaseId :one
SELECT *
FROM "user"
WHERE firebase_id = $1
LIMIT 1;

-- name: GetUserById :one
SELECT *
FROM "user"
WHERE id = $1
LIMIT 1;

-- name: GetUserProjects :many
SELECT *
FROM "project"
         LEFT JOIN "user_project" ON "project".id = "user_project".project_id
WHERE "user_project".user_id = $1;

-- name: getProjectApiTokensPublicData: many
SELECT "name", "description", "is_revoked", "created_at", "expiry_date"
FROM "api_token"
WHERE "project_id" = $1;
