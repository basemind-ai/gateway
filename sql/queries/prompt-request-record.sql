---- prompt request record

-- name: CreatePromptRequestRecord :one
INSERT INTO prompt_request_record (
    is_stream_response,
    request_tokens,
    response_tokens,
    start_time,
    finish_time,
    stream_response_latency,
    prompt_config_id,
    error_log
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: RetrieveTotalPromptRequestRecord :one
SELECT COUNT(prr.id) AS total_requests
FROM prompt_request_record prr
JOIN prompt_config pc ON prr.prompt_config_id = pc.id
WHERE
    pc.application_id = $1
    AND prr.created_at BETWEEN $2 AND $3;

-- name: RetrieveTotalTokensPerPromptConfig :many
SELECT SUM(prr.request_tokens + prr.response_tokens) AS total_tokens, pc.model_type
FROM prompt_request_record prr
JOIN prompt_config pc ON prr.prompt_config_id = pc.id
WHERE
    pc.application_id = $1
    AND prr.created_at BETWEEN $2 AND $3
GROUP BY pc.model_type;
