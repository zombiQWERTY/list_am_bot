# Contributing to List.am Bot

First off, thank you for considering contributing to List.am Bot! 🎉

The following is a set of guidelines for contributing to this project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots, logs)
- **Describe the behavior you observed** and what you expected
- **Include environment details** (OS, Node.js version, etc.)

**Example:**

```markdown
## Bug Description

Bot crashes when adding subscription with emoji in query

## Steps to Reproduce

1. Start the bot with `/start`
2. Click "Add Subscription"
3. Enter query with emoji: "iPhone 📱"
4. Bot crashes

## Expected Behavior

Should accept emoji in queries or show error message

## Environment

- OS: macOS 14.0
- Node.js: 18.17.0
- Bot version: 1.0.0
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` — Good for newcomers
- `help wanted` — Extra attention needed
- `enhancement` — New feature requests

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/zombiQWERTY/list_am_bot.git
cd list_am_bot
```

### 2. Set Up Environment

```bash
cp env.example .env
# Edit .env with your development settings (BOT_TOKEN is required)
```

### 3. Start Services

```bash
make up
```

### 4. First Time Setup: Create Database Schema

```bash
# Access container
docker exec -it list_am_bot.core bash

# Create schemas
psql $POSTGRES_BASE_URL -c "CREATE SCHEMA IF NOT EXISTS core;"

# Run migrations
/opt/typeorm-migrate.sh

# Exit
exit
```

### 5. Verify Setup

```bash
# Check logs
make logs

# Should see bot started successfully
```

### 6. Making Changes

When you modify code:

```bash
# If you added dependencies
npm install <package-name>
make rebuild-one
```

## 📝 Coding Guidelines

### TypeScript Style

- Use **TypeScript** for all new code
- Enable strict type checking
- Prefer `interface` over `type` for object shapes
- Use `unknown` instead of `any` when type is truly unknown
- Export types and interfaces when they're used in multiple files

### Code Structure

- Follow the **layered architecture** pattern:
  - `domain/` — Pure business logic, no dependencies
  - `application/` — Use cases, orchestrates domain
  - `infrastructure/` — External implementations (DB, HTTP, etc.)
  - `interfaces/` — Controllers, bot handlers
  - `common/` — Shared utilities

- Keep functions **small and focused**
- Use **descriptive names** for variables and functions
- Avoid **deep nesting** (max 3 levels)

### NestJS Conventions

- Use **dependency injection** for all services
- Implement proper **module separation**
- Use **port/adapter pattern** for repositories
- Apply **exception filters** for error handling
- Use **guards** for authorization (when applicable)

### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}
class SubscriptionRepository {}

// Interfaces: PascalCase with 'I' prefix for ports
interface IUserRepository {}

// Variables/Functions: camelCase
const userName = 'John';
function getUserById() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const LIST_AM_BOT = 'LIST_AM_BOT';

// Files: kebab-case
user.service.ts;
subscription.repository.ts;
```

### Comments

- Write **self-documenting code** — code should be readable without comments
- Add comments only when explaining **why**, not **what**
- Remove commented-out code
- Avoid obvious comments

```typescript
// ❌ Bad
// Check if user exists
if (user) {
}

// ✅ Good
// Legacy users don't have email field, so we skip validation
if (user && !user.email) {
}
```

### Testing

- Write **unit tests** for business logic
- Use **mocks** for external dependencies
- Aim for **80%+ code coverage**
- Test **edge cases** and error scenarios

```bash
# Run tests
npm run test

# With coverage
npm run test:cov
```

## 📤 Commit Messages

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style changes (formatting, missing semicolons, etc.)
- `refactor` — Code refactoring (no functional changes)
- `perf` — Performance improvements
- `test` — Adding or updating tests
- `chore` — Maintenance tasks (dependencies, build, etc.)

### Examples

```bash
feat(bot): add multi-language support

- Added i18n infrastructure
- Implemented English and Russian translations
- Users can switch language in settings

Closes #42
```

```bash
fix(scraper): handle timeout errors gracefully

Previously, timeout errors would crash the worker.
Now we catch and log them, then retry with backoff.

Fixes #38
```

```bash
refactor(subscription): extract validation to domain layer

Moved subscription query validation from service to entity.
No functional changes, just better separation of concerns.
```

## 🔀 Pull Request Process

### Before Submitting

1. **Ensure code compiles** without errors

   ```bash
   # Inside container
   docker exec -it list_am_bot.core npm run build

   # Or locally
   npm run build
   ```

2. **Run linter** and fix all issues

   ```bash
   # Inside container
   docker exec -it list_am_bot.core npm run lint

   # Or locally
   npm run lint
   ```

3. **Format code** with Prettier

   ```bash
   npm run format
   ```

4. **Run tests** and ensure they pass

   ```bash
   # Inside container
   docker exec -it list_am_bot.core npm run test

   # Or locally
   npm run test
   ```

5. **Test in Docker** environment

   ```bash
   make rebuild-one
   make logs
   # Verify bot works correctly
   ```

6. **Update documentation** if needed

### Creating Pull Request

1. **Create a feature branch** from `main`

   ```bash
   git checkout -b feat/amazing-feature
   ```

2. **Make your changes** following the coding guidelines

3. **Commit your changes** with conventional commit messages

   ```bash
   git commit -m "feat(scope): add amazing feature"
   ```

4. **Push to your fork**

   ```bash
   git push origin feat/amazing-feature
   ```

5. **Open a Pull Request** on GitHub
   - Use a clear and descriptive title
   - Reference any related issues
   - Describe what changes you made and why
   - Add screenshots/GIFs for UI changes

### PR Template

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Closes #XX

## Testing

- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No lint errors

## Screenshots (if applicable)

Add screenshots here

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added where necessary
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

- At least one maintainer will review your PR
- Address all review comments
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release! 🎉

## 🆘 Getting Help

- **Questions?** Open a [discussion](https://github.com/yourusername/list_am_bot/discussions)
- **Bugs?** Open an [issue](https://github.com/yourusername/list_am_bot/issues)
- **Setup issues?** Check [QUICK_START.md](QUICK_START.md) and [Troubleshooting](README.md#-troubleshooting)

### Development Commands Quick Reference

```bash
# Starting/Stopping
make up              # Start everything
make down            # Stop everything
make restart         # Restart bot

# Building
make rebuild-all     # Rebuild entire project
make rebuild-one     # Rebuild bot only

# Debugging
make logs            # View logs
make shell           # Access bot container

# Migrations (inside container via `make shell`)
/opt/typeorm-generate.sh <name>   # Generate migration
/opt/typeorm-migrate.sh           # Run migrations
/opt/typeorm-revert.sh            # Revert last migration
```

## 🌟 Recognition

All contributors will be recognized in our README and release notes. Thank you for making List.am Bot better! ❤️

---

**Happy coding!** 🚀
