#!/bin/bash

ng build superhero-library

echo "Building Schematics"

cd projects/superhero-library

tsc -p tsconfig.schematics.json

echo "Copying collections to dist"

cp collection.json ../../dist/superhero-library