#!/bin/sh

if [ -z "$1" ]; then
  echo "Usage: ./migration-create.sh MigrationName"
  exit 1
fi

./node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:create \
  ./src/infrastructure/database/typeorm/migrations/"$1"