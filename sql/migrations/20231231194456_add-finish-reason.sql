-- Create enum type "prompt_finish_reason"
CREATE TYPE "prompt_finish_reason" AS ENUM ('DONE', 'ERROR', 'LIMIT');
-- Modify "prompt_request_record" table
ALTER TABLE "prompt_request_record" ADD COLUMN "finish_reason" "prompt_finish_reason" NOT NULL DEFAULT 'DONE';
