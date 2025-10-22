#!/bin/sh

if [ -z "$1" ]; then
  echo "Usage: ./typeorm-generate.sh MigrationName"
  exit 1
fi

./node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate \
  -d ./src/infrastructure/database/database.provider.ts \
  ./src/infrastructure/database/typeorm/migrations/"$1"