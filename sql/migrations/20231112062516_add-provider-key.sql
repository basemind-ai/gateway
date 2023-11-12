-- Create "provider_key" table
CREATE TABLE "provider_key" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "model_vendor" "model_vendor" NOT NULL, "api_key" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "project_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "provider_key_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_provider_key_project_id" to table: "provider_key"
CREATE INDEX "idx_provider_key_project_id" ON "provider_key" ("project_id");
-- Create index "provider_key_model_vendor_key" to table: "provider_key"
CREATE UNIQUE INDEX "provider_key_model_vendor_key" ON "provider_key" ("model_vendor");
