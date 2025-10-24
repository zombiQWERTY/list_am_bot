# 🚀 CI/CD Setup Guide

Complete guide for setting up Continuous Integration and Deployment using GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [GitHub Secrets Setup](#github-secrets-setup)
- [Docker Registry](#docker-registry)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The project uses GitHub Actions for CI/CD with the following workflows:

### 1. **CI Workflow** (`ci.yml`)

Runs on every push and PR to `main` and `dev` branches:

- ✅ Linting
- ✅ Type checking
- ✅ Building
- ✅ Testing

### 2. **Build and Deploy Workflow** (`build-and-deploy.yml`)

Builds Docker images and deploys to production:

- 🏗️ Builds base and app Docker images
- 📦 Pushes to GitHub Container Registry
- 🧪 Runs tests in Docker
- 🚀 Deploys to production (`main` branch only)

### 3. **CodeQL Security Analysis** (`codeql.yml`)

Automated security scanning

### 4. **Cleanup Workflow** (`cleanup.yml`)

Weekly cleanup of old Docker images

---

## Workflows

### CI Workflow

```yaml
Triggers: push, pull_request (main)
Jobs:
  - lint # ESLint + Prettier
  - build # TypeScript compilation
  - test # Unit tests with coverage
  - type-check # TypeScript type checking
```

**No configuration needed** — works out of the box!

### Build and Deploy Workflow

```yaml
Triggers: push (main)
Jobs:
  - build # Build Docker images → GitHub Container Registry
  - test # Run tests in Docker
  - deploy # Deploy to production (main branch only)
```

**Requires secrets and variables configuration** (see below).

---

## GitHub Secrets and Variables Setup

Navigate to: **Settings → Secrets and variables → Actions**

### Simple Setup (Recommended)

Use a single multi-line `CONFIG` secret with all environment variables:

#### 1. Repository Secrets

Go to **Secrets** tab and add:

| Secret Name      | Description                    | Type   |
| ---------------- | ------------------------------ | ------ |
| `DEPLOY_SSH_KEY` | SSH private key for deployment | Secret |
| `CONFIG`         | All environment variables      | Secret |

#### 2. Repository Variables

Go to **Variables** tab and add:

| Variable Name | Description                     | Example            |
| ------------- | ------------------------------- | ------------------ |
| `DEPLOY_HOST` | Production server hostname/IP   | `your-server.com`  |
| `DEPLOY_USER` | SSH username                    | `deploy`           |
| `DEPLOY_PORT` | SSH port (optional, default 22) | `2221`             |
| `PROJECT_DIR` | Deployment directory on server  | `/opt/list_am_bot` |

#### 3. CONFIG Secret Format

Create `CONFIG` secret with the following multi-line content:

```bash
BOT_TOKEN=your_telegram_bot_token_here
BOT_INCIDENTS_USER_ID=123456789
BOT_ENVIRONMENT=production
BOT_DOMAIN=your-domain.com
BOT_WEBHOOK_URL=/telegram-webhook

FLARESOLVERR_URL=http://flaresolverr:8191
FLARESOLVERR_PORT=8191
FLARESOLVERR_MAX_TIMEOUT=60000

NODE_ENV=production

POSTGRES_HOST=list_am_bot.postgres
POSTGRES_PORT=5432
POSTGRES_USERNAME=list_am_bot
POSTGRES_PASSWORD=secure_password_here
POSTGRES_NAME=list_am_bot
POSTGRES_BASE_URL=postgresql://list_am_bot:secure_password_here@list_am_bot.postgres:5432/list_am_bot
POSTGRES_TELEGRAF_SCHEMA=public
```

### Quick Setup Guide

1. **Generate SSH key:**

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key

   # Copy public key to server
   # If using custom SSH port:
   ssh-copy-id -i deploy_key.pub -p 2221 deploy@your-server.com

   # Or default port 22:
   ssh-copy-id -i deploy_key.pub deploy@your-server.com
   ```

2. **Add SSH key to GitHub:**

   ```bash
   cat deploy_key
   # Copy output and add to Secrets → DEPLOY_SSH_KEY
   ```

3. **Create CONFIG secret:**
   - Go to **Secrets → New repository secret**
   - Name: `CONFIG`
   - Value: Copy the multi-line format above
   - Update values for your setup

4. **Add deployment variables:**
   - Go to **Variables → New repository variable**
   - Add `DEPLOY_HOST`, `DEPLOY_USER`, `PROJECT_DIR`
   - Add `DEPLOY_PORT` (if using custom SSH port, e.g., `2221`; omit for default port 22)

---

### Alternative: Individual Variables

<details>
<summary>Click to expand individual variables setup (not recommended)</summary>

If you prefer separate variables instead of single `CONFIG`:

#### Repository Secrets

| Secret Name         | Description                       |
| ------------------- | --------------------------------- |
| `DEPLOY_SSH_KEY`    | SSH private key for deployment    |
| `BOT_TOKEN`         | Telegram bot token from BotFather |
| `POSTGRES_USERNAME` | PostgreSQL username               |
| `POSTGRES_PASSWORD` | PostgreSQL password               |

#### Repository Variables

| Variable Name              | Description                       | Default Value              |
| -------------------------- | --------------------------------- | -------------------------- |
| `DEPLOY_HOST`              | Production server hostname/IP     | `your-server.com`          |
| `DEPLOY_USER`              | SSH username                      | `deploy`                   |
| `PROJECT_DIR`              | Deployment directory on server    | `/opt/list_am_bot`         |
| `BOT_INCIDENTS_USER_ID`    | Admin Telegram user ID for errors | `123456789`                |
| `BOT_ENVIRONMENT`          | Environment name                  | `production`               |
| `BOT_DOMAIN`               | Domain for webhook                | `your-domain.com`          |
| `BOT_WEBHOOK_URL`          | Webhook path                      | `/telegram-webhook`        |
| `FLARESOLVERR_URL`         | FlareSolverr service URL          | `http://flaresolverr:8191` |
| `FLARESOLVERR_PORT`        | FlareSolverr service port         | `8191`                     |
| `NODE_ENV`                 | Node environment                  | `production`               |
| `POSTGRES_HOST`            | PostgreSQL hostname               | `list_am_bot.postgres`     |
| `POSTGRES_PORT`            | PostgreSQL port                   | `5432`                     |
| `POSTGRES_NAME`            | Database name                     | `list_am_bot`              |
| `POSTGRES_TELEGRAF_SCHEMA` | Schema for Telegraf sessions      | `public`                   |

</details>

---

## Docker Registry

### GitHub Container Registry (GHCR)

Images are automatically pushed to `ghcr.io/<username>/list_am_bot/`:

- `ghcr.io/<username>/list_am_bot/base:main` — Base image
- `ghcr.io/<username>/list_am_bot/app:main` — App image

### Enable GitHub Container Registry

1. Go to **Settings → Actions → General**
2. Under "Workflow permissions", select:
   - ✅ **Read and write permissions**
3. Click **Save**

### Make Images Public (Optional)

1. Go to your profile → **Packages**
2. Click on `list_am_bot/base` and `list_am_bot/app`
3. **Package settings → Change visibility → Public**

---

## Deployment

### Server Requirements

- Ubuntu 20.04+ (or any Linux with Docker)
- Docker 20.10+
- Docker Compose 2.0+
- SSH access for deployment user

### Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Create project directory
sudo mkdir -p /opt/list_am_bot
sudo chown deploy:deploy /opt/list_am_bot

# Create Docker network (for external network in docker-compose)
docker network create listambot_network

# Setup SSH key
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy nano /home/deploy/.ssh/authorized_keys
# Paste your public key here
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

> **Note:** The Docker network `listambot_network` is automatically created during deployment. Manual creation is only needed for first-time setup or if you deleted the network.

### Deployment Flow

```bash
# Push to main branch
git checkout main
git push origin main

# GitHub Actions will:
# 1. Build Docker images with :main tag
# 2. Run tests
# 3. Deploy to production server
# 4. Create deployment notification
```

### Manual Deployment

If you need to deploy manually:

```bash
# SSH to server (with custom port if needed)
ssh -p 2221 deploy@your-server
# Or default port:
# ssh deploy@your-server

# Navigate to project directory
cd /opt/list_am_bot

# Create Docker network if it doesn't exist
docker network create listambot_network || true

# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Pull latest images
docker compose pull

# Restart services
docker compose up -d

# Check logs
docker compose logs -f
```

---

## Monitoring Deployments

### View Workflow Runs

1. Go to **Actions** tab in GitHub
2. Select workflow run
3. View logs for each job

### Check Deployment Status

```bash
# SSH to server
ssh -p 2221 deploy@your-server

# Check running containers
docker ps

# View logs
docker logs -f list_am_bot.core

# Check service health
docker exec list_am_bot.core curl -f http://localhost:3000/health || echo "Service down"
```

### Rollback Deployment

```bash
# SSH to server
cd /opt/list_am_bot

# Check available images
docker images | grep list_am_bot

# Update docker-compose.yml with previous version
sed -i 's/:main/:previous-tag/g' docker-compose.yml

# Restart
docker compose up -d
```

---

## Production Environment Configuration

```yaml
Environment name: production
Branch: main
Auto-deploy: Yes (on push to main)
Protection rules: Recommended (require approval)
```

**Production settings:**

- Production webhook URL (via `BOT_DOMAIN` variable)
- Error monitoring (via `BOT_INCIDENTS_USER_ID` variable)
- Optimized resource limits
- Automatic database migrations

---

## Troubleshooting

### Build Fails

**Problem:** Docker build fails in GitHub Actions

**Solutions:**

```bash
# Check if Dockerfile exists
ls -la infra/prod/

# Test build locally
docker build -f infra/prod/Dockerfile.base -t test-base .
docker build -f infra/prod/Dockerfile -t test-app --build-arg BASE_IMAGE=test-base .
```

### Deployment Fails

**Problem:** SSH connection fails

**Solutions:**

```bash
# Verify SSH key is correct
ssh -i deploy_key user@server

# Check if key has correct permissions
chmod 600 deploy_key

# Verify server allows password-less sudo (if needed)
ssh user@server 'sudo -n true' && echo "OK" || echo "FAIL"
```

**Problem:** Docker pull fails

**Solutions:**

```bash
# Login to registry manually
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Check if image exists
docker manifest inspect ghcr.io/<username>/list_am_bot/app:main
```

### Image Not Found

**Problem:** `ghcr.io` images not accessible

**Solutions:**

1. Check workflow permissions (Settings → Actions → General)
2. Ensure package is public or GitHub token has access
3. Verify image was pushed successfully in Actions logs

### Tests Fail in Docker

**Problem:** Tests pass locally but fail in CI

**Solutions:**

```bash
# Run tests in Docker locally
docker run --rm \
  --network host \
  -e POSTGRES_HOST=localhost \
  -e BOT_TOKEN=test \
  -e NODE_ENV=test \
  ghcr.io/<username>/list_am_bot/base:dev \
  sh -c 'npm test'

# Check PostgreSQL is accessible
docker run --rm --network host postgres:14 psql -h localhost -U list_am_bot -d list_am_bot_test -c "SELECT 1"
```

---

## Using Variables in Docker Build

Variables and secrets are available in the `build` job and can be passed as `build-args`:

### Example 1: Pass Environment Variables

```yaml
- name: Build and push app image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./infra/prod/Dockerfile
    build-args: |
      BASE_IMAGE=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/base:${{ github.ref_name }}
      NODE_ENV=${{ vars.NODE_ENV }}
      APP_VERSION=${{ github.sha }}
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
```

### Example 2: Use in Dockerfile

```dockerfile
# infra/prod/Dockerfile
ARG BASE_IMAGE
FROM ${BASE_IMAGE}

# Build-time variables
ARG NODE_ENV=production
ARG APP_VERSION=unknown
ARG BUILD_DATE=unknown

# Set as environment variables (optional)
ENV NODE_ENV=${NODE_ENV}
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_DATE=${BUILD_DATE}

# Use in build process
RUN echo "Building version ${APP_VERSION} for ${NODE_ENV}"
```

### Example 3: Pass Secrets During Build

```yaml
- name: Build with secrets
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./infra/prod/Dockerfile
    build-args: |
      NPM_TOKEN=${{ secrets.NPM_TOKEN }}
    secrets: |
      "npm_token=${{ secrets.NPM_TOKEN }}"
```

### Available Variables in Build

- `vars.*` — Repository variables
- `secrets.*` — Repository secrets
- `github.*` — GitHub context (sha, ref, actor, etc.)
- `env.*` — Workflow environment variables

---

## Advanced Configuration

### Custom Runners

To use self-hosted runners instead of GitHub-hosted:

```yaml
runs-on: self-hosted
tags:
  - docker
  - production
```

### Multi-region Deployment

Deploy to multiple servers:

```yaml
strategy:
  matrix:
    region: [eu-west, us-east]
    include:
      - region: eu-west
        host: ${{ secrets.EU_HOST }}
      - region: us-east
        host: ${{ secrets.US_HOST }}
```

### Notification Integrations

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚀 Deployed to production!"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Security Best Practices

✅ **Use separate SSH keys** for staging and production
✅ **Rotate secrets** regularly
✅ **Enable branch protection** for main
✅ **Require PR reviews** before merging
✅ **Use environment secrets** for sensitive data
✅ **Enable CodeQL** security scanning
✅ **Keep Docker images updated**

---

## Resources

### Project Documentation

- **[VARIABLES_SETUP.md](.github/VARIABLES_SETUP.md)** — Quick setup guide
- **[VARIABLES_USAGE.md](.github/VARIABLES_USAGE.md)** — Using variables in workflows

### External Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

---

**Questions?** Open an [issue](https://github.com/zombiQWERTY/list_am_bot/issues) or check [discussions](https://github.com/zombiQWERTY/list_am_bot/discussions).
