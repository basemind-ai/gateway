#!/bin/bash

if ! command -v detekt &> /dev/null
then
    if command -v brew &> /dev/null
    then
        brew install detekt
    elif command -v scoop &> /dev/null
    then
        scoop install detekt
    else
      echo "detekt could not be found, please install it on your system by following the instructions here: https://detekt.dev/docs/gettingstarted/cli"
      exit
    fi
fi

fileArray=("$@")
detektInput=$(IFS=,;printf  "%s" "${fileArray[*]}")
OUTPUT=$(detekt --all-rules --auto-correct --input "$detektInput" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  printf "%s" "$OUTPUT"
  exit $EXIT_CODE
fi
