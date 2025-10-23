# Variables Usage in GitHub Actions

Quick reference for using variables in different workflow contexts.

## 📍 Where Variables Are Available

| Context        | Secrets        | Variables   | GitHub Context | Env        |
| -------------- | -------------- | ----------- | -------------- | ---------- |
| **Build Job**  | ✅ `secrets.*` | ✅ `vars.*` | ✅ `github.*`  | ✅ `env.*` |
| **Test Job**   | ✅ `secrets.*` | ✅ `vars.*` | ✅ `github.*`  | ✅ `env.*` |
| **Deploy Job** | ✅ `secrets.*` | ✅ `vars.*` | ✅ `github.*`  | ✅ `env.*` |

## 🔧 Usage Examples

### 1. In Workflow Steps

```yaml
steps:
  - name: Use variables
    run: |
      echo "Deploy to: ${{ vars.DEPLOY_HOST }}"
      echo "Bot token: ${{ secrets.BOT_TOKEN }}"
      echo "Commit SHA: ${{ github.sha }}"
      echo "Registry: ${{ env.REGISTRY }}"
```

### 2. As Environment Variables

```yaml
steps:
  - name: Run command
    env:
      HOST: ${{ vars.DEPLOY_HOST }}
      TOKEN: ${{ secrets.BOT_TOKEN }}
    run: |
      echo "Host: $HOST"
      # Token not printed for security
```

### 3. In Docker Build Args

```yaml
- name: Build image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile
    build-args: |
      NODE_ENV=${{ vars.NODE_ENV }}
      APP_VERSION=${{ github.sha }}
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
```

### 4. In SSH Action

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v1.0.0
  env:
    CONFIG: ${{ secrets.CONFIG }}
    VERSION: ${{ github.sha }}
  with:
    host: ${{ vars.DEPLOY_HOST }}
    username: ${{ vars.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    envs: CONFIG,VERSION
    script: |
      echo "Deploying version: ${VERSION}"
      echo "${CONFIG}" > .env
```

### 5. Conditional on Variables

```yaml
steps:
  - name: Deploy to production
    if: vars.NODE_ENV == 'production'
    run: echo "Deploying to production"
```

## 🎯 Common Patterns

### Pattern 1: Multi-line Config

```yaml
env:
  CONFIG: ${{ secrets.CONFIG }}
with:
  envs: CONFIG
  script: |
    echo "${CONFIG}" > .env
    source .env
    echo "BOT_TOKEN is set: ${BOT_TOKEN:+yes}"
```

### Pattern 2: Dynamic Image Tags

```yaml
build-args: |
  BASE_IMAGE=${{ env.REGISTRY }}/${{ github.repository }}/base:${{ github.ref_name }}
  VERSION=${{ github.sha }}
```

### Pattern 3: Multiple Secrets

```yaml
env:
  DB_USER: ${{ secrets.POSTGRES_USERNAME }}
  DB_PASS: ${{ secrets.POSTGRES_PASSWORD }}
  BOT_TOKEN: ${{ secrets.BOT_TOKEN }}
with:
  envs: DB_USER,DB_PASS,BOT_TOKEN
```

## 📚 Context Reference

### `secrets.*`

```yaml
${{ secrets.BOT_TOKEN }}           # Repository secret
${{ secrets.GITHUB_TOKEN }}        # Automatic token
${{ secrets.CONFIG }}              # Multi-line secret
```

### `vars.*`

```yaml
${{ vars.DEPLOY_HOST }}            # Repository variable
${{ vars.NODE_ENV }}               # Repository variable
${{ vars.PROJECT_DIR }}            # Repository variable
```

### `github.*`

```yaml
${{ github.sha }}                  # Commit SHA
${{ github.ref }}                  # Full ref (refs/heads/main)
${{ github.ref_name }}             # Branch name (main)
${{ github.actor }}                # Who triggered
${{ github.repository }}           # owner/repo
${{ github.event.head_commit.timestamp }}
```

### `env.*`

```yaml
${{ env.REGISTRY }}                # Workflow env
${{ env.IMAGE_NAME }}              # Workflow env
```

## ⚠️ Security Notes

### ✅ DO

- Use `secrets.*` for sensitive data
- Use `vars.*` for non-sensitive config
- Mask secrets in logs automatically
- Use `envs:` to pass to SSH

### ❌ DON'T

- Don't echo secrets directly
- Don't put secrets in build-args unless necessary
- Don't commit secrets to repo
- Don't use secrets in PR from forks

## 🔍 Debugging

### Check Variable Value (Safe)

```yaml
- name: Debug variables
  run: |
    echo "Host: ${{ vars.DEPLOY_HOST }}"
    echo "User: ${{ vars.DEPLOY_USER }}"
    echo "Ref: ${{ github.ref_name }}"
```

### Check Secret Exists (Without Revealing)

```yaml
- name: Check secrets
  run: |
    if [ -n "${{ secrets.BOT_TOKEN }}" ]; then
      echo "BOT_TOKEN is set"
    else
      echo "BOT_TOKEN is missing"
    fi
```

## 📖 Related Docs

- [CICD.md](../CICD.md) — Full CI/CD documentation
- [VARIABLES_SETUP.md](VARIABLES_SETUP.md) — Setup guide

---

**Tip:** Use `${{ toJSON(github) }}` to see all available GitHub context values in workflow run.
