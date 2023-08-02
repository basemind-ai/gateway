# backend-services

## setup

### pre-commit

We use pre-commit to orchestrate linting.

1. install [pre-commit](https://pre-commit.com/) on your machine.
2. install the pre-commit hooks by executing `pre-commit install` in the repository root.

#### pre-commit commands

- `pre-commit autoupdate` to update the hooks
- `pre-commit run --all-files` to execute against all files

### sqlc

We use SQLC to generate typesafe SQL queries. 

1. install [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html) on your machine.
2. 
