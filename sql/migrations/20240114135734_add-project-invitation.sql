-- Create "project_invitation" table
CREATE TABLE "project_invitation" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(320) NOT NULL, "project_id" uuid NOT NULL, "permission" "access_permission_type" NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id"), CONSTRAINT "project_invitation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_project_invitation_email_project_id" to table: "project_invitation"
CREATE UNIQUE INDEX "idx_project_invitation_email_project_id" ON "project_invitation" ("email", "project_id");
