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
    public_key
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateApplication :one
UPDATE "application"
SET
    app_id = $1,
    description = $2,
    name = $3,
    public_key = $4,
    updated_at = NOW()
WHERE id = $5 RETURNING *;

-- name: DeleteApplication :exec
DELETE FROM "application"
WHERE id = $1;

-- name: FindApplicationByAppIdAndProjectId :one
SELECT
    id,
    app_id,
    description,
    name,
    public_key
FROM "application"
WHERE app_id = $1 AND project_id = $2;

-- name: FindProjectApplications :many
SELECT
    id,
    app_id,
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
    prompt_config_id,
    version,
    is_latest
) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: FindPromptConfigByAppId :one
SELECT
    pc.id,
    pc.model_type,
    pc.model_vendor,
    pc.model_parameters,
    pc.prompt_template,
    pc.template_variables,
    pc.created_at,
    pc.updated_at
FROM "prompt_config" AS pc
LEFT JOIN "application_prompt_config" AS apc ON pc.id = apc.prompt_config_id
WHERE apc.application_id = $1 AND (apc.version = $2 OR apc.is_latest = true);
