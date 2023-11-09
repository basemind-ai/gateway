-- Modify "prompt_request_record" table
ALTER TABLE "prompt_request_record" ADD COLUMN "request_tokens_cost" numeric NOT NULL, ADD COLUMN "response_tokens_cost" numeric NOT NULL;
