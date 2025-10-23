#!/bin/sh

if [ -f "/usr/src/app/src/infrastructure/database/database.provider.ts" ]; then
  ./node_modules/.bin/ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run \
    -d /usr/src/app/src/infrastructure/database/database.provider.ts

  echo "Migrations applied..."
fi
echo "Starting service..."

node ./dist/main.js
