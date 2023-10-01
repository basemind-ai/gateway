-- Drop index "idx_prompt_config_name" from table: "prompt_config"
DROP INDEX "idx_prompt_config_name";
-- Modify "prompt_config" table
ALTER TABLE "prompt_config" ALTER COLUMN "expected_template_variables" SET NOT NULL;
-- Create index "prompt_config_name_application_id_key" to table: "prompt_config"
CREATE UNIQUE INDEX "prompt_config_name_application_id_key" ON "prompt_config" ("name", "application_id");
-- Drop index "idx_firebase_id" from table: "user"
DROP INDEX "idx_firebase_id";
-- Create index "user_firebase_id_key" to table: "user"
CREATE UNIQUE INDEX "user_firebase_id_key" ON "user" ("firebase_id");
