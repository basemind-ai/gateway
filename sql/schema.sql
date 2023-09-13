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

-- application
CREATE TABLE application
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id text NOT NULL,
    description text NOT NULL,
    name varchar(256) NOT NULL,
    public_key text NOT NULL,
    project_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_app_id_project_id ON application (
    app_id, project_id
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

-- prompt-config
CREATE TABLE prompt_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type model_type NOT NULL,
    model_vendor model_vendor NOT NULL,
    model_parameters json NOT NULL,
    prompt_template json NOT NULL,
    template_variables json NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- application-prompt-config many-to-many
CREATE TABLE application_prompt_config (
    application_id uuid NOT NULL,
    prompt_config_id uuid NOT NULL,
    version serial NOT NULL,
    is_latest boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY (application_id, prompt_config_id),
    FOREIGN KEY (application_id) REFERENCES application (id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_config_id) REFERENCES prompt_config (
        id
    ) ON DELETE CASCADE
);
