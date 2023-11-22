-- Create enum type "access_permission_type"
CREATE TYPE "access_permission_type" AS ENUM ('ADMIN', 'MEMBER');
-- Create enum type "model_vendor"
CREATE TYPE "model_vendor" AS ENUM ('OPEN_AI', 'COHERE');
-- Create enum type "model_type"
CREATE TYPE "model_type" AS ENUM ('gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k', 'command', 'command-light', 'command-nightly', 'command-light-nightly');
-- Create "project" table
CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "description" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, PRIMARY KEY ("id"));
-- Create index "idx_project_name" to table: "project"
CREATE INDEX "idx_project_name" ON "project" ("name") WHERE (deleted_at IS NULL);
-- Create "application" table
CREATE TABLE "application" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "description" text NOT NULL, "name" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, "project_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "application_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_application_project_id" to table: "application"
CREATE INDEX "idx_application_project_id" ON "application" ("project_id") WHERE (deleted_at IS NULL);
-- Create "api_key" table
CREATE TABLE "api_key" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "is_internal" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, "application_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "api_key_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_api_key_application_id" to table: "api_key"
CREATE INDEX "idx_api_key_application_id" ON "api_key" ("application_id") WHERE (deleted_at IS NULL);
-- Create "prompt_config" table
CREATE TABLE "prompt_config" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "model_parameters" json NOT NULL, "model_type" "model_type" NOT NULL, "model_vendor" "model_vendor" NOT NULL, "provider_prompt_messages" json NOT NULL, "expected_template_variables" character varying(255)[] NOT NULL, "is_default" boolean NOT NULL DEFAULT true, "is_test_config" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, "application_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "prompt_config_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_prompt_config_application_id" to table: "prompt_config"
CREATE INDEX "idx_prompt_config_application_id" ON "prompt_config" ("application_id") WHERE (deleted_at IS NULL);
-- Create index "idx_prompt_config_created_at" to table: "prompt_config"
CREATE INDEX "idx_prompt_config_created_at" ON "prompt_config" ("created_at") WHERE (deleted_at IS NULL);
-- Create index "idx_prompt_config_is_default" to table: "prompt_config"
CREATE INDEX "idx_prompt_config_is_default" ON "prompt_config" ("is_default") WHERE (deleted_at IS NULL);
-- Create index "prompt_config_name_application_id_key" to table: "prompt_config"
CREATE UNIQUE INDEX "prompt_config_name_application_id_key" ON "prompt_config" ("name", "application_id");
-- Create "provider_model_pricing" table
CREATE TABLE "provider_model_pricing" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "model_type" "model_type" NOT NULL, "model_vendor" "model_vendor" NOT NULL, "input_token_price" numeric NOT NULL, "output_token_price" numeric NOT NULL, "token_unit_size" integer NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "active_from_date" date NOT NULL DEFAULT CURRENT_DATE, "active_to_date" date NULL, PRIMARY KEY ("id"));
-- Create index "idx_provider_model_pricing_active_from_date" to table: "provider_model_pricing"
CREATE INDEX "idx_provider_model_pricing_active_from_date" ON "provider_model_pricing" ("active_from_date");
-- Create index "idx_provider_model_pricing_active_to_date" to table: "provider_model_pricing"
CREATE INDEX "idx_provider_model_pricing_active_to_date" ON "provider_model_pricing" ("active_to_date");
-- Create index "idx_provider_model_pricing_model_type" to table: "provider_model_pricing"
CREATE INDEX "idx_provider_model_pricing_model_type" ON "provider_model_pricing" ("model_type");
-- Create index "idx_provider_model_pricing_model_vendor" to table: "provider_model_pricing"
CREATE INDEX "idx_provider_model_pricing_model_vendor" ON "provider_model_pricing" ("model_vendor");
-- Create "prompt_request_record" table
CREATE TABLE "prompt_request_record" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "is_stream_response" boolean NOT NULL DEFAULT false, "request_tokens" integer NOT NULL, "response_tokens" integer NOT NULL, "request_tokens_cost" numeric NOT NULL, "response_tokens_cost" numeric NOT NULL, "start_time" timestamptz NOT NULL, "finish_time" timestamptz NOT NULL, "duration_ms" integer NULL, "prompt_config_id" uuid NULL, "error_log" text NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz NULL, "provider_model_pricing_id" uuid NULL, PRIMARY KEY ("id"), CONSTRAINT "prompt_request_record_prompt_config_id_fkey" FOREIGN KEY ("prompt_config_id") REFERENCES "prompt_config" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "prompt_request_record_provider_model_pricing_id_fkey" FOREIGN KEY ("provider_model_pricing_id") REFERENCES "provider_model_pricing" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_prompt_request_record_finish_time" to table: "prompt_request_record"
CREATE INDEX "idx_prompt_request_record_finish_time" ON "prompt_request_record" ("finish_time") WHERE (deleted_at IS NULL);
-- Create index "idx_prompt_request_record_pricing_id" to table: "prompt_request_record"
CREATE INDEX "idx_prompt_request_record_pricing_id" ON "prompt_request_record" ("provider_model_pricing_id") WHERE (deleted_at IS NULL);
-- Create index "idx_prompt_request_record_prompt_config_id" to table: "prompt_request_record"
CREATE INDEX "idx_prompt_request_record_prompt_config_id" ON "prompt_request_record" ("prompt_config_id") WHERE (deleted_at IS NULL);
-- Create index "idx_prompt_request_record_start_time" to table: "prompt_request_record"
CREATE INDEX "idx_prompt_request_record_start_time" ON "prompt_request_record" ("start_time") WHERE (deleted_at IS NULL);
-- Create "prompt_test_record" table
CREATE TABLE "prompt_test_record" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "variable_values" json NOT NULL, "response" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "prompt_request_record_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "prompt_test_record_prompt_request_record_id_fkey" FOREIGN KEY ("prompt_request_record_id") REFERENCES "prompt_request_record" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_prompt_test_record_created_at" to table: "prompt_test_record"
CREATE INDEX "idx_prompt_test_record_created_at" ON "prompt_test_record" ("created_at");
-- Create index "idx_prompt_test_record_prompt_request_record_id" to table: "prompt_test_record"
CREATE INDEX "idx_prompt_test_record_prompt_request_record_id" ON "prompt_test_record" ("prompt_request_record_id");
-- Create "provider_key" table
CREATE TABLE "provider_key" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "model_vendor" "model_vendor" NOT NULL, "encrypted_api_key" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "project_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "provider_key_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_provider_key_model_vendor_project_id" to table: "provider_key"
CREATE UNIQUE INDEX "idx_provider_key_model_vendor_project_id" ON "provider_key" ("model_vendor", "project_id");
-- Create index "idx_provider_key_project_id" to table: "provider_key"
CREATE INDEX "idx_provider_key_project_id" ON "provider_key" ("project_id");
-- Create "user_account" table
CREATE TABLE "user_account" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "display_name" character varying(255) NOT NULL, "email" character varying(320) NOT NULL, "firebase_id" character varying(128) NOT NULL, "phone_number" character varying(255) NOT NULL, "photo_url" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"));
-- Create index "user_account_email_key" to table: "user_account"
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account" ("email");
-- Create index "user_account_firebase_id_key" to table: "user_account"
CREATE UNIQUE INDEX "user_account_firebase_id_key" ON "user_account" ("firebase_id");
-- Create "user_project" table
CREATE TABLE "user_project" ("user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "permission" "access_permission_type" NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("user_id", "project_id"), CONSTRAINT "user_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_user_project_project_id" to table: "user_project"
CREATE INDEX "idx_user_project_project_id" ON "user_project" ("project_id");
-- Create index "idx_user_project_user_id" to table: "user_project"
CREATE INDEX "idx_user_project_user_id" ON "user_project" ("user_id");
