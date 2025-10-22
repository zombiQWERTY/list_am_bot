#!/bin/sh

echo "Migrating typeorm migrations..."

./node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run \
  -d ./src/infrastructure/database/database.provider.ts