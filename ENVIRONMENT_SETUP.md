# Environment Variables & Secrets Setup Guide

## Quick Overview

This project has **3 environment files** and **GitHub Secrets** for deployment:

```
.env           → Local development (your machine)
.env.staging   → Staging deployment configuration
.env.prod      → Production deployment configuration
GitHub Secrets → Deployment credentials (SSH keys, registry login, etc.)
```

---

## Part 1: Environment Files (`.env.*`)

### What are `.env` files?

These files contain configuration that changes based on your deployment environment (dev, staging, production). They're loaded by Vite at build time.

### Current Files

#### `.env` (Local Development)
```bash
VITE_SERVER_URL=https://back.staging.maryai.yurtal.tech/
```
- Used only on your machine when running `yarn dev`
- Points to staging backend for local development
- **Git-ignored** (don't commit local secrets)

#### `.env.staging` (Staging Environment)
```bash
VITE_SERVER_URL=https://back.staging.maryai.yurtal.tech
```
- Used when building for staging deployment
- Points to staging backend
- **Checked into Git** (safe because no secrets)
- Build process automatically uses this file

#### `.env.prod` (Production Environment)
```bash
VITE_SERVER_URL=https://back.maryai.yurtal.tech
```
- Used when building for production deployment
- Points to production backend
- **Checked into Git** (safe because no secrets)
- Build process automatically uses this file

### How the Build Process Uses `.env.*` Files

```
Development:  yarn dev  → reads .env → live server on localhost:8081

Staging build: yarn build + .env.staging → dist/ folder built with staging vars

Production build: yarn build + .env.prod → dist/ folder built with prod vars
```

**Important:** Variables are **baked into the JavaScript bundle** at build time. You cannot change them after deployment without rebuilding.

---

## Part 2: Adding New Environment Variables

### Step 1: Add to all three `.env*` files

```bash
# .env
VITE_MY_NEW_VAR=local_value

# .env.staging
VITE_MY_NEW_VAR=staging_value

# .env.prod
VITE_MY_NEW_VAR=prod_value
```

**Rules:**
- ✅ Start with `VITE_` prefix (Vite requirement)
- ✅ Use UPPERCASE with underscores
- ✅ Only public, non-sensitive values
- ❌ Never put passwords, API keys, or tokens here

### Step 2: Use in your code

```typescript
// src/components/MyComponent.tsx
const apiUrl = import.meta.env.VITE_MY_NEW_VAR;

// Vite replaces at build time:
// - Development: "local_value"
// - Staging build: "staging_value"
// - Prod build: "prod_value"
```

### Step 3: Type it (TypeScript)

Create or update `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_MY_NEW_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Part 3: GitHub Secrets for Deployment

### What are GitHub Secrets?

These are **sensitive deployment credentials** stored securely in GitHub and never exposed in code:
- Docker registry login credentials
- SSH private keys for server access
- API tokens

### Where to Add Them

1. Go to GitHub repository
2. **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**

### Required Secrets

#### 1. Docker Registry Secrets (Shared for all deployments)

These let GitHub authenticate with your Docker registry to push images.

| Secret Name | Example Value | Where to Get |
|---|---|---|
| `REGISTRY_URL` | `registry.example.com` | Your container registry admin |
| `REGISTRY_IMAGE_NAME` | `mycompany/maryai-frontv2` | Your registry |
| `REGISTRY_USER` | `my_registry_user` | Registry account |
| `REGISTRY_PASSWORD` | `abcd1234efgh5678...` | Use an API token, not password |

#### 2. Staging Deployment Secrets

These let GitHub SSH into your staging server.

| Secret Name | Example Value | Where to Get |
|---|---|---|
| `STAGING_HOST` | `staging.example.com` or `192.168.1.100` | Staging server IP/hostname |
| `STAGING_USER` | `deploy` | SSH user on staging server |
| `STAGING_SSH_PRIVATE_KEY` | (see below) | SSH key pair you create |

#### 3. Production Deployment Secrets

These let GitHub SSH into your production server.

| Secret Name | Example Value | Where to Get |
|---|---|---|
| `PROD_HOST` | `prod.example.com` or `203.0.113.42` | Production server IP/hostname |
| `PROD_USER` | `deploy` | SSH user on production server |
| `PROD_SSH_PRIVATE_KEY` | (see below) | SSH key pair you create |

### How to Generate SSH Private Key

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -f deploy_key -C "github-actions"

# This creates two files:
# deploy_key          (PRIVATE KEY - add to GitHub Secrets)
# deploy_key.pub      (PUBLIC KEY - add to server)

# Copy the PRIVATE key content
cat deploy_key
# Output:
# -----BEGIN OPENSSH PRIVATE KEY-----
# MIIEowIBAAKCAQEA3xc0MH...
# ...
# -----END OPENSSH PRIVATE KEY-----

# Copy this ENTIRE text (including BEGIN/END lines) into GitHub Secret
```

### How to Add SSH Key to Server

```bash
# On your deployment server
mkdir -p ~/.ssh

# Add the public key
cat deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test it works
ssh -i deploy_key deploy@staging.example.com "echo 'Connected!'"
```

---

## Part 4: GitHub Environments

GitHub Environments add an extra approval layer for production deployments.

### What are Environments?

- **staging**: Auto-deploy when code is pushed
- **production**: Requires manual approval before deployment

### How to Set Up

1. Go to **Settings** > **Environments**
2. Create `staging` environment:
   - Add secrets: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_PRIVATE_KEY`
   - No protection rules (auto-deploy)

3. Create `production` environment:
   - Add secrets: `PROD_HOST`, `PROD_USER`, `PROD_SSH_PRIVATE_KEY`
   - Protection rules:
     - ✅ "Required reviewers" - at least 1 person must approve deployment
     - ✅ "Limit to deployments to this environment" - only master branch

---

## Part 5: How Deployment Works (End-to-End)

### When you push to `staging` branch:

```
1. GitHub Actions triggered
   ↓
2. Build Docker image with .env.staging baked in
   ↓
3. Push image to registry (using REGISTRY_USER + REGISTRY_PASSWORD secrets)
   ↓
4. SSH into staging server (using STAGING_HOST + STAGING_USER + STAGING_SSH_PRIVATE_KEY)
   ↓
5. Pull new image and restart Docker Swarm service
   ↓
6. New version live at staging.maryai.yurtal.tech
```

### When you push to `master` branch:

```
1. GitHub Actions triggered
   ↓
2. Build Docker image with .env.prod baked in
   ↓
3. Push image to registry
   ↓
4. [WAIT FOR APPROVAL - if environment protection enabled]
   ↓
5. SSH into production server
   ↓
6. Pull new image and restart Docker Swarm service
   ↓
7. New version live at maryai.yurtal.tech
```

---

## Part 6: Checklist: Setting Up From Scratch

### Initial Setup (Do Once)

- [ ] Generate SSH key pair: `ssh-keygen -t ed25519 -f deploy_key`
- [ ] Add public key to servers: `~/.ssh/authorized_keys`

### GitHub Repository Setup

- [ ] Go to Settings > Secrets and variables > Actions
- [ ] Add shared secrets:
  - [ ] `REGISTRY_URL`
  - [ ] `REGISTRY_IMAGE_NAME`
  - [ ] `REGISTRY_USER`
  - [ ] `REGISTRY_PASSWORD`

- [ ] Create `staging` environment:
  - [ ] `STAGING_HOST`
  - [ ] `STAGING_USER`
  - [ ] `STAGING_SSH_PRIVATE_KEY` (paste entire private key)

- [ ] Create `production` environment:
  - [ ] `PROD_HOST`
  - [ ] `PROD_USER`
  - [ ] `PROD_SSH_PRIVATE_KEY` (paste entire private key)
  - [ ] Enable "Required reviewers" protection rule

### Environment Files Setup

- [ ] Verify `.env.staging` has correct `VITE_SERVER_URL`
- [ ] Verify `.env.prod` has correct `VITE_SERVER_URL`
- [ ] Add to `.gitignore` if needed:
  ```
  .env
  .env.*.local
  deploy_key
  ```

### Test It

- [ ] Push to `staging` branch
- [ ] Verify GitHub Actions workflow succeeds
- [ ] Test staging deployment
- [ ] Push to `master` branch
- [ ] Approve deployment
- [ ] Verify production deployment

---

## Part 7: Common Issues & Solutions

### Issue: "Unable to locate image" in deploy step

**Cause:** Registry login failed

**Solution:**
```bash
# Test registry login locally
docker login registry.example.com -u $REGISTRY_USER -p $REGISTRY_PASSWORD

# If fails, check:
# 1. REGISTRY_USER and REGISTRY_PASSWORD are correct
# 2. Account has push permissions
# 3. Use API token instead of password
```

### Issue: "Permission denied (publickey)" in SSH step

**Cause:** SSH private key invalid

**Solution:**
```bash
# Test SSH locally
ssh -i deploy_key deploy@staging.example.com "echo 'test'"

# If fails, check:
# 1. Private key has correct format (-----BEGIN/END-----)
# 2. Public key properly added to ~/.ssh/authorized_keys on server
# 3. SSH user is correct (STAGING_USER/PROD_USER)
# 4. Server IP is correct (STAGING_HOST/PROD_HOST)
```

### Issue: Variables not appearing in frontend

**Cause:** Not using `import.meta.env.VITE_*` or file wasn't rebuilt

**Solution:**
```bash
# Use correct import:
const url = import.meta.env.VITE_SERVER_URL;  // ✅ Correct

// NOT:
const url = process.env.VITE_SERVER_URL;      // ❌ Won't work
const url = VITE_SERVER_URL;                  // ❌ Won't work

# Rebuild
yarn build

# Check the output
grep "VITE_SERVER_URL" dist/index.html
```

### Issue: Wrong environment deployed

**Cause:** Wrong `.env.*` file used during build

**Solution:**
```bash
# Check Dockerfile uses correct .env file
cat Dockerfile | grep "\.env"

# For prod should be:
# COPY .env.prod .env

# Check GitHub Actions log to see which file was used
```

---

## Part 8: Security Best Practices

### DO ✅

- Store secrets in GitHub Secrets, never in code
- Use API tokens for registry passwords
- Rotate SSH keys every 6 months
- Use separate keys for staging and production
- Keep `.env.*` files public (no secrets there)
- Review who has access to production secrets
- Use environment protection rules for production

### DON'T ❌

- Don't commit `.env` file with real secrets
- Don't paste secrets in commit messages
- Don't share private keys via email
- Don't use same SSH key for multiple servers
- Don't hardcode API keys in TypeScript
- Don't log environment variables in CI
- Don't give everyone access to production secrets

---

## Part 9: Environment Variables Reference

### Available in Frontend Code

All variables starting with `VITE_` are available to your code:

```typescript
// These work:
import.meta.env.VITE_SERVER_URL
import.meta.env.VITE_FIREBASE_API_KEY
import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID

// These don't work (not exposed to frontend):
import.meta.env.PRIVATE_KEY_DEV
import.meta.env.DATABASE_URL
```

### Current Variables

```bash
VITE_SERVER_URL                           # Backend API endpoint
VITE_FIREBASE_API_KEY                     # Firebase (optional)
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APPID
VITE_AWS_AMPLIFY_USER_POOL_ID             # AWS (optional)
VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID
VITE_AWS_AMPLIFY_REGION
VITE_AUTH0_DOMAIN                         # Auth0 (optional)
VITE_AUTH0_CLIENT_ID
VITE_AUTH0_CALLBACK_URL
VITE_SUPABASE_URL                         # Supabase (optional)
VITE_SUPABASE_ANON_KEY
```

---

## Summary

| Concept | Purpose | When Used | Where Stored |
|---------|---------|-----------|--------------|
| `.env` files | App configuration | Build time | Git + local |
| `VITE_` variables | Public frontend config | Baked into bundle | `.env*` files |
| GitHub Secrets | Deployment credentials | Runtime (deployment) | GitHub Settings |
| Environments | Approval/permissions | Deployment | GitHub Settings |

---

## Next Steps

1. **Set up GitHub Secrets** (see Part 4)
2. **Create GitHub Environments** (see Part 4)
3. **Test with staging branch**
4. **Test with master branch**
5. **Review DEPLOYMENT.md** for day-to-day usage

Need help? Check the logs in GitHub Actions tab when something fails.
