.PHONY: up down rebuild-all rebuild-one restart logs logs-app shell db-shell

up:
	@echo "🚀 Starting application in docker..."
	@docker build -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d
	@echo "✅ Application started successfully!"
	@echo "💡 Use 'make logs' to view logs"

down:
	@echo "🛑 Stopping all services..."
	@docker compose --profile node --profile system down
	@echo "✅ All services stopped"

rebuild-all:
	@echo "🔨 Rebuilding and restarting entire project..."
	@docker build --cache-from "list_am_bot-dev:latest" -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d --build --force-recreate
	@echo "✅ Project rebuilt and restarted!"

rebuild-one:
	@echo "🔨 Rebuilding bot service (list_am_bot.core)..."
	@docker build --cache-from "list_am_bot-dev:latest" -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose up list_am_bot.core -d --build --force-recreate
	@echo "✅ Bot service rebuilt and restarted!"

restart:
	@echo "♻️  Restarting application..."
	@docker compose --profile node up -d --force-recreate
	@echo "✅ Application restarted!"

logs:
	@echo "📋 Watching logs for list_am_bot.core..."
	@docker logs --follow list_am_bot.core

shell:
	@echo "🐚 Accessing bot container shell..."
	@docker exec -it list_am_bot.core bash
