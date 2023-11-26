## Project initialization

1. Use google cloud SDK for credentials setup.
2. Then run following command-
    > gcloud auth application-default login
3. Then run -
    > terraform init -backend-config="bucket=<tfstate-bucket-name>"
