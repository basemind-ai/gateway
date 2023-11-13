---- prompt test record

-- name: CreatePromptTestRecord :one
INSERT INTO prompt_test_record (
    name,
    variable_values,
    response,
    prompt_request_record_id
)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: RetrievePromptTestRecord :one
SELECT
    ptr.id,
    ptr.name,
    ptr.variable_values,
    ptr.response,
    ptr.created_at,
    prr.error_log,
    prr.start_time,
    prr.finish_time,
    prr.request_tokens,
    prr.response_tokens,
    prr.stream_response_latency,
    pc.provider_prompt_messages,
    pc.model_parameters,
    pc.model_type,
    pc.model_vendor,
    pc.is_test_config,
    pc.id AS prompt_config_id
FROM prompt_test_record AS ptr
LEFT JOIN prompt_request_record AS prr ON ptr.prompt_request_record_id = prr.id
LEFT JOIN prompt_config AS pc ON prr.prompt_config_id = pc.id
WHERE ptr.id = $1;

-- name: RetrievePromptTestRecords :many
SELECT
    ptr.id,
    ptr.name,
    ptr.variable_values,
    ptr.response,
    ptr.created_at,
    prr.error_log,
    prr.start_time,
    prr.finish_time,
    prr.request_tokens,
    prr.response_tokens,
    prr.stream_response_latency,
    pc.provider_prompt_messages,
    pc.model_parameters,
    pc.model_type,
    pc.model_vendor,
    pc.is_test_config,
    pc.id AS prompt_config_id
FROM prompt_test_record AS ptr
LEFT JOIN prompt_request_record AS prr ON ptr.prompt_request_record_id = prr.id
LEFT JOIN prompt_config AS pc ON prr.prompt_config_id = pc.id
LEFT JOIN application AS a ON pc.application_id = a.id
WHERE a.id = $1;

-- name: DeletePromptTestRecord :exec
DELETE FROM prompt_test_record WHERE id = $1;
