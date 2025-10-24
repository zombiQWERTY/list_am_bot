# 🛠️ Development Workflow

Comprehensive guide for developing List.am Bot.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Docker Workflow](#docker-workflow)
- [Database Management](#database-management)
- [Development Cycle](#development-cycle)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)

---

## Environment Setup

### Required Tools

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local IDE support)
- Git
- Make

### Initial Setup

```bash
# Clone repository
git clone https://github.com/zombiQWERTY/list_am_bot.git
cd list_am_bot

# Install dependencies locally (for IDE autocomplete)
npm install

# Create environment file
cp env.example .env

# Edit .env with your settings
# Minimum required: BOT_TOKEN
nano .env
```

---

## Docker Workflow

### Container Architecture

The project uses Docker Compose with two main services:

- **list_am_bot.core** — Main application container
- **list_am_bot.postgres** — PostgreSQL database

### Starting Development Environment

```bash
# Build and start all services
make up

# This is equivalent to:
docker build -t "list_am_bot-dev:latest" -f ./infra/dev/Dockerfile .
docker compose --profile node --profile system up -d
```

### Stopping Services

```bash
# Stop all services
make down

# Stop without removing containers
docker compose stop
```

### Viewing Logs

```bash
# Follow bot logs
make logs

# View all logs
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100

# View PostgreSQL logs
docker compose logs list_am_bot.postgres
```

---

## Database Management

### First Time Setup

After starting services for the first time, create database schemas:

```bash
# Access container
docker exec -it list_am_bot.core bash

# Create schemas
psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"

# Run existing migrations
/tmp/typeorm-migrate.sh

# Exit
exit
```

### Creating Migrations

When you modify entities, create a migration:

```bash
# Access container
make shell

# Generate migration from entity changes
/tmp/typeorm-generate.sh AddUserEmailField

# Review generated migration in:
# src/infrastructure/database/migrations/

# Apply migration
/tmp/typeorm-migrate.sh

# Exit
exit
```

### Running Migrations

```bash
# Inside container
/tmp/typeorm-migrate.sh

# Or from host
docker exec -it list_am_bot.core /tmp/typeorm-migrate.sh
```

### Reverting Migrations

```bash
# Revert last migration
docker exec -it list_am_bot.core /tmp/typeorm-revert.sh

# Revert multiple migrations
# Run the command multiple times
```

### Direct Database Access

```bash
docker exec -it list_am_bot.postgres psql -U list_am_bot -d list_am_bot

# View tables
\dt

# View schema
\dn

# Exit
\q
```

---

## Development Cycle

### Typical Workflow

1. **Make code changes** in your IDE
2. **Rebuild if needed**
3. **Test the changes**
4. **View logs** for debugging
5. **Commit changes**

### When to Rebuild

#### Code Changes Only

If you only modified TypeScript files:

```bash
make restart
```

#### Added New Dependencies

If you ran `npm install`:

```bash
# Install locally
npm install <package-name>

# Rebuild container
make rebuild-one
```

#### Changed Docker Configuration

If you modified Dockerfile or docker-compose.yml:

```bash
make rebuild-all
```

#### Changed Database Schema

If you modified entities:

```bash
# Generate migration
make shell
/tmp/typeorm-generate.sh MigrationName
/tmp/typeorm-migrate.sh
exit

# Restart
make restart
```

---

## Testing

### Running Tests

```bash
# Inside container
docker exec -it list_am_bot.core npm run test

# With coverage
docker exec -it list_am_bot.core npm run test:cov

# Watch mode
docker exec -it list_am_bot.core npm run test:watch

# Locally (if dependencies installed)
npm run test
```

### Test Structure

```
src/
├── application/
│   └── user/
│       ├── user.service.ts
│       └── __tests__/
│           └── user.service.spec.ts  ← Unit tests
└── infrastructure/
    └── database/
        └── typeorm/
            └── repositories/
                ├── user.repository.ts
                └── __tests__/
                    └── user.repository.spec.ts
```

### Writing Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Debugging

### Access Container Shell

```bash
make shell

# Or manually
docker exec -it list_am_bot.core bash
```

### View Environment Variables

```bash
# Inside container
printenv | grep BOT
printenv | grep POSTGRES
```

### Check Running Processes

```bash
# Inside container
ps aux

# Node.js process
ps aux | grep node
```

### Inspect Network

```bash
# View Docker networks
docker network ls

# Inspect network
docker network inspect list_am_bot_default
```

### Debug Database Connection

```bash
# Test connection from container
docker exec -it list_am_bot.core bash -c 'psql $POSTGRES_BASE_URL -c "SELECT 1"'

# Should return:
# ?column?
# ----------
#        1
```

---

## Common Tasks

### Updating Dependencies

```bash
# Update package.json
npm install <package>@latest

# Rebuild container
make rebuild-one
```

### Cleaning Up

```bash
# Remove containers and volumes
make down
docker system prune -a --volumes

# Remove only project volumes
docker volume rm list_am_bot_postgres_data
```

### Resetting Database

```bash
# Stop services
make down

# Remove database volume
docker volume rm list_am_bot_postgres_data

# Start services
make up

# Recreate schemas and run migrations
make shell
psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"
/tmp/typeorm-migrate.sh
exit
```

### Checking Application Health

```bash
# View logs for startup messages
make logs

# Should see:
# ✅ Bot started successfully
# 🔄 Scheduler initialized
# 📊 Connected to PostgreSQL

# Check bot responds
# Send /start to bot in Telegram
```

### Exporting Logs

```bash
# Export all logs to file
docker compose logs > logs/debug.log

# Export last hour
docker compose logs --since 1h > logs/recent.log

# Export bot logs only
make logs > logs/bot.log 2>&1
```

### Performance Profiling

```bash
# Check container resource usage
docker stats list_am_bot.core

# View memory usage
docker exec -it list_am_bot.core node -e "console.log(process.memoryUsage())"
```

### Monitoring Metrics

The bot automatically collects performance metrics in the database:

```bash
# Connect to database
make db-shell

# View scraping performance
SELECT type, AVG(value) as avg_duration, COUNT(*) as count
FROM core.metric
WHERE type = 'scrape_duration'
GROUP BY type;

# View notification success rate
SELECT
  SUM(CASE WHEN type = 'notification_success' THEN 1 ELSE 0 END) as success,
  SUM(CASE WHEN type = 'notification_failure' THEN 1 ELSE 0 END) as failure,
  ROUND(100.0 * SUM(CASE WHEN type = 'notification_success' THEN 1 ELSE 0 END) /
    NULLIF(COUNT(*), 0), 2) as success_rate
FROM core.metric
WHERE type IN ('notification_success', 'notification_failure');

# View recent queue sizes
SELECT value as queue_size, created_at
FROM core.metric
WHERE type = 'queue_size'
ORDER BY created_at DESC
LIMIT 10;

# View active subscriptions over time
SELECT value as subscriptions, created_at
FROM core.metric
WHERE type = 'active_subscriptions'
ORDER BY created_at DESC
LIMIT 10;
```

**Metrics Architecture:**

- `MetricsService` — Application layer service for recording metrics
- `MetricRepository` — Infrastructure layer for database operations
- `MetricEntity` — Domain entity representing a metric
- `MetricsReportService` — Application layer service for generating reports
- `MetricsReportSchedulerService` — Infrastructure cron job for daily reports
- All metrics are saved asynchronously with error handling to avoid performance impact

**Daily Reports:**

Automated daily metrics reports are sent to the admin (if configured) at 9:00 AM. The report includes:

- Performance metrics for last 24 hours, 7 days, and 30 days
- Scraping duration, notification success rate, queue size, active subscriptions
- Formatted message with HTML for easy reading in Telegram

To receive reports, set `BOT_INCIDENTS_USER_ID` in `.env` file.

---

## Environment Variables Reference

### Required

- `BOT_TOKEN` — Telegram bot token from BotFather
- `POSTGRES_BASE_URL` — Full PostgreSQL connection string

### Optional

- `BOT_INCIDENTS_USER_ID` — Admin Telegram ID for errors
- `CRON_SCHEDULE` — Scraping schedule (default: `0 * * * *`)
- `REQUEST_DELAY_MS` — Delay between requests (default: `2500`)
- `LOG_LEVEL` — Logging verbosity (default: `info`)

See [env.example](env.example) for complete list.

---

## Troubleshooting

### Build Fails

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild from scratch
make down
docker system prune -a
make rebuild-all
```

### Port Conflicts

```bash
# Check what's using port 5432
lsof -i :5432

# Kill process or change port in docker-compose.dev.yml
```

### Container Won't Start

```bash
# Check container status
docker ps -a

# View container logs
docker logs list_am_bot.core

# Inspect container
docker inspect list_am_bot.core
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection from container
docker exec -it list_am_bot.core psql $POSTGRES_BASE_URL -c "SELECT 1"

# Check environment variables
docker exec -it list_am_bot.core printenv | grep POSTGRES
```

---

## Best Practices

### Code Changes

1. ✅ Make changes in IDE
2. ✅ Test locally if possible
3. ✅ Rebuild container: `make rebuild-one`
4. ✅ Check logs: `make logs`
5. ✅ Test in Telegram
6. ✅ Commit with conventional commit message

### Database Changes

1. ✅ Modify entity
2. ✅ Generate migration: tmpopt/typeorm-generate.sh`
3. ✅ Review migration file
4. ✅ Test migration: tmpopt/typeorm-migrate.sh`
5. ✅ Test rollback: tmpopt/typeorm-revert.sh`
6. ✅ Re-apply: tmpopt/typeorm-migrate.sh`
7. ✅ Commit entity AND migration

### Before Committing

```bash
# Format code
npm run format

# Lint
npm run lint

# Build
npm run build

# Test
docker exec -it list_am_bot.core npm run test
```

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy coding!** 🚀
