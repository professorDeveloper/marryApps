# Deployment Guide

## Overview

This document covers:
- Pre-deployment checklist
- How environment variables and secrets work
- Deployment process for staging and production
- Troubleshooting common issues

---

## 1. Environment Variables & Secrets

### How It Works

The project uses **three environment files** that control application behavior:

| File | Purpose | Environment |
|------|---------|-------------|
| `.env` | Local development | Your machine |
| `.env.staging` | Staging deployment | Staging server |
| `.env.prod` | Production deployment | Production server |

### Environment Variable Naming Convention

All environment variables use the `VITE_` prefix (required by Vite):
```
VITE_SERVER_URL=https://back.maryai.yurtal.tech
VITE_FIREBASE_API_KEY=xxx
```

The `VITE_` prefix means these variables are **publicly accessible in the frontend** (they get baked into the compiled JavaScript). **Never put sensitive secrets here** — use backend API keys instead.

### Key Variables

```bash
# Backend API URL (changes per environment)
VITE_SERVER_URL=https://back.staging.maryai.yurtal.tech        # staging
VITE_SERVER_URL=https://back.maryai.yurtal.tech               # production

# Firebase (optional, currently empty)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APPID=

# AWS Amplify (optional, currently empty)
VITE_AWS_AMPLIFY_USER_POOL_ID=
VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID=
VITE_AWS_AMPLIFY_REGION=

# Auth0 (optional, currently empty)
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_CALLBACK_URL=

# Supabase (optional, currently empty)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Docker Build Process

The `Dockerfile` uses `.env.prod` during the production build (see line 17):
```dockerfile
COPY .env.prod .env
RUN bun run build
```

This means:
1. Environment variables are compiled into the frontend bundle at build time
2. You **cannot change them after deployment** without rebuilding
3. Staging and production use **different environment files** during their respective builds

---

## 2. GitHub Secrets Configuration

GitHub Secrets are used for **sensitive deployment credentials** (not application config).

### Where to Add Secrets

GitHub > Repository Settings > Secrets and variables > Actions

### Required Secrets

#### Registry Secrets (Shared)
These are used to authenticate with your Docker registry:

```
REGISTRY_URL                    # Docker registry URL (e.g., registry.example.com)
REGISTRY_IMAGE_NAME             # Image name (e.g., maryai/frontv2)
REGISTRY_USER                   # Registry username
REGISTRY_PASSWORD               # Registry password (use token for safety)
```

#### Staging Secrets
Used only when deploying to staging:

```
STAGING_HOST                    # Staging server IP/hostname
STAGING_USER                    # SSH username (e.g., deploy)
STAGING_SSH_PRIVATE_KEY         # SSH private key for authentication
```

#### Production Secrets
Used only when deploying to production (requires extra approval):

```
PROD_HOST                       # Production server IP/hostname
PROD_USER                       # SSH username (e.g., deploy)
PROD_SSH_PRIVATE_KEY            # SSH private key for authentication
```

### How to Add a Secret

1. Go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Name: `STAGING_HOST` (example)
4. Value: `192.168.1.100` (example)
5. Click "Add secret"

---

## 3. Environment Secrets vs Environments

GitHub has two types of secrets:

### Repository Secrets
- Applied to all workflows
- Use for shared credentials (registry login)

### Environment Secrets
- Applied only to specific environment deployments
- Use for staging-specific or production-specific credentials

**Current Setup:**
- Staging secrets are in the `staging` environment
- Production secrets are in the `production` environment
- This ensures staging deployments don't have access to production keys

---

## 4. Pre-Deployment Checklist

### Before Merging to `staging` or `master`

- [ ] **Code Quality**
  - [ ] All tests passing: `yarn typecheck`
  - [ ] No ESLint errors: `yarn lint`
  - [ ] Code formatted: `yarn fm:fix`
  - [ ] Run: `yarn fix:all` to fix both in one command

- [ ] **Environment Variables**
  - [ ] `.env.staging` updated if needed (for staging branch)
  - [ ] `.env.prod` updated if needed (for master/prod branch)
  - [ ] Only public, non-sensitive vars in `.env.*` files
  - [ ] VITE_SERVER_URL points to correct backend

- [ ] **Functionality**
  - [ ] Feature tested locally with `yarn dev`
  - [ ] API integration verified against staging/prod backend
  - [ ] All new features work as expected
  - [ ] No console errors in browser DevTools
  - [ ] Responsive design verified (mobile, tablet, desktop)

- [ ] **Git**
  - [ ] Code committed with clear message
  - [ ] Pushed to feature branch first (if using PR workflow)
  - [ ] PR reviewed and approved (if required)
  - [ ] Merge conflicts resolved
  - [ ] No accidental environment files with secrets

### During Deployment

1. **Staging Deployment** (automatic on `staging` branch push)
   - [ ] GitHub Actions workflow starts (check Actions tab)
   - [ ] Build completes successfully
   - [ ] Image pushed to registry
   - [ ] SSH deployment to staging succeeds
   - [ ] Test app at `https://staging.maryai.yurtal.tech` (or your URL)
   - [ ] Verify features work as expected
   - [ ] Check browser console for errors

2. **Production Deployment** (automatic on `master` branch push)
   - [ ] GitHub Actions workflow starts
   - [ ] Build completes successfully
   - [ ] Image pushed to registry
   - [ ] SSH deployment to production succeeds
   - [ ] Test app at `https://maryai.yurtal.tech` (or your URL)
   - [ ] Verify all critical features work
   - [ ] Monitor for errors in production logs/monitoring

### After Deployment

- [ ] Verify deployment in production monitoring/logs
- [ ] Check if any rollback needed (if issues found)
- [ ] Document any deployment notes or issues
- [ ] Notify team of successful deployment

---

## 5. Deployment Process (Step-by-Step)

### For Staging

```bash
# 1. Create/checkout feature branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push to staging branch
git push origin feature/my-feature
git checkout staging
git pull origin staging
git merge feature/my-feature
git push origin staging

# GitHub Actions automatically:
# - Builds Docker image
# - Tags as "staging"
# - Pushes to registry
# - SSH deploys to staging server
# - Restarts maryai_frontv2_staging service
```

### For Production

```bash
# 1. Ensure everything works in staging first ✅
# 2. Create pull request from staging to master (or merge directly)

git checkout master
git pull origin master
git merge staging
git push origin master

# GitHub Actions automatically:
# - Builds Docker image
# - Tags as "latest"
# - Pushes to registry
# - SSH deploys to production server
# - Restarts maryai_frontv2 service
```

---

## 6. Manual Deployment (If Needed)

If GitHub Actions fails or you need to manually deploy:

```bash
# Build locally
yarn build

# Build Docker image
docker build -t myregistry.com/maryai/frontv2:latest .

# Push to registry
docker push myregistry.com/maryai/frontv2:latest

# SSH into server
ssh deploy@staging-server.com

# Pull and update service
docker login myregistry.com -u user -p password
docker pull myregistry.com/maryai/frontv2:latest
docker service update --force maryai_frontv2_staging
```

---

## 7. Troubleshooting

### Deployment Fails in GitHub Actions

**Check logs:**
1. Go to GitHub > Actions tab
2. Click the failed workflow run
3. Click the job (build, deploy-staging, or deploy-production)
4. Read the error output

**Common issues:**

| Error | Solution |
|-------|----------|
| `docker: command not found` | SSH key invalid or server doesn't have Docker |
| `Unable to locate image` | Registry login failed or image not pushed |
| `Service not found: maryai_frontv2` | Docker Swarm service doesn't exist on server |
| `Permission denied (publickey)` | SSH private key in secrets is invalid or wrong format |
| `Build failed` | Check TypeScript errors: `yarn typecheck` |

### Environment Variables Not Working

```bash
# Check what's in the build:
# 1. Verify .env.prod/.env.staging is correct
cat .env.prod

# 2. Rebuild locally
yarn build

# 3. Check the built HTML/JS for the variable
grep "VITE_SERVER_URL" dist/index.html
```

### Rollback to Previous Version

```bash
# SSH into server
ssh deploy@production-server.com

# Find previous image tag
docker images | grep frontv2

# Redeploy with previous tag
docker service update --image myregistry/frontv2:previous-tag maryai_frontv2
```

---

## 8. Security Best Practices

- ✅ Keep SSH private keys secure (rotate periodically)
- ✅ Use registry tokens instead of passwords
- ✅ Never commit `.env.*` files with real secrets
- ✅ Use GitHub environment secrets for prod (requires approval)
- ✅ Rotate Docker registry credentials regularly
- ✅ Don't hardcode sensitive data in code
- ✅ Use `VITE_` prefix for public vars only
- ✅ Keep .gitignore updated with `*.env*` if needed

---

## 9. Files Reference

| File | Purpose |
|------|---------|
| `.github/workflows/build-and-deploy.yml` | GitHub Actions CI/CD pipeline |
| `.env` | Local development config (git-ignored) |
| `.env.staging` | Staging environment config (checked in) |
| `.env.prod` | Production environment config (checked in) |
| `Dockerfile` | Multi-stage Docker build |
| `package.json` | Node.js dependencies and scripts |
| `vite.config.ts` | Vite build configuration |

---

## 10. Quick Reference

```bash
# Local development
yarn dev                # Start dev server

# Before deployment
yarn fix:all           # Lint + format all files
yarn typecheck         # Check TypeScript types

# Build
yarn build             # Build for production

# Deployment (automatic via GitHub Actions)
# Push to staging or master branch, GitHub handles the rest
```

---

## Questions?

- Check GitHub Actions logs for deployment errors
- Review the workflow file: `.github/workflows/build-and-deploy.yml`
- Verify environment files: `.env.staging`, `.env.prod`
- Check Docker logs on the server: `docker service logs maryai_frontv2`
