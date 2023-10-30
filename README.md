# BaseMind.AI Monorepo

This is a TypeScript and Golang monorepo, hosting the BaseMind.AI backend services.

## Repository Structure

```text
root                        # repository root, holding all tooling configurations
├─── .bin                   # executable scripts
├─── .github                # GitHub CI/CD and other configurations
├─── .idea                  # IDE configurations that are shared
├─── .secrets               # secret values that are gitignored
├─── assets                 # images used for branding
├─── docker                 # docker files
├─── frontend               # frontend web-app
├─── gen                    # code generated from the protobuf schemas under `proto`
│    ├─── go                # golang gen-code
│    └─── ts                # typescript gen-code
├─── proto                  # protobuf schemas
│    ├─── gateway           # api-gateway protobuf schema
│    ├─── openai            # openai-connector protobuf schema
│    └─── ptesting          # api-gateway prompt testing protobuf schema
├─── sdks                   # client libraries that connect to our API gateway
│    └─── android           # android apps
│         ├─── test-app     # test application
│         └─── sdk          # android sdk
├─── services               # microservices
│   ├─── api-gateway        # api-gateway
│   ├─── dashboard-backend  # backend for the frontend web-app
│   └─── openai-connector   # openai-connector
├─── shared                 # shared code
│   ├─── go                 # golang shared packages
│   └─── ts                 # typescript shared packages
└─── sql                    # SQL schema and query files from which we generate the DB DAL (Data Access Layer)
    └─── migrations         # DB migrations
```

## Installation

1. Install [TaskFile](https://taskfile.dev/) and the following prerequisites:

    - Node >= 20
    - Go >= 1.21
    - Docker >= 24.0
    - Python >= 3.11
    - Java >= 17.0

2. Execute the setup task with:

```shell
task setup
```

### TaskFile

We use [TaskFile](https://taskfile.dev/) to orchestrate tooling and commands.
To see all the available commands run:

```shell
task --list
```

### Docker

We use docker for both deployment and local development. There is a `docker-compose.yaml` file in the repository's root
which should be used for local development.

#### Docker Compose Commands

-   `docker compose up --build` to build and start all microservices.
-   `docker compose up --build <service-name>` to build and start a single service.

Note: add `--detach` to run docker compose in the background.

### Development Database

We use Postgres as our database, to bring up the database for local development, execute `task db:up`.

### SQLC

We use SQLC to generate typesafe GO out of SQL queries.

1. install [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html) on your machine.
2. update the [schema.sql](sql/schema.sql) or [queries.sql](sql/schema.sql) file under the `sql` directory.
3. execute `sqlc generate` to generate the typesafe GO code.

### DB Migrations

We use [atlas](https://github.com/ariga/atlas) for migrating the database.

1. install [atlas](https://github.com/ariga/atlas) on your machine.
2. migrate the database locally for development by executing `task migrations:apply` in the repository root.

Note: you can create new migrations using the task command: `task migrations:create -- <migration_name>`

### Secrets

Configuration files that should not be committed into git are stored under the `.secrets` folder.

You will need to receive them from another developer and they must be communicated securely using a service such
as [yopass](https://yopass.se/).

You will need to add the following files:

-   `.env.frontend` - this is an ENV file for the frontend application.
-   `serviceAccountKey.json` - this is a GCP / firebase configuration file for backend applications.

### Proto Files

We use gRPC and protobuf files. The proto files are located under the `proto` folder and the generated code is stored
under the `gen` folder. We use the [buf](https://buf.build/product/cli) cli tool to generate the code, as well as lint
and format the proto files (done via pre-commit).

## Testing

To test the project end-to-end do the following:

1. If you haven't migrated the database, begin by executing `task migrations:apply`.
2. Seed the database by executing `task e2e:seed`. You might want to first clean the database of previous
   data by executing `task e2e:clean` before hand, but this is optional.
3. The `e2e:seed` command will log into the terminal the `apiKeyID` for the application that has been created.
   Copy this value into you clipboard, and now execute `task e2e:create-jwt <apiKeyID>`, where <apiKeyID> is
   the value you copied to your clipboard.
4. The `e2e:create-jwt` command will print an encoded JWT token into the terminal, copy this value and save it.
5. Bring up the docker services with `docker compose up --build`.
6. Once the docker services are up you can test using postman. Load the proto file for the `api-gateway` service in postman,
   and set the metadata header for authorization in the following format - key `authorization`, value `bearer <jwt-token>`.

## Storybook

We use [Storybook](https://storybook.js.org/) to develop frontend components with ease. To start the storybook server,
cd into the frontend folder and execute the npm script:

```shell
cd frontend
pnpm run storybook
```

The storybook configurations are under `frontend/.storybook` and the stories are under `frontend/stories`.
