-- Create enum type "access_permission_type"
CREATE TYPE "access_permission_type" AS ENUM ('ADMIN', 'MEMBER');
-- Create "project" table
CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(256) NOT NULL, "description" text NOT NULL, PRIMARY KEY ("id"));
-- Create "api_token" table
CREATE TABLE "api_token" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "project_id" uuid NOT NULL, "token" character varying(128) NOT NULL, "name" character varying(256) NOT NULL, "description" text NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "expiry_date" timestamptz NULL, PRIMARY KEY ("id"), CONSTRAINT "api_token_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "user" table
CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "firebase_id" character varying(128) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"));
-- Create index "idx_firebase_id" to table: "user"
CREATE UNIQUE INDEX "idx_firebase_id" ON "user" ("firebase_id");
-- Create "user_project" table
CREATE TABLE "user_project" ("user_id" uuid NOT NULL, "project_id" uuid NOT NULL, "permission" "access_permission_type" NOT NULL, "is_user_default_project" boolean NOT NULL DEFAULT false, PRIMARY KEY ("user_id", "project_id"), CONSTRAINT "user_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
