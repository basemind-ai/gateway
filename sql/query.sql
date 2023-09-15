-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM "user" WHERE firebase_id = $1);

-- name: CreateUser :one
INSERT INTO "user" (firebase_id)
VALUES ($1)
RETURNING *;

-- name: FindUserByFirebaseId :one
SELECT
    id,
    firebase_id,
    created_at
FROM "user"
WHERE firebase_id = $1;

-- name: FindProjectsByUserId :many
SELECT
    p.created_at,
    p.description,
    p.id,
    p.name,
    up.is_user_default_project,
    up.permission
FROM project AS p
INNER JOIN user_project AS up ON p.id = up.project_id
WHERE up.user_id = $1;

-- name: CreateProject :one
INSERT INTO project (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: CreateUserProject :one
INSERT INTO user_project (
    user_id, project_id, permission, is_user_default_project
)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteUser :exec
DELETE
FROM "user"
WHERE firebase_id = $1;

-- name: DeleteUserProject :exec
DELETE
FROM "user_project"
WHERE project_id = $1;

-- name: DeleteProject :exec
DELETE
FROM "project"
WHERE id = $1;

-- name: CreateApplication :one
INSERT INTO application (
    project_id,
    name,
    description,
    model_type,
    model_vendor,
    model_parameters,
    prompt_template,
    template_variables,
    project_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: UpdateApplication :one
UPDATE application
SET
    name = $2,
    description = $3,
    model_type = $4,
    model_vendor = $5,
    model_parameters = $6,
    prompt_template = $7,
    template_variables = $8
WHERE id = $1 RETURNING *;

-- name: DeleteApplication :exec
DELETE FROM application
WHERE id = $1;

-- name: FindApplicationById :one
SELECT * -- noqa: L044
FROM application
WHERE id = $1;
