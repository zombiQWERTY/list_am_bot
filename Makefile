.PHONY: up down rebuild-all rebuild-one restart logs logs-app shell db-shell

up:
	@echo "🚀 Starting application in docker..."
	@docker build -t "listambot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d
	@echo "✅ Application started successfully!"
	@echo "💡 Use 'make logs' to view logs"

down:
	@echo "🛑 Stopping all services..."
	@docker compose --profile node --profile system down
	@echo "✅ All services stopped"

rebuild-all:
	@echo "🔨 Rebuilding and restarting entire project..."
	@docker build --cache-from "listambot-dev:latest" -t "listambot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose --profile node --profile system up -d --build --force-recreate
	@echo "✅ Project rebuilt and restarted!"

rebuild-one:
	@echo "🔨 Rebuilding bot service (listambot.core)..."
	@docker build --cache-from "listambot-dev:latest" -t "listambot-dev:latest" -f ./infra/dev/Dockerfile .
	@docker compose up listambot.core -d --build --force-recreate
	@echo "✅ Bot service rebuilt and restarted!"

restart:
	@echo "♻️  Restarting application..."
	@docker compose --profile node up -d --force-recreate
	@echo "✅ Application restarted!"

logs:
	@echo "📋 Watching logs for listambot.core..."
	@docker logs --follow listambot.core

shell:
	@echo "🐚 Accessing bot container shell..."
	@docker exec -it listambot.core bash
