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
    name varchar(256) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    project_id uuid NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

-- prompt-config
CREATE TABLE prompt_config
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(256) NOT NULL,
    model_parameters json NOT NULL,
    model_type model_type NOT NULL,
    model_vendor model_vendor NOT NULL,
    prompt_messages json NOT NULL,
    template_variables varchar(256) [] NULL,
    is_active boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    application_id uuid NOT NULL,
    FOREIGN KEY (application_id) REFERENCES application (id) ON DELETE CASCADE
);

-- prompt-request-record
CREATE TABLE prompt_request_record
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_response boolean NOT NULL DEFAULT FALSE,
    request_tokens int NOT NULL,
    start_time timestamptz NOT NULL,
    finish_time timestamptz NOT NULL,
    prompt_config_id uuid NOT NULL,
    FOREIGN KEY (prompt_config_id) REFERENCES prompt_config (
        id
    ) ON DELETE CASCADE
);

-- prompt-test
CREATE TABLE prompt_test
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(256) NOT NULL,
    variable_values json NOT NULL,
    response text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    prompt_request_record_id uuid NOT NULL,
    FOREIGN KEY (prompt_request_record_id) REFERENCES prompt_request_record (
        id
    ) ON DELETE CASCADE
);
