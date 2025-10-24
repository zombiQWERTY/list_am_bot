# 🤖 List.am Bot

<div align="center">

**Smart Telegram bot for real-time monitoring of classified ads on list.am**

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.16-2CA5E0?style=for-the-badge&logo=telegram)](https://telegraf.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-WTFPL-green?style=for-the-badge)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Development](#-development) • [Troubleshooting](#-troubleshooting)

📚 **Documentation:** [Quick Start](QUICK_START.md) • [Development Guide](DEVELOPMENT.md) • [CI/CD Setup](CICD.md) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md)

</div>

---

## 📖 Overview

List.am Bot is a powerful Telegram bot that helps you never miss important deals on [list.am](https://www.list.am), Armenia's largest classifieds platform. Set up custom search queries and receive instant notifications when matching listings appear.

### Why List.am Bot?

- ⚡ **Real-time Notifications** — Get instant alerts for new listings matching your criteria
- 🎯 **Smart Filtering** — Advanced duplicate detection ensures you only see new ads
- 🔄 **Automatic Monitoring** — Scheduled scraping with configurable intervals
- 💾 **Persistent Sessions** — PostgreSQL-backed Telegram sessions for reliability
- 🛡️ **Production Ready** — Built with clean architecture, error handling, and monitoring
- 🚀 **Scalable** — Queue-based task processing with priority management
- 🐳 **Docker Support** — Easy deployment with Docker Compose

---

## ✨ Features

### Core Functionality

- **📝 Subscription Management**
  - Create multiple search subscriptions
  - Pause/resume notifications per user
  - View active subscriptions
  - Delete individual or all subscriptions

- **🔍 Intelligent Scraping**
  - HTML parsing with Cheerio
  - CloudFlare bypass support via FlareSolverr
  - Proxy rotation for reliability
  - Configurable retry logic and delays

- **📬 Smart Notifications**
  - Rich message formatting with listing details
  - Inline buttons for quick actions
  - Duplicate detection to avoid spam
  - User-friendly error handling

- **🎛️ Advanced Bot Features**
  - Multi-step wizards for subscription creation
  - Typed context with session support
  - Global exception filter with admin notifications
  - Webhook support for production deployments

- **📊 Monitoring & Metrics**
  - Real-time metrics collection and storage
  - Scraping performance tracking (duration, success rate)
  - Notification delivery statistics
  - Queue size monitoring
  - Active subscriptions tracking
  - Daily automated reports to admin (24h, 7d, 30d)

### Technical Highlights

- **Clean Architecture** with Domain-Driven Design principles
- **TypeORM** with migrations and repository pattern
- **Zod** validation for configuration
- **Winston** logging with daily rotation
- **Cron-based** scheduling with manual queue override
- **Transaction support** for data consistency
- **Built-in metrics** for performance monitoring
- **Rate limiting** for Telegram API and list.am scraping
- **Health checks** with automatic fallback mechanisms

---

## 🏗️ Architecture

The project follows a layered architecture separating concerns:

```
src/
├── application/          # Application services & use cases
│   ├── monitoring/       # Metrics collection & analysis
│   ├── notification/     # Notification logic
│   ├── scheduler/        # Job scheduling & queue management
│   ├── subscription/     # Subscription business logic
│   └── user/             # User management
├── domain/               # Domain entities & ports
│   ├── delivery/         # Notification delivery tracking
│   ├── metric/           # Performance metrics
│   ├── seen-listing/     # Listing history
│   ├── subscription/     # User subscriptions
│   └── user/             # User entities
├── infrastructure/       # External implementations
│   ├── database/         # TypeORM configuration & repositories
│   ├── scheduler/        # NestJS Schedule implementation
│   └── scraper/          # Web scraping infrastructure
├── interfaces/           # External interfaces
│   └── bot/              # Telegram bot handlers
│       ├── actions/      # Button callbacks
│       ├── keyboards/    # Inline keyboards
│       ├── messages/     # Message templates
│       └── scenes/       # Multi-step conversations
└── common/               # Shared utilities
    ├── config/           # Configuration modules
    ├── filters/          # Exception filters
    ├── formatters/       # Message formatters
    ├── keyboards/        # Keyboard factories
    └── utils/            # Helper functions
```

### Key Design Patterns

- **Repository Pattern** — Abstracts data access with port/adapter pattern
- **Factory Pattern** — Centralized creation of keyboards and messages
- **Strategy Pattern** — Pluggable scraper implementations
- **Observer Pattern** — Event-driven notification system
- **Queue Pattern** — Priority-based task processing

---

## 📊 Monitoring & Metrics

The bot includes a built-in metrics system that tracks key performance indicators:

### Collected Metrics

| Metric Type              | Description                             | Storage                            |
| ------------------------ | --------------------------------------- | ---------------------------------- |
| **Scrape Duration**      | Time taken to scrape each query (ms)    | Database with query metadata       |
| **Notification Success** | Successful notification deliveries      | Database with user and listing IDs |
| **Notification Failure** | Failed notifications with error reasons | Database with failure details      |
| **Queue Size**           | Current scraping queue size             | Database snapshots                 |
| **Active Subscriptions** | Total active subscriptions per cycle    | Database records                   |

### Metrics Usage

Metrics are automatically collected during bot operation:

- **Scraping metrics** — recorded after each scrape attempt
- **Notification metrics** — tracked on every delivery attempt
- **Queue metrics** — updated when tasks are added
- **Subscription metrics** — collected during each scrape cycle

All metrics are stored in PostgreSQL and can be queried for:

- Performance analysis and optimization
- Success rate calculation
- Capacity planning
- Troubleshooting and debugging

> **Note:** Metrics do not impact bot performance as they are saved asynchronously with error handling.

### Daily Reports

If `BOT_INCIDENTS_USER_ID` is configured, the admin receives automated daily reports at 9:00 AM with metrics for:

- **Last 24 hours** — recent performance snapshot
- **Last 7 days** — weekly trends
- **Last 30 days** — monthly overview

Each report includes:

- Average scrape duration
- Total notifications sent and success rate
- Average queue size
- Average active subscriptions

---

## 🔒 Rate Limiting & Reliability

The bot implements comprehensive rate limiting and health check mechanisms to ensure reliable operation and prevent API abuse.

### Rate Limiting

To respect API limits and prevent throttling, the bot uses token bucket rate limiting:

| Service          | Limit      | Description                           |
| ---------------- | ---------- | ------------------------------------- |
| **Telegram API** | 25 msg/sec | Conservative limit (official: 30/sec) |
| **List.am**      | 2 req/sec  | Respectful scraping rate              |

**How it works:**

- Each request consumes one token from the bucket
- Tokens refill at a constant rate
- Requests are queued when no tokens are available
- Automatic backpressure prevents API overload

**Implementation:**

```typescript
// Telegram notifications automatically rate-limited
await notificationService.sendListingNotification(payload);

// Scraping requests automatically rate-limited
const html = await flaresolvrrService.fetchHtml(url);
```

### FlareSolverr Resilience

The scraping system includes multiple layers of resilience:

1. **Health Checks**
   - Periodic connection tests (every 60 seconds)
   - Automatic availability tracking
   - Status logging for monitoring

2. **Retry with Exponential Backoff**
   - Up to 3 retry attempts per request
   - Increasing delays: 1s → 2s → 4s (max 5s)
   - Prevents overwhelming failed services

3. **Automatic Fallback**
   - If FlareSolverr is unavailable, falls back to direct HTTP requests
   - Configurable via `FLARESOLVERR_ENABLE_FALLBACK=true`
   - Ensures scraping continues even if FlareSolverr fails

4. **Graceful Degradation**
   - Logs failures without stopping the bot
   - Continues with available functionality
   - Admin receives error notifications

**Configuration:**

```env
# Enable fallback to direct fetch if FlareSolverr fails
FLARESOLVERR_ENABLE_FALLBACK=true

# FlareSolverr connection settings
FLARESOLVERR_URL=http://list_am_bot.flaresolverr:8191
FLARESOLVERR_MAX_TIMEOUT=60000
```

---

## 🚀 Quick Start

> **📖 For detailed step-by-step instructions, see [QUICK_START.md](QUICK_START.md)**

### Prerequisites

- Docker & Docker Compose
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/zombiQWERTY/list_am_bot.git
   cd list_am_bot
   ```

2. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```

3. **Start the project**

   ```bash
   make up
   ```

   This command will:
   - Build Docker images
   - Start all services (PostgreSQL, bot)
   - Set up the database

4. **First time setup: Create database schema**

   If this is your first time running the project, create the database schema manually:

   ```bash
   # Connect to the database container
   docker exec -it list_am_bot.app bash

   # Inside container, run psql
   psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"

   # Exit container
   exit
   ```

### Common Development Commands

```bash
# Rebuild and restart entire project
make rebuild-all

# Rebuild and restart only the bot service
make rebuild-one

# Stop all services
make down

# View logs
make logs
```

### Installing Dependencies

When adding new npm packages:

1. **Install locally** (for IDE autocomplete)

   ```bash
   npm install <package-name>
   ```

2. **Rebuild container** to install inside Docker

   ```bash
   make rebuild-one
   ```

### Production Deployment

```bash
# Production environment
docker build  -t "list_am_bot_base:latest" -f ./infra/prod/Dockerfile.base

docker build -t "list_am_bot_app:latest" -f ./infra/prod/Dockerfile
    --build-arg="BASE_IMAGE=list_am_bot_base:latest"

sed -i "s#app_image#list_am_bot_app:latest#g" docker-compose.prod.yml

docker compose -f docker-compose.prod.yml pull

docker-compose -f docker-compose.prod.yml up -d
```

**Note:** Migrations run automatically in production environment.

---

## ⚙️ Configuration

### Environment Variables

| Variable                   | Description                               | Default               | Required |
| -------------------------- | ----------------------------------------- | --------------------- | -------- |
| `BOT_TOKEN`                | Telegram Bot API token                    | -                     | ✅       |
| `BOT_INCIDENTS_USER_ID`    | Admin Telegram ID for error notifications | -                     | ❌       |
| `BOT_DOMAIN`               | Domain for webhook (production)           | -                     | ❌       |
| `BOT_WEBHOOK_URL`          | Webhook path                              | `/telegram-webhook`   | ❌       |
| `CRON_SCHEDULE`            | Scraping schedule (cron format)           | `0 * * * *`           | ❌       |
| `FETCH_TIMEOUT_MS`         | HTTP request timeout                      | `15000`               | ❌       |
| `REQUEST_DELAY_MS`         | Delay between requests                    | `2500`                | ❌       |
| `MAX_RETRIES`              | Maximum retry attempts                    | `3`                   | ❌       |
| `LISTAM_BASE_URL`          | List.am base URL                          | `https://www.list.am` | ❌       |
| `POSTGRES_HOST`            | PostgreSQL host                           | `localhost`           | ✅       |
| `POSTGRES_PORT`            | PostgreSQL port                           | `5432`                | ✅       |
| `POSTGRES_USERNAME`        | Database user                             | -                     | ✅       |
| `POSTGRES_PASSWORD`        | Database password                         | -                     | ✅       |
| `POSTGRES_NAME`            | Database name                             | `list_am_bot`         | ✅       |
| `POSTGRES_TELEGRAF_SCHEMA` | Schema for Telegraf sessions              | `public`              | ❌       |
| `NODE_ENV`                 | Environment mode                          | `development`         | ❌       |
| `LOG_LEVEL`                | Logging level                             | `info`                | ❌       |

### FlareSolverr (Optional)

For bypassing CloudFlare protection:

```env
FLARESOLVERR_URL=http://localhost:8191
FLARESOLVERR_MAX_TIMEOUT=60000
```

Start FlareSolverr:

```bash
docker run -d \
  --name=flaresolverr \
  -p 8191:8191 \
  ghcr.io/flaresolverr/flaresolverr:latest
```

---

## 💻 Development

### Available Make Commands

```bash
make up              # Start all services
make down            # Stop all services
make rebuild-all     # Rebuild and restart entire project
make rebuild-one     # Rebuild and restart only bot service
make logs            # View bot logs only
make shell           # Access bot container shell
```

### Database Migrations

#### Development Environment

Migrations in development must be created and run manually:

1. **Generate a new migration**

   ```bash
   # Access the container
   docker exec -it list_am_bot.app bash

   # Inside container
   /tmp/typeorm-generate.sh <migration-name>

   # Example
   /tmp/typeorm-generate.sh AddUserEmailField
   ```

2. **Run migrations**

   ```bash
   # Inside container
   /tmp/typeorm-migrate.sh
   ```

3. **Revert last migration** (if needed)

   ```bash
   # Inside container
   /tmp/typeorm-revert.sh
   ```

#### Production Environment

Migrations run **automatically** when the container starts.

### Bot Commands

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `/start`     | Initialize bot and show main menu    |
| `/add`       | Add new subscription                 |
| `/list`      | View active subscriptions            |
| `/last`      | View last item directly from list.am |
| `/pause`     | Pause all notifications              |
| `/resume`    | Resume notifications                 |
| `/delete`    | Delete specific subscription         |
| `/deleteall` | Delete all subscriptions             |
| `/help`      | Show help message                    |

---

## 🐛 Troubleshooting

### Common Issues

#### Database Schema Not Found

**Problem:** Error about missing schema on first run.

**Solution:**

```bash
# Access container
docker exec -it list_am_bot.core bash

# Create schemas
psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"

# Run migrations
/tmp/typeorm-migrate.sh
```

#### Container Name Not Found

**Problem:** `docker exec` commands fail with "No such container".

**Solution:** Check actual container names:

```bash
docker ps
# Use the actual container name from the output
```

#### Dependencies Not Installed in Container

**Problem:** New npm package not found after `npm install`.

**Solution:**

```bash
# Always rebuild container after installing dependencies
make rebuild-one
```

#### Port Already in Use

**Problem:** PostgreSQL port 5432/5032 already in use.

**Solution:**

```bash
# Stop conflicting service or change port in docker-compose.dev.yml
# Then restart
make down
make up
```

#### Migrations Not Running

**Problem:** Tables not created in database.

**Solution:**

```bash
# Check if migrations exist
docker exec -it list_am_bot.core ls -la src/infrastructure/database/migrations/

# Run migrations manually
docker exec -it list_am_bot.core /tmp/typeorm-migrate.sh
```

### Getting Help

- **Check logs:** `make logs`
- **Database issues:** `make db-shell` to inspect database directly
- **Container shell:** `make shell` to debug inside container
- **View all containers:** `docker ps -a`
- **Rebuild from scratch:** `make down && make rebuild-all`

---

## 🛠️ Tech Stack

### Core Technologies

- **[NestJS](https://nestjs.com/)** — Progressive Node.js framework
- **[TypeScript](https://www.typescriptlang.org/)** — Typed JavaScript
- **[Telegraf](https://telegraf.js.org/)** — Telegram Bot API framework
- **[TypeORM](https://typeorm.io/)** — ORM for TypeScript
- **[PostgreSQL](https://www.postgresql.org/)** — Relational database

### Libraries & Tools

- **[@telegraf/session](https://github.com/telegraf/session)** — PostgreSQL session storage
- **[Cheerio](https://cheerio.js.org/)** — HTML parsing
- **[Axios](https://axios-http.com/)** — HTTP client
- **[Zod](https://zod.dev/)** — Schema validation
- **[Winston](https://github.com/winstonjs/winston)** — Logging framework
- **[NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)** — Cron jobs
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — Code quality

---

## 📁 Project Structure

### Module Organization

- **BotModule** — Telegram bot interface
- **UserModule** — User management
- **SubscriptionModule** — Subscription handling
- **ScraperModule** — Web scraping
- **WorkerModule** — Background jobs
- **SchedulerModule** — Task scheduling

### Database Schema

**Users** → Store Telegram user data
**Subscriptions** → User search queries
**SeenListings** → Track viewed listings per subscription
**Deliveries** → Notification delivery history

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run linter before committing

---

## 📝 License

This project is licensed under the WTFPL (Do What The Fuck You Want To Public License) - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You just DO WHAT THE FUCK YOU WANT TO. 🚀

---

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** — Get up and running in 5 minutes
- **[Development Workflow](DEVELOPMENT.md)** — Comprehensive development guide
- **[CI/CD Setup](CICD.md)** — GitHub Actions workflows and deployment
- **[Contributing Guidelines](CONTRIBUTING.md)** — How to contribute
- **[Changelog](CHANGELOG.md)** — Version history and release notes

---

## 🙏 Acknowledgments

- [list.am](https://www.list.am) — For providing the classifieds platform
- [NestJS](https://nestjs.com/) — For the amazing framework
- [Telegraf](https://telegraf.js.org/) — For the Telegram bot library

---

## 📧 Contact

For questions, suggestions, or issues, please:

- Open an [issue](https://github.com/yourusername/list_am_bot/issues)
- Start a [discussion](https://github.com/yourusername/list_am_bot/discussions)

---

<div align="center">

**Made with ❤️ and TypeScript**

If you find this project useful, please give it a ⭐️

</div>
