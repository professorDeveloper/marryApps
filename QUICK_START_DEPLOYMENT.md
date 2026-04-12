# Quick Start: Deployment & Environment Variables

**TL;DR for developers** - Read this first, then dive into full docs if needed.

---

## What You Need to Know

### 1. Three Environment Files

```bash
.env           # Local development (your machine) - not committed with secrets
.env.staging   # Staging server - committed to git
.env.prod      # Production server - committed to git
```

**Key difference:** They point to different backends:
- Staging: `VITE_SERVER_URL=https://back.staging.maryai.yurtal.tech`
- Prod: `VITE_SERVER_URL=https://back.maryai.yurtal.tech`

### 2. How Deployment Works

```
You push code
    ↓
GitHub Actions runs automatically
    ↓
Builds Docker image (with .env.staging or .env.prod baked in)
    ↓
Pushes to Docker registry
    ↓
SSH into server and restarts the service
    ↓
New version live
```

**Staging:** Auto-deploy on every `staging` branch push
**Production:** Auto-deploy on every `master` branch push (with approval)

### 3. GitHub Secrets (Deployment Credentials)

These are stored in GitHub Settings, NOT in code:
- Docker registry login (username/password)
- SSH keys to access servers
- Server IPs and usernames

You set these once in GitHub, then forget about them.

---

## Before You Deploy

### Pre-Flight Checklist

```bash
# 1. Code quality
yarn fix:all          # Lint + format

# 2. Type check
yarn typecheck        # Check TypeScript

# 3. Verify locally
yarn dev              # Test in browser

# 4. Environment check
cat .env.staging      # Staging backend correct?
cat .env.prod         # Prod backend correct?
```

---

## Deploying to Staging

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
yarn dev
# Test in browser... ✅

# 3. Commit
git add .
git commit -m "Add cool feature"

# 4. Push to staging
git checkout staging
git pull origin staging
git merge feature/my-feature
git push origin staging

# 5. Watch GitHub Actions
# Go to GitHub > Actions tab
# Watch the build and deployment logs
```

---

## Deploying to Production

```bash
# 1. Everything tested in staging? ✅
# 2. Merge staging into master
git checkout master
git pull origin master
git merge staging
git push origin master

# 3. Approve deployment
# GitHub will notify you for approval
# Click "Approve and deploy" in the GitHub UI

# 4. Done! Production updated
```

---

## Adding a New Environment Variable

### If it's public (not a secret):

**Step 1:** Update all three `.env*` files

```bash
# .env
VITE_MY_NEW_VAR=dev_value

# .env.staging
VITE_MY_NEW_VAR=staging_value

# .env.prod
VITE_MY_NEW_VAR=prod_value
```

**Step 2:** Use in your code

```typescript
const value = import.meta.env.VITE_MY_NEW_VAR;
```

**Step 3:** Rebuild to test locally

```bash
yarn build
grep "VITE_MY_NEW_VAR" dist/index.html  # Should see your value
```

### If it's a secret (API key, password, token):

**Don't put it in `.env.*` files!**

Instead:
1. Put it in your **backend** API
2. Frontend calls API to get it
3. Backend controls who can see it

---

## Troubleshooting

### "Deployment failed" in GitHub Actions

1. Click the failed workflow in Actions tab
2. Expand the logs
3. Look for error messages
4. Common issues:
   - SSH key invalid → Check `STAGING_SSH_PRIVATE_KEY` secret
   - Registry login failed → Check `REGISTRY_PASSWORD` secret
   - Server unreachable → Check `STAGING_HOST` is correct

### "Variables not working in frontend"

```bash
# Verify you're using correct import:
import.meta.env.VITE_SERVER_URL  # ✅ Correct

# Verify it's in the built file:
yarn build
grep "SERVER_URL" dist/index.html

# Verify it's in .env.staging or .env.prod:
cat .env.staging | grep VITE_SERVER_URL
```

### Local `yarn dev` works but staging doesn't

1. Check `.env.staging` has correct `VITE_SERVER_URL`
2. Check staging backend is actually running
3. Check CORS settings if API calls fail
4. Check browser console for errors

---

## Files You Should Know About

| File | Purpose |
|------|---------|
| `.env` | Your local development config |
| `.env.staging` | Staging deployment config |
| `.env.prod` | Production deployment config |
| `.github/workflows/build-and-deploy.yml` | GitHub Actions pipeline |
| `DEPLOYMENT.md` | Full deployment guide |
| `ENVIRONMENT_SETUP.md` | Detailed environment & secrets guide |
| `GITHUB_MIGRATION.md` | How to set up GitHub (if starting fresh) |

---

## GitHub Secrets Setup (One Time)

Go to: **Settings** > **Secrets and variables** > **Actions**

Add these (ask DevOps for values):

**Repository Secrets** (shared):
- `REGISTRY_URL`
- `REGISTRY_IMAGE_NAME`
- `REGISTRY_USER`
- `REGISTRY_PASSWORD`

**Staging Environment:**
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_PRIVATE_KEY`

**Production Environment:**
- `PROD_HOST`
- `PROD_USER`
- `PROD_SSH_PRIVATE_KEY`

---

## Summary

| What | Where | When |
|------|-------|------|
| Local config | `.env` | When running `yarn dev` |
| Staging config | `.env.staging` | When deploying to staging |
| Prod config | `.env.prod` | When deploying to prod |
| Deployment creds | GitHub Secrets | When GitHub Actions deploys |
| API secrets | Backend API | Never in frontend |

**Key rule:** If it's a secret, put it in GitHub Secrets, not in code.

---

## Next Steps

1. **Read full guides:**
   - `DEPLOYMENT.md` - Day-to-day deployment tasks
   - `ENVIRONMENT_SETUP.md` - Deep dive into env variables & secrets

2. **Set up GitHub Secrets** (if not done):
   - See `GITHUB_MIGRATION.md` Step 1-4

3. **Test deployment:**
   - Push to `staging` branch
   - Watch GitHub Actions
   - Verify staging deployment works

4. **Deploy to production:**
   - Merge staging into master
   - Approve deployment
   - Verify production works

---

## Common Commands Reference

```bash
# Development
yarn dev                # Start dev server
yarn build              # Build for production
yarn typecheck          # Check types
yarn fix:all           # Lint + format

# Before deployment
yarn dev               # Test locally
cat .env.staging       # Verify staging backend URL
cat .env.prod          # Verify prod backend URL
git status             # Check what's changed

# Deployment (git commands)
git checkout staging
git pull origin staging
git merge feature/my-feature
git push origin staging

# Production
git checkout master
git merge staging
git push origin master
# Then approve in GitHub UI
```

---

## Questions?

1. Check GitHub Actions logs (Actions tab)
2. Read `DEPLOYMENT.md` for detailed troubleshooting
3. Read `ENVIRONMENT_SETUP.md` for environment details
4. Check if `.env.staging` or `.env.prod` needs updating
5. Verify GitHub Secrets are set up (Settings > Secrets)
