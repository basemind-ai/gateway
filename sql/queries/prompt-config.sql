---- prompt config

-- name: CreatePromptConfig :one
INSERT INTO prompt_config (
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    application_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: CheckDefaultPromptConfigExists :one
SELECT EXISTS(
    SELECT 1
    FROM prompt_config
    WHERE
        application_id = $1
        AND deleted_at IS NULL
        AND is_default = TRUE
);

-- name: UpdateDefaultPromptConfig :exec
UPDATE prompt_config
SET
    is_default = $2,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: UpdatePromptConfig :one
UPDATE prompt_config
SET
    name = $2,
    model_parameters = $3,
    model_type = $4,
    model_vendor = $5,
    provider_prompt_messages = $6,
    expected_template_variables = $7,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL
RETURNING *;

-- name: DeletePromptConfig :exec
UPDATE prompt_config
SET deleted_at = NOW()
WHERE id = $1;

-- name: RetrievePromptConfig :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: RetrievePromptConfigs :many
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    application_id = $1
    AND deleted_at IS NULL;

-- name: RetrieveDefaultPromptConfig :one
SELECT
    id,
    name,
    model_parameters,
    model_type,
    model_vendor,
    provider_prompt_messages,
    expected_template_variables,
    is_default,
    created_at,
    updated_at,
    application_id
FROM prompt_config
WHERE
    application_id = $1
    AND deleted_at IS NULL
    AND is_default = TRUE;
