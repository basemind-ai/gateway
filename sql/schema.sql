-- user
CREATE TABLE "user"
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_id varchar(128) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
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
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(256) NOT NULL,
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- user-project many-to-many
CREATE TABLE user_project
(
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    permission access_permission_type NOT NULL,
    is_user_default_project boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

-- model_vendor
CREATE TYPE model_vendor AS ENUM (
    'OPEN_AI'
);

-- model_type
CREATE TYPE model_type AS ENUM (
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-4',
    'gpt-4-32k'
);

-- application
CREATE TABLE application
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    description text NOT NULL,
    model_parameters json NOT NULL,
    model_type model_type NOT NULL,
    model_vendor model_vendor NOT NULL,
    name varchar(256) NOT NULL,
    prompt_template json NOT NULL,
    template_variables json NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    project_id uuid NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);
