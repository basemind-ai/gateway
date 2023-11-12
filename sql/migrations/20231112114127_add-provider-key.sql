-- Modify "provider_key" table
ALTER TABLE "provider_key" DROP COLUMN "api_key", ADD COLUMN "encrypted_api_key" character varying(255) NOT NULL;
