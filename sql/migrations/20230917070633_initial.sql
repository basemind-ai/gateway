-- Create enum type "access_permission_type"
CREATE TYPE "access_permission_type" AS ENUM ('ADMIN', 'MEMBER');
-- Create enum type "model_vendor"
CREATE TYPE "model_vendor" AS ENUM ('OPEN_AI');
-- Create enum type "model_type"
CREATE TYPE "model_type" AS ENUM ('gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k');
-- Create "project" table
CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(256) NOT NULL, "description" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"));
-- Create "application" table
CREATE TABLE "application" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "description" text NOT NULL, "model_parameters" json NOT NULL, "model_type" "model_type" NOT NULL, "model_vendor" "model_vendor" NOT NULL, "name" character varying(256) NOT NULL, "prompt_messages" json[] NOT NULL, "expected_template_variables" character varying(256)[] NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "project_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "application_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "user" table
CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "firebase_id" character varying(128) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"));
-- Create index "idx_firebase_id" to table: "user"
CREATE UNIQUE INDEX "idx_firebase_id" ON "user" ("firebase_id");
-- Create "user_project" table
CREATE TABLE "user_project" ("user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "permission" "access_permission_type" NOT NULL, "is_user_default_project" boolean NOT NULL DEFAULT false, PRIMARY KEY ("user_id", "project_id"), CONSTRAINT "user_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
