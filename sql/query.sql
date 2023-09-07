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
INSERT INTO "application" (
    app_id,
    description,
    name,
    project_id,
    public_key,
    version
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateApplication :one
UPDATE "application"
SET
    app_id = $1,
    version = $2,
    description = $3,
    name = $4,
    public_key = $5,
    updated_at = NOW()
WHERE id = $6 RETURNING *;

-- name: DeleteApplication :exec
DELETE FROM "application"
WHERE id = $1;

-- name: FindApplicationByAppAndVersionId :one
SELECT
    id,
    app_id,
    version,
    description,
    name,
    public_key
FROM "application"
WHERE app_id = $1 AND version = $2 AND project_id = $3;

-- name: FindApplicationById :one
SELECT
    id,
    app_id,
    version,
    description,
    name,
    public_key
FROM "application"
WHERE id = $1;

-- name: FindProjectApplications :many
SELECT
    id,
    app_id,
    version,
    description,
    name
FROM "application"
WHERE project_id = $1;

-- name: CreatePromptConfig :one
INSERT INTO "prompt_config" (
    model_type,
    model_vendor,
    model_parameters,
    prompt_template,
    template_variables
) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: UpdatePromptConfig :one
UPDATE "prompt_config"
SET
    model_type = $1,
    model_vendor = $2,
    model_parameters = $3,
    prompt_template = $4,
    template_variables = $5
WHERE id = $6 RETURNING *;

-- name: DeletePromptConfig :exec
DELETE FROM "prompt_config"
WHERE id = $1;

-- name: CreateApplicationPromptConfig :one
INSERT INTO "application_prompt_config" (
    application_id,
    prompt_config_id
) VALUES ($1, $2) RETURNING *;
