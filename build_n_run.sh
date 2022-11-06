#!/bin/bash

npm run-script build
RESULT=$?
if [ $RESULT -eq 0 ]; then
 npm run-script run
fi

