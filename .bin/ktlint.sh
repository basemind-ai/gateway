#!/bin/bash

if ! command -v ktlint &> /dev/null
then
    if command -v brew &> /dev/null
    then
        brew install ktlint
    else
      echo "ktlint could not be found, please install it on your system by following the instructions here: https://pinterest.github.io/ktlint/1.0.0/install/cli/"
      exit
    fi
fi

fileArray=("$@")
ktlintInput=$(IFS=,;printf  "%s" "${fileArray[*]}")
OUTPUT=$(ktlint --experimental "$ktlintInput" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  printf "%s" "$OUTPUT"
  exit $EXIT_CODE
fi
