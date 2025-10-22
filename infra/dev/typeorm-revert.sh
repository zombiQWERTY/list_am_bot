#!/bin/sh

echo "Reverting typeorm migrations..."

./node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:revert \
  -d ./src/infrastructure/database/database.provider.ts