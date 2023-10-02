-- user
CREATE TABLE "user"
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_id varchar(128) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (firebase_id)
);

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

CREATE INDEX idx_project_name ON project (name);

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

CREATE INDEX idx_user_project_user_id ON user_project (user_id);
CREATE INDEX idx_user_project_project_id ON user_project (project_id);

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

CREATE INDEX idx_application_project_id ON application (project_id);

-- prompt-config
CREATE TABLE prompt_config
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(256) NOT NULL,
    model_parameters json NOT NULL,
    model_type model_type NOT NULL,
    model_vendor model_vendor NOT NULL,
    provider_prompt_messages json NOT NULL,
    expected_template_variables varchar(256) [] NOT NULL,
    is_default boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    application_id uuid NOT NULL,
    FOREIGN KEY (application_id) REFERENCES application (id) ON DELETE CASCADE,
    UNIQUE (name, application_id)
);

CREATE INDEX idx_prompt_config_application_id ON prompt_config (application_id);
CREATE INDEX idx_prompt_config_is_default ON prompt_config (is_default);
CREATE INDEX idx_prompt_config_created_at ON prompt_config (created_at);

-- prompt-request-record
CREATE TABLE prompt_request_record
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_stream_response boolean NOT NULL DEFAULT FALSE,
    request_tokens int NOT NULL,
    response_tokens int NOT NULL,
    start_time timestamptz NOT NULL,
    finish_time timestamptz NOT NULL,
    stream_response_latency bigint NULL,
    prompt_config_id uuid NOT NULL,
    error_log text NULL,
    FOREIGN KEY (prompt_config_id) REFERENCES prompt_config (
        id
    ) ON DELETE CASCADE
);

CREATE INDEX idx_prompt_request_record_prompt_config_id ON prompt_request_record (
    prompt_config_id
);
CREATE INDEX idx_prompt_request_record_start_time ON prompt_request_record (
    start_time
);
CREATE INDEX idx_prompt_request_record_finish_time ON prompt_request_record (
    finish_time
);

-- prompt-test
CREATE TABLE prompt_test
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(256) NOT NULL,
    variable_values json NOT NULL,
    response text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    prompt_request_record_id uuid NOT NULL,
    FOREIGN KEY (prompt_request_record_id) REFERENCES prompt_request_record (
        id
    ) ON DELETE CASCADE
);

CREATE INDEX idx_prompt_test_prompt_request_record_id ON prompt_test (
    prompt_request_record_id
);
CREATE INDEX idx_prompt_test_created_at ON prompt_test (created_at);
