.PHONY: up rebuild-all rebuild-one restart logs

up:
	@echo "Running application in docker..."
	@docker build -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d

rebuild-all:
	@echo "Rebuilding and running application in docker..."
	@docker build --cache-from "list_am_bot-dev:latest" -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d --build --force-recreate

rebuild-one:
	@echo "Rebuilding and running application in docker for list_am_bot.core..."
	@docker build --cache-from "list_am_bot-dev:latest" -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose up list_am_bot.core -d --build --force-recreate

restart:
	@echo "Rebuilding and running application in docker..."
	@docker compose --profile node up -d --force-recreate

logs:
	@echo "Watching logs for list_am_bot.core..."
	@docker logs --follow list_am_bot.core
