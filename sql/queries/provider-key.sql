---- provider key

-- name: CreateProviderKey :one
INSERT INTO provider_key (model_vendor, api_key, project_id)
VALUES ($1, $2, $3)
RETURNING id;

-- name: RetrieveProviderKey :one
SELECT
    id,
    model_vendor,
    api_key
FROM provider_key WHERE project_id = $1 AND model_vendor = $2;

-- name: DeleteProviderKey :exec
DELETE FROM provider_key WHERE id = $1;
