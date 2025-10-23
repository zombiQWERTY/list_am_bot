# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### 🎉 Initial Release

First stable release of List.am Bot!

### ✨ Features

#### Bot Commands

- `/start` - Initialize bot and show main menu
- `/add` - Add new subscription via wizard
- `/list` - View all active subscriptions
- `/last` - View last item directly from list.am
- `/pause` - Pause all notifications
- `/resume` - Resume notifications
- `/delete` - Delete specific subscription
- `/deleteall` - Delete all subscriptions
- `/help` - Show help message

#### Core Functionality

- Real-time monitoring of list.am listings
- Smart duplicate detection per subscription
- Rich notification messages with listing details
- Inline keyboards for quick actions
- Multi-step subscription wizard
- User notification preferences (pause/resume)

#### Architecture

- Clean layered architecture (Domain/Application/Infrastructure/Interfaces)
- Repository pattern with port/adapter
- TypeORM with PostgreSQL
- PostgreSQL-backed Telegraf sessions
- Queue-based scraping with priority management
- Transaction support for data consistency

#### Scraping

- Cheerio-based HTML parsing
- FlareSolverr integration for CloudFlare bypass
- Configurable request delays and timeouts
- Automatic retry with exponential backoff
- Proxy rotation support

#### Monitoring & Logging

- Winston logger with daily rotation
- Global Telegraf exception filter
- Admin error notifications
- Detailed scraping metrics
- User-friendly error messages

#### Deployment

- Docker Compose support
- Environment-based configuration with Zod validation
- Webhook support for production
- Database migrations
- Health checks

### 🛠️ Technical Stack

- NestJS 11.x
- TypeScript 5.8
- Telegraf 4.16
- TypeORM 0.3
- PostgreSQL 14+
- Cheerio 1.1
- Zod 3.24

### 📝 Documentation

- Comprehensive README with setup instructions
- Contributing guidelines
- Issue templates (bug report, feature request)
- Pull request template
- GitHub Actions CI/CD workflows
- WTFPL License (Do What The Fuck You Want To)

---

## [Unreleased]

### Planned Features

- Multi-language support (English, Russian, Armenian)
- Advanced search filters (price range, location)
- Favorite listings
- Export subscription data
- Rate limiting per user
- Admin dashboard
- Metrics and analytics

---

## Release Notes

### What's New in 1.0.0?

This is the first stable release of List.am Bot. The bot is production-ready with all core features implemented:

**For Users:**

- Create custom search subscriptions
- Get instant notifications for new listings
- Easy subscription management
- Pause/resume notifications

**For Developers:**

- Clean, maintainable codebase
- Comprehensive documentation
- Easy deployment with Docker
- Extensible architecture
- Good test coverage

### Migration Guide

This is the initial release, so no migrations are required.

### Breaking Changes

None (initial release).

---

## Version History

- **1.0.0** (2025-10-23) - Initial stable release

---

For more information, see the [README](README.md) and [Contributing Guide](CONTRIBUTING.md).
