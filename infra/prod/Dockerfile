ARG BASE_IMAGE
FROM $BASE_IMAGE AS build

WORKDIR /usr/src/app

RUN npm prune --production

FROM node:20-alpine AS run

WORKDIR /usr/src/app

RUN apk upgrade --no-cache --no-interactive
RUN apk add --no-cache tzdata
ENV TZ=Asia/Yerevan

COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/apps /usr/src/app/apps

COPY ./infra/prod/entrypoint.sh /tmp/entrypoint.sh

RUN chmod +x /tmp/entrypoint.sh && \
  chmod +x /tmp/typeorm-migrate.sh && \
  chmod +x /tmp/typeorm-revert.sh && \
  chmod +x /tmp/typeorm-generate.sh && \
