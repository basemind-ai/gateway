# BaseMind Gateway

The BaseMind Gateway is a fully managed backend for using AI models from different providers.

## How does it work?

![System Diagram](./assets/system-diagram.png 'System Diagram')

The core service is the "API Gateway" written in Golang. It allows gRPC based clients to connect to it and through it
to AI providers such as OpenAI, Cohere etc.

The architecture is generic, with the client libraries exposing a uniform interface to the API Gateway- regardless of the
AI provider being used. The API Gateway then translates the requests to the specific AI provider's "connector service".
The connector services are dedicated services that are responsible for interacting with the given AI provider using its
official client libraries.

This architecture allows different connector services to be implemented in different languages, and to add additional capabilities as required.

All the configuration required to define an AI prompt is handled via UI using the "Frontend Dashboard". The dashboard allows
users, and teams of users, to manage the configuration used for a specific application - which model to use, which prompt, whatever additional
configuration is given, etc. The configuration is then injected into requests provided by the client libraries, without
needing to set any configuration in code - everything is stored in the database, with an additional layer of Redis caching for
performance.

<center>

![Request / Response Flow](./assets/request-response-flow.png 'Request Flow Diagram')

</center>

The fundamental idea is to "lift-out" the configuration out of code and inject it into the request.

## Benefits

The concept behind the gateway is to allow client applications to connect to AI models from different providers in an agnostic fashion.
Basically - if AI models are a commodity, clients should be able to consume them without caring about the implementation details.
At one point it might make sense to use a model from a specific provider, and in another it would prove smart to switch. Why have vendor lock-in hardcoded?

Also, the Gateway allows a single app to have multiple clients, each with its own provider/model configuration and specific prompts

## Why is this open source?

We started this project as a SaaS product. We eventually understood that as a product - competing against the giants in the market, this is a dead end.
On the other hand, we invested significant work in making this - and we think people might find value in this code as open source.

Our hope is that people would like to contribute to this, so it can become an open source project. Otherwise, the code is open source and can be reused by others.

### Note on SaaS

At the time of writing this readme, the codebase still reflects our SaaS logic. For example, there is price calculation logic already implemented. User
invitation logic. Project management logic etc.

Overtime, this should be removed from the codebase to make it more useful for companies that want to deploy it in their own cloud.

## Client Libraries

Client libraries are available for different languages. The client libraries are responsible for handling the gRPC communication with the API Gateway.
Because gRPC is used, its easy to create new client libraries for other languages - its just a matter of generating the gRPC stubs and implementing the logic.
See:

-   [iOS Client Library](https://github.com/basemind-ai/sdk-ios)
-   [Android client library](https://github.com/basemind-ai/sdk-android)
-   [Flutter/Dart client library](https://github.com/basemind-ai/sdk-dart)

## Repository Structure

```text
root                        # repository root, holding all tooling configurations
├─── .bin                   # executable scripts
├─── .github                # GitHub CI/CD and other configurations
├─── .idea                  # IDE configurations that are shared
├─── .secrets               # secret values that are gitignored
├─── assets                 # images used for branding
├─── cloud-functions        # GCP cloud functions
├─── docs                   # documentation static site
├─── docker                 # docker files
├─── frontend               # frontend web-app
├─── gen                    # code generated from the protobuf schemas under `proto`
│    ├─── go                # golang gen-code
│    └─── ts                # typescript gen-code
├─── proto                  # protobuf schemas
│    ├─── gateway           # api-gateway protobuf schema
│    ├─── openai            # openai-connector protobuf schema
│    ├─── cohere            # cohere-connector protobuf schema
│    └─── ptesting          # api-gateway prompt testing protobuf schema
├─── services               # microservices
│   ├─── api-gateway        # api-gateway
│   ├─── dashboard-backend  # backend for the frontend web-app
│   ├─── cohere-connector   # cohere connector
│   └─── openai-connector   # openai connector
├─── shared                 # shared code
│   ├─── go                 # golang shared packages
│   └─── ts                 # typescript shared packages
└─── sql                    # SQL schema and query files from which we generate the DB DAL (Data Access Layer)
    └─── migrations         # DB migrations
```

## Installation

1. Install [TaskFile](https://taskfile.dev/) and the following prerequisites:

    - Node >= 20
    - Go >= 1.22
    - Docker >= 24.0
    - Python >= 3.11

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
