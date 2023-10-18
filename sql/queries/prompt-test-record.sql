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
    prr.stream_response_latency
FROM prompt_test_record AS ptr
LEFT JOIN prompt_request_record AS prr ON ptr.prompt_request_record_id = prr.id
WHERE ptr.id = $1;
