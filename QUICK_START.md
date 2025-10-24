# 🚀 Quick Start Guide

Step-by-step guide to get List.am Bot running locally in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

## Setup Steps

### 1. Clone & Configure

```bash
# Clone repository
git clone https://github.com/yourusername/list_am_bot.git
cd list_am_bot

# Create environment file
cp env.example .env
```

### 2. Edit `.env` File

Open `.env` and set your bot token:

```bash
BOT_TOKEN=your_telegram_bot_token_here
```

**Required variables:**

- `BOT_TOKEN` — Your Telegram bot token
- `POSTGRES_PASSWORD` — Database password (already set in example)

**Optional but recommended:**

- `BOT_INCIDENTS_USER_ID` — Your Telegram user ID for error notifications

### 3. Start Services

```bash
make up
```

This will:

1. Build Docker image
2. Start PostgreSQL database
3. Start bot application

**Wait ~30 seconds** for services to initialize.

### 4. Create Database Schema (First Time Only)

If this is your first time running the project:

```bash
# Access container
docker exec -it list_am_bot.core bash

# Create database schemas
psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"

# Run migrations
/tmp/typeorm-migrate.sh

# Exit container
exit
```

### 5. Verify It Works

Check logs to ensure bot is running:

```bash
make logs
```

You should see:

```
✅ Bot started successfully
🔄 Scheduler initialized
```

### 6. Test the Bot

1. Open Telegram
2. Find your bot (search by username)
3. Send `/start`
4. Try adding a subscription!

## 🎉 You're Done!

Your bot is now monitoring list.am for new listings!

## Next Steps

- **Add subscription:** Use `/add` command in Telegram
- **View logs:** `make logs`
- **Stop bot:** `make down`
- **Restart bot:** `make restart`

## Common Commands

```bash
make up              # Start everything
make down            # Stop everything
make logs            # View logs
make rebuild-one     # Rebuild bot after code changes
make rebuild-all     # Rebuild everything
make shell           # Access bot container
```

## Troubleshooting

### Bot doesn't respond

1. Check logs: `make logs`
2. Verify `BOT_TOKEN` in `.env` is correct
3. Ensure bot is running: `docker ps`

### Database errors

```bash
# Recreate database
make down
docker volume rm list_am_bot_postgres_data
make up

# Then repeat step 4 (create schema)
```

### Container name errors

Check actual container names:

```bash
docker ps
```

Use the correct name in commands.

## Need Help?

- Check full [README](README.md)
- View [Troubleshooting](README.md#-troubleshooting) section
- Open an [issue](https://github.com/yourusername/list_am_bot/issues)

---

**Happy monitoring!** 🎯
