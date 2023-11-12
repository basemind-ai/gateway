---- provider key

-- name: CreateProviderKey :one
INSERT INTO provider_key (model_vendor, encrypted_api_key, project_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: RetrieveProviderKey :one
SELECT
    id,
    model_vendor,
    encrypted_api_key
FROM provider_key WHERE project_id = $1 AND model_vendor = $2;

-- name: CheckProviderKeyExists :one
SELECT EXISTS(SELECT 1 FROM provider_key WHERE id = $1);

-- name: DeleteProviderKey :exec
DELETE FROM provider_key WHERE id = $1;

-- name: RetrieveProjectProviderKeys :many
SELECT
    id,
    model_vendor,
    created_at
FROM provider_key WHERE project_id = $1;
