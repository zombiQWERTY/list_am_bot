# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

**Note:** As this is an actively developed project, we recommend always using the latest version from the `main` branch.

## Reporting a Vulnerability

We take the security of List.am Bot seriously. If you discover a security vulnerability, please follow these guidelines:

### 🔒 Private Disclosure

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them privately using one of the following methods:

### Preferred Methods

1. **GitHub Security Advisories** (Recommended)
   - Go to the [Security tab](https://github.com/zombiQWERTY/list_am_bot/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Direct Contact**
   - **Telegram:** [@zinovev_space](https://t.me/zinovev_space)
   - Subject: `[SECURITY] List.am Bot Vulnerability`

### What to Include

When reporting a vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** (for follow-up questions)

### Example Report

```markdown
## Vulnerability Description

SQL Injection in subscription query parameter

## Steps to Reproduce

1. Create subscription with payload: `'; DROP TABLE users; --`
2. Bot processes the query without sanitization
3. Database tables are affected

## Impact

- High severity
- Could lead to data loss
- Affects all users

## Suggested Fix

Use parameterized queries instead of string concatenation

## Contact

- GitHub: @username
- Telegram: @username
```

## Response Timeline

We will make our best effort to respond according to the following timeline:

| Stage                   | Timeline              |
| ----------------------- | --------------------- |
| **Initial Response**    | Within 48 hours       |
| **Triage & Assessment** | Within 1 week         |
| **Fix Development**     | Depends on severity   |
| **Public Disclosure**   | After fix is deployed |

### Severity Levels

- **Critical**: Immediate action (within 24-48 hours)
  - Remote code execution
  - Authentication bypass
  - Data exposure

- **High**: Action within 1 week
  - Privilege escalation
  - SQL injection
  - XSS vulnerabilities

- **Medium**: Action within 2-4 weeks
  - Information disclosure
  - Denial of service

- **Low**: Action within 1-2 months
  - Minor security improvements

## Security Best Practices for Users

### For Bot Administrators

1. **Secure Your Tokens**

   ```bash
   # Never commit tokens to git
   echo "BOT_TOKEN=your_token" >> .env
   echo ".env" >> .gitignore
   ```

2. **Use Strong Passwords**
   - Use long, random passwords for database
   - Rotate credentials regularly
   - Never use default passwords

3. **Keep Dependencies Updated**

   ```bash
   # Check for vulnerabilities
   npm audit

   # Update dependencies
   npm update
   ```

4. **Secure Your Server**
   - Use SSH key authentication (not passwords)
   - Change default SSH port (e.g., 2221 instead of 22)
   - Enable firewall
   - Keep system updated
   - Use fail2ban for brute-force protection

5. **Environment Variables**
   ```bash
   # Use secrets management
   # Never expose in logs or error messages
   # Restrict file permissions
   chmod 600 .env
   ```

### For Contributors

1. **Code Review**
   - Review all changes before merging
   - Look for potential security issues
   - Follow secure coding practices

2. **Dependencies**
   - Only add trusted dependencies
   - Review package.json changes
   - Check for known vulnerabilities

3. **Secrets in Code**
   - Never hardcode credentials
   - Use environment variables
   - Don't commit sensitive data

## Security Features

### Current Security Measures

✅ **Input Validation**

- Query sanitization
- URL validation
- User input filtering

✅ **Authentication**

- Telegram user verification
- Session management
- PostgreSQL authentication

✅ **Rate Limiting**

- Telegram API rate limiting (25 msg/sec)
- List.am scraping rate limiting (2 req/sec)

✅ **Data Protection**

- Automatic cleanup on bot block
- Secure password storage
- Database encryption (PostgreSQL SSL)

✅ **Monitoring**

- Error logging with Winston
- Metrics collection
- Admin incident notifications

✅ **Dependency Management**

- Dependabot enabled
- Regular security updates
- Automated vulnerability scanning

### Planned Security Improvements

🔄 **In Progress**

- CodeQL security analysis
- Automated security testing

📋 **Planned**

- Input sanitization improvements
- Enhanced logging for security events
- Security audit

## Security Tools

### Enabled Security Features

- **Dependabot** - Automated dependency updates
- **CodeQL** - Security vulnerability scanning
- **GitHub Secret Scanning** - Prevents token leaks
- **Branch Protection** - Requires reviews before merge

### Recommended Tools

For local security testing:

```bash
# Audit dependencies
npm audit

# Check for outdated packages
npm outdated

# Run security scan
npm run security-check  # (if configured)
```

## Disclosure Policy

### Coordinated Disclosure

We follow a coordinated disclosure policy:

1. **Private Report** → Vulnerability reported privately
2. **Acknowledgment** → We confirm receipt within 48 hours
3. **Investigation** → We investigate and develop a fix
4. **Fix Deployed** → Patch is deployed to production
5. **Public Disclosure** → After 90 days or when fix is live
6. **Credit Given** → Reporter credited (if desired)

### Security Advisories

Public security advisories are published at:

- [GitHub Security Advisories](https://github.com/zombiQWERTY/list_am_bot/security/advisories)

## Acknowledgments

We appreciate the security researchers and contributors who help keep List.am Bot secure.

### Security Contributors

None yet. Be the first to report a vulnerability!

---

## Additional Resources

- **GitHub Security Best Practices**: https://docs.github.com/en/code-security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **NestJS Security**: https://docs.nestjs.com/security/helmet

---

**Questions?** Contact [@zinovev_space](https://t.me/zinovev_space) or open a [discussion](https://github.com/zombiQWERTY/list_am_bot/discussions).
