# 🤖 List.am Bot

<div align="center">

**Smart Telegram bot for real-time monitoring of classified ads on list.am**

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.16-2CA5E0?style=for-the-badge&logo=telegram)](https://telegraf.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?style=for-the-badge&logo=dependabot)](https://github.com/zombiQWERTY/list_am_bot/network/updates)

[![License](https://img.shields.io/badge/License-WTFPL-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/zombiQWERTY/list_am_bot/pulls)
[![Telegram](https://img.shields.io/badge/Telegram-@zinovev__space-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/zinovev_space)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/zinovev_space)
[![Sponsor](https://img.shields.io/badge/Sponsor-💝-ff69b4?style=for-the-badge)](#-support-the-project)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Development](#-development) • [Support](#-support-the-project)

📚 **Documentation:** [Quick Start](QUICK_START.md) • [Development Guide](DEVELOPMENT.md) • [CI/CD Setup](CICD.md) • [Contributing](CONTRIBUTING.md) • [Code of Conduct](CODE_OF_CONDUCT.md) • [Security Policy](SECURITY.md) • [Changelog](CHANGELOG.md)

</div>

---

## 💝 Support the Project

If you find this bot useful and want to support its development:

<div align="center">

### ⭐ Star the Repository

Give this project a star on GitHub — it helps others discover it!

### 💰 Financial Support

Your donations help maintain and improve the bot:

| Method                      | Details                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| **Buy Me a Coffee** ☕      | [buymeacoffee.com/zinovev_space](https://buymeacoffee.com/zinovev_space) |
| **USDT (TRC20)**            | `TTxEjq3w2jy1bgRSsrvwXhZB2VaKfkureh`                                     |
| **Armenian Visa (ID Bank)** | `4318270001094190`                                                       |
| **Russian MIR (T-Bank)**    | `2200700167792802`                                                       |

### 🤝 Become a Sponsor

Interested in sponsoring this project? Let's talk!

- Regular feature updates
- Priority support
- Your logo in README
- Custom integrations

Contact via [GitHub Discussions](https://github.com/zombiQWERTY/list_am_bot/discussions) or [Telegram](https://t.me/zinovev_space)

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
  - Create text-based search subscriptions
  - Create URL-based subscriptions with custom filters
  - Pause/resume notifications per user
  - View active subscriptions with type indicators
  - Delete individual or all subscriptions
  - Named subscriptions for better organization
  - **User subscription limit: 10 subscriptions per user**
  - **Automatic cleanup when user blocks the bot**

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

3. **Graceful Degradation**
   - Logs failures without stopping the bot
   - Continues with available functionality
   - Admin receives error notifications

**Configuration:**

```env
# FlareSolverr connection settings
FLARESOLVERR_URL=http://list_am_bot.flaresolverr:8191
FLARESOLVERR_PORT=8191
FLARESOLVERR_MAX_TIMEOUT=60000
```

---

## 📋 User Limits & Policies

### Subscription Limits

To ensure optimal performance and fair resource allocation, each user is limited to:

- **Maximum 10 active subscriptions per user**

When attempting to create an 11th subscription, users will receive a friendly message:

```
❌ Достигнут лимит подписок: 10

Удалите ненужные подписки, чтобы добавить новые.
```

**Why this limit?**

- Prevents resource abuse
- Ensures consistent bot performance for all users
- Encourages focused, relevant subscriptions
- Maintains database efficiency

### Automatic Cleanup on Bot Block

The bot implements smart cleanup to respect user privacy and maintain data hygiene:

**What happens when a user blocks the bot:**

1. ✅ Bot detects block during notification attempt (HTTP 403 error)
2. ✅ Automatically finds all user's subscriptions
3. ✅ Deletes all subscriptions for that user
4. ✅ Logs cleanup action for monitoring
5. ✅ No notifications will be sent to blocked users

**Benefits:**

- **Privacy-friendly** — Data is removed when relationship ends
- **Resource efficient** — No wasted processing for blocked users
- **GDPR compliant** — Automatic data removal on user action
- **Clean database** — No orphaned subscriptions

**Implementation Details:**

```typescript
// When bot is blocked (403 error)
if (isTelegramBotBlocked(error)) {
  // Find user and their subscriptions
  const user = await userService.findByTelegramUserId(telegramUserId);
  const count = await subscriptionService.count(user.id);

  // Clean up all subscriptions
  if (count > 0) {
    await subscriptionService.deleteAll(user.id);
    logger.debug(`Cleaned up ${count} subscription(s) for blocked user`);
  }
}
```

**User Experience:**

- Silent cleanup — no errors thrown
- Happens automatically on next notification attempt
- User can restart with `/start` if they unblock the bot later
- Fresh start — all previous subscriptions are removed

> **Note:** Users will need to recreate their subscriptions if they unblock the bot in the future.

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

## 📖 Usage Examples

### Creating Subscriptions

The bot supports two types of subscriptions:

#### 1. Text-Based Subscriptions

Simple keyword search across all categories:

```
User: /start
Bot: Welcome! Choose an action:
User: [Click "➕ Добавить текстом"]
Bot: Send your search query
User: Chevrolet Tahoe
Bot: ✅ Subscription created!
```

**Best for:**

- Simple keyword searches
- Brand/model names
- Generic terms

#### 2. URL-Based Subscriptions

Advanced filtering using list.am's filter system:

```
User: /start
Bot: Welcome! Choose an action:
User: [Click "🔗 Добавить по URL"]
Bot: Send a list.am URL with filters
User: https://www.list.am/category/212?n=2&price1=10000&price2=50000&cid=0
Bot: Name your subscription (3-100 characters)
User: Tahoe under $50k
Bot: ✅ Subscription created: "Tahoe under $50k"
```

**Best for:**

- Category-specific searches
- Price range filtering
- Region/location filtering
- Combined filters

### How to Get a Filter URL

1. Visit [list.am](https://www.list.am)
2. Select your category (e.g., Cars & Motorcycles)
3. Apply desired filters:
   - Price range
   - Region
   - Condition
   - etc.
4. Copy the URL from browser's address bar
5. Paste it into the bot

**Example URLs:**

```
Cars $10k-$50k in Yerevan:
https://www.list.am/category/212?n=2&price1=10000&price2=50000&cid=0

Electronics in Avan:
https://www.list.am/category/224?n=2&cid=14

Real Estate 2+ bedrooms:
https://www.list.am/category/0/rooms-2/
```

### Viewing Subscriptions

URL subscriptions are displayed with a 🔗 icon and their custom name:

```
📋 Your subscriptions (3):

1. Chevrolet Tahoe              [🗑]
2. 🔗 Tahoe under $50k          [🗑]
3. 🔗 Electronics in Avan       [🗑]
```

### Subscription Limits

Each user can create up to **10 subscriptions** (text + URL combined):

```
📊 Your subscription usage: 7/10

✅ 3 more subscriptions available
❌ At limit — delete old subscriptions to add new ones
```

**To free up slots:**

1. Use `/list` or click "📋 Список отслеживаемых"
2. Click 🗑 next to unwanted subscription
3. Create new subscriptions

### Tips

- **Maximum 10 subscriptions per user** to ensure optimal performance
- **URL subscriptions** must be from `list.am` domain only
- Names help identify URL subscriptions at a glance
- You can have both text and URL subscriptions simultaneously
- Notifications include the subscription name/query for context
- **Subscriptions auto-delete if you block the bot** — restart fresh by unblocking and using `/start`

---

## ⚙️ Configuration

### Environment Variables

| Variable                   | Description                               | Default                 | Required |
| -------------------------- | ----------------------------------------- | ----------------------- | -------- |
| `BOT_TOKEN`                | Telegram Bot API token                    | -                       | ✅       |
| `BOT_INCIDENTS_USER_ID`    | Admin Telegram ID for error notifications | -                       | ✅       |
| `BOT_DOMAIN`               | Domain for webhook (production)           | -                       | ❌       |
| `BOT_WEBHOOK_URL`          | Webhook path                              | `/telegram-webhook`     | ❌       |
| `POSTGRES_HOST`            | PostgreSQL host                           | `localhost`             | ✅       |
| `POSTGRES_PORT`            | PostgreSQL port                           | `5432`                  | ✅       |
| `POSTGRES_USERNAME`        | Database user                             | -                       | ✅       |
| `POSTGRES_PASSWORD`        | Database password                         | -                       | ✅       |
| `POSTGRES_NAME`            | Database name                             | `list_am_bot`           | ✅       |
| `POSTGRES_TELEGRAF_SCHEMA` | Schema for Telegraf sessions              | `public`                | ❌       |
| `NODE_ENV`                 | Environment mode                          | `development`           | ❌       |
| `FETCH_TIMEOUT_MS`         | HTTP request timeout (ms)                 | `15000`                 | ❌       |
| `FLARESOLVERR_URL`         | FlareSolverr service URL                  | `http://localhost:8191` | ✅       |
| `FLARESOLVERR_PORT`        | FlareSolverr service port                 | `8191`                  | ✅       |
| `FLARESOLVERR_MAX_TIMEOUT` | FlareSolverr timeout (ms)                 | `60000`                 | ❌       |

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

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

### Quick Start for Contributors

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

### Security

Found a security vulnerability? Please report it responsibly. See our [Security Policy](SECURITY.md) for details.

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

- Open an [issue](https://github.com/zombiQWERTY/list_am_bot/issues)
- Start a [discussion](https://github.com/zombiQWERTY/list_am_bot/discussions)

---

<div align="center">

**Made with ❤️ and TypeScript**

If you find this project useful, please give it a ⭐️

**Every contribution counts! Thank you for your support! 🙏**

</div>
