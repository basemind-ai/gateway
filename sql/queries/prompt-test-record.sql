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
