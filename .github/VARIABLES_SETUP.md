# GitHub Actions Variables Setup

Quick reference for setting up CI/CD deployment variables.

## 📍 Location

**Settings → Secrets and variables → Actions**

## ✨ Simple Setup (Recommended)

### 1. Repository Secrets

Add in **Secrets** tab:

- **`DEPLOY_SSH_KEY`** — Your SSH private key
- **`CONFIG`** — Multi-line environment variables (see below)

### 2. Repository Variables

Add in **Variables** tab:

- **`DEPLOY_HOST`** = `your-server.com`
- **`DEPLOY_USER`** = `deploy`
- **`PROJECT_DIR`** = `/opt/list_am_bot`

### 3. CONFIG Secret Content

Copy this template and update values:

```bash
BOT_TOKEN=your_telegram_bot_token_here
BOT_INCIDENTS_USER_ID=123456789
BOT_ENVIRONMENT=production
BOT_DOMAIN=your-domain.com
BOT_WEBHOOK_URL=/telegram-webhook

CRON_SCHEDULE=0 * * * *
FETCH_TIMEOUT_MS=15000
REQUEST_DELAY_MS=2500
MAX_RETRIES=3

LISTAM_BASE_URL=https://www.list.am

FLARESOLVERR_URL=http://flaresolverr:8191
FLARESOLVERR_MAX_TIMEOUT=60000

LOG_LEVEL=info
NODE_ENV=production

POSTGRES_HOST=list_am_bot.postgres
POSTGRES_PORT=5432
POSTGRES_USERNAME=list_am_bot
POSTGRES_PASSWORD=secure_password_here
POSTGRES_NAME=list_am_bot
POSTGRES_BASE_URL=postgresql://list_am_bot:secure_password_here@list_am_bot.postgres:5432/list_am_bot
POSTGRES_TELEGRAF_SCHEMA=public
```

## 🚀 Quick Setup with GitHub CLI

```bash
# 1. Set deployment variables
gh variable set DEPLOY_HOST --body "your-server.com"
gh variable set DEPLOY_USER --body "deploy"
gh variable set PROJECT_DIR --body "/opt/list_am_bot"

# 2. Set SSH key
gh secret set DEPLOY_SSH_KEY < ~/.ssh/deploy_key

# 3. Set CONFIG (from file)
gh secret set CONFIG < .env.production

# Or directly (multi-line)
gh secret set CONFIG --body "BOT_TOKEN=xxx
BOT_ENVIRONMENT=production
POSTGRES_HOST=list_am_bot.postgres
..."
```

## 📋 Creating .env.production File

Create a file named `.env.production` with all variables:

```bash
# Copy template
cat > .env.production << 'EOF'
BOT_TOKEN=your_bot_token_here
BOT_INCIDENTS_USER_ID=123456789
BOT_ENVIRONMENT=production
BOT_DOMAIN=your-domain.com
BOT_WEBHOOK_URL=/telegram-webhook

CRON_SCHEDULE=0 * * * *
FETCH_TIMEOUT_MS=15000
REQUEST_DELAY_MS=2500
MAX_RETRIES=3

LISTAM_BASE_URL=https://www.list.am

FLARESOLVERR_URL=http://flaresolverr:8191
FLARESOLVERR_MAX_TIMEOUT=60000

LOG_LEVEL=info
NODE_ENV=production

POSTGRES_HOST=list_am_bot.postgres
POSTGRES_PORT=5432
POSTGRES_USERNAME=list_am_bot
POSTGRES_PASSWORD=secure_password_here
POSTGRES_NAME=list_am_bot
POSTGRES_BASE_URL=postgresql://list_am_bot:secure_password_here@list_am_bot.postgres:5432/list_am_bot
POSTGRES_TELEGRAF_SCHEMA=public
EOF

# Update values
nano .env.production

# Upload to GitHub
gh secret set CONFIG < .env.production

# Delete local file (security)
rm .env.production
```

## ✅ Verify Setup

After adding all variables, verify in workflow:

1. Go to **Actions** tab
2. Manually trigger workflow: **Build and Deploy → Run workflow**
3. Check logs for proper variable substitution

## 📚 More Info

See [CICD.md](../CICD.md) for detailed documentation.
