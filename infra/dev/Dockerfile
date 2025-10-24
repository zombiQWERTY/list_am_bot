FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY ./.husky/install.mjs ./.husky/install.mjs

COPY ./package.json .
COPY ./package-lock.json .
COPY ./webpack.config.js .
COPY ./nest-cli.json .
COPY ./tsconfig.json .
COPY ./tsconfig.build.json .

COPY ./infra/dev/ /tmp/

RUN chmod +x /tmp/entrypoint.sh && \
  chmod +x /tmp/typeorm-migrate.sh && \
  chmod +x /tmp/typeorm-revert.sh && \
  chmod +x /tmp/typeorm-generate.sh && \
  npm set progress=false && npm config set depth 0 && npm install
