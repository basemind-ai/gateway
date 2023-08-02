-- user
CREATE TABLE "user"
(
    id           uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    firebase_id  varchar(128) NOT NULL,
    display_name text         NOT NULL,
    email        text         NOT NULL,
    phone_number varchar(128) NOT NULL,
    photo_url    text         NOT NULL,
    provider_id  text         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_firebase_id ON "user" (firebase_id);

-- permission_type
CREATE TYPE access_permission_type AS ENUM (
    'ADMIN',
    'MEMBER'
    );

-- project
CREATE TABLE project
(
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(256) NOT NULL,
    description text         NOT NULL
);

-- user-project many-to-many
CREATE TABLE user_project
(
    user_id    uuid                   NOT NULL,
    project_id uuid                   NOT NULL,
    permission access_permission_type NOT NULL,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

-- api_token
CREATE TABLE api_token
(
    id          uuid PRIMARY KEY      DEFAULT gen_random_uuid(),
    project_id  uuid         NOT NULL,
    token       varchar(128) NOT NULL,
    name        varchar(256) NOT NULL,
    description text         NOT NULL,
    is_revoked  boolean      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

