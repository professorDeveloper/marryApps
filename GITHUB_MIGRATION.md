# GitLab to GitHub Migration Guide

## Overview

This project is migrating from **GitLab CI/CD** to **GitHub Actions**. This document explains the changes and what you need to do.

---

## Key Differences

| Aspect | GitLab | GitHub |
|--------|--------|--------|
| **CI/CD Config** | `.gitlab-ci.yml` | `.github/workflows/*.yml` |
| **Secrets** | CI/CD Variables | GitHub Secrets + Environments |
| **Approval** | Protected branches | Environment protection rules |
| **Runners** | Shared runners | GitHub-hosted runners |
| **Build Tool** | Kaniko | Docker (buildx) |

---

## What Changed

### 1. CI/CD File Location

**Before (GitLab):**
```
.gitlab-ci.yml
```

**After (GitHub):**
```
.github/workflows/build-and-deploy.yml
```

### 2. Build Process

**Before (GitLab - Kaniko):**
```yaml
image: gcr.io/kaniko-project/executor:v1.21.0-debug
script:
  - /kaniko/executor --context $CI_PROJECT_DIR --dockerfile $DOCKERFILE
```

**After (GitHub - Docker Buildx):**
```yaml
uses: docker/build-push-action@v5
with:
  context: .
  push: true
```

**Why the change?** Docker Buildx is the modern standard for container builds and integrates better with GitHub Actions.

### 3. Secrets Management

**Before (GitLab):**
- CI/CD Variables in GitLab Settings
- Single list of variables

**After (GitHub):**
- Repository Secrets (shared by all workflows)
- Environment Secrets (staging-only or production-only)
- More granular control

### 4. Deployments

**Before (GitLab):**
```yaml
deploy_prod:
  stage: deploy
  only:
    - master
```

**After (GitHub):**
```yaml
deploy-production:
  if: github.ref == 'refs/heads/master'
  environment: production
```

GitHub environments allow requiring approval before production deployments.

---

## Migration Checklist

### Step 1: Remove Old GitLab File

```bash
# You can delete the old file (or keep it as reference)
rm .gitlab-ci.yml

# The new GitHub workflow is already created:
# .github/workflows/build-and-deploy.yml
```

### Step 2: Set Up GitHub Secrets

Go to: **Settings** > **Secrets and variables** > **Actions**

Add these secrets (same names as GitLab, but clearer):

| GitHub Secret Name | GitLab Variable | Value |
|---|---|---|
| `REGISTRY_URL` | `CI_REGISTRY` | Your Docker registry URL |
| `REGISTRY_IMAGE_NAME` | `CI_PROJECT_NAME` | Image name (e.g., `maryai/frontv2`) |
| `REGISTRY_USER` | `CI_REGISTRY_USER` | Registry username |
| `REGISTRY_PASSWORD` | `CI_REGISTRY_PASSWORD` | Registry password/token |

### Step 3: Set Up Staging Environment

1. Go to: **Settings** > **Environments**
2. Click **New environment**
3. Name: `staging`
4. Add environment secrets:
   - `STAGING_HOST` (from `IP_DEV`)
   - `STAGING_USER` (from `USER_DEV`)
   - `STAGING_SSH_PRIVATE_KEY` (from `PRIVATE_KEY_DEV`)

### Step 4: Set Up Production Environment

1. Go to: **Settings** > **Environments**
2. Click **New environment**
3. Name: `production`
4. Add environment secrets:
   - `PROD_HOST` (from `IP_DEV`)
   - `PROD_USER` (from `USER_DEV`)
   - `PROD_SSH_PRIVATE_KEY` (from `PRIVATE_KEY_DEV`)
5. Add **Deployment branches and tags** protection:
   - Select: "Selected branches"
   - Add: `master`
6. Add **Required reviewers**:
   - Check: "Require reviewers"
   - Add at least 1 person

### Step 5: Verify Branches

Ensure you have these branches:
- `master` (production)
- `staging` (staging)

```bash
git branch -a
# Should show:
# origin/master
# origin/staging
```

### Step 6: Test the Workflow

1. Make a small test commit
2. Push to `staging` branch
3. Check **Actions** tab - workflow should start
4. Monitor build and deployment logs
5. Verify deployment on staging server

---

## GitLab Variables → GitHub Mapping

### Deployment Variables

These are now split between Repository Secrets and Environment Secrets:

| GitLab Variable | GitHub Location | New Name |
|---|---|---|
| `CI_REGISTRY` | Repository Secret | `REGISTRY_URL` |
| `CI_REGISTRY_IMAGE` | Repository Secret | `REGISTRY_IMAGE_NAME` |
| `CI_REGISTRY_USER` | Repository Secret | `REGISTRY_USER` |
| `CI_REGISTRY_PASSWORD` | Repository Secret | `REGISTRY_PASSWORD` |
| `IP_DEV` (staging) | Staging Environment | `STAGING_HOST` |
| `IP_DEV` (prod) | Production Environment | `PROD_HOST` |
| `USER_DEV` (staging) | Staging Environment | `STAGING_USER` |
| `USER_DEV` (prod) | Production Environment | `PROD_USER` |
| `PRIVATE_KEY_DEV` (staging) | Staging Environment | `STAGING_SSH_PRIVATE_KEY` |
| `PRIVATE_KEY_DEV` (prod) | Production Environment | `PROD_SSH_PRIVATE_KEY` |

### GitLab Predefined Variables (Now Different)

| GitLab | GitHub |
|--------|--------|
| `$CI_PROJECT_DIR` | `${{ github.workspace }}` |
| `$CI_COMMIT_REF_NAME` | `${{ github.ref_name }}` |
| `$CI_COMMIT_SHA` | `${{ github.sha }}` |
| `$CI_REGISTRY_IMAGE` | `${{ env.IMAGE_NAME }}` |

---

## Workflow Comparison

### GitLab Pipeline

```yaml
stages:
  - build
  - deploy

variables:
  TAG: "latest"

build_image_prod:
  stage: build
  only:
    - master
  # ... build job

deploy_prod:
  stage: deploy
  only:
    - master
  # ... deploy job
```

### GitHub Workflow

```yaml
on:
  push:
    branches:
      - master
      - staging

jobs:
  build:
    runs-on: ubuntu-latest
    # ... build job

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/master'
    environment: production
    # ... deploy job
```

**Key differences:**
- GitHub uses `jobs` instead of `stages`
- `needs:` instead of `stage:` for dependencies
- `if:` instead of `only:` for branch conditions
- `environment:` for deployment approval gates

---

## Benefits of GitHub Actions

✅ **Integrated** - CI/CD built into GitHub (no external service)
✅ **Free** - 2000 minutes/month free for public repos
✅ **Better UI** - Deployment logs and history visible
✅ **Approval Gates** - Environment protection for production
✅ **More Secure** - Secrets masked in logs, environment isolation
✅ **Flexible** - Can use community actions (docker/buildx, appleboy/ssh)

---

## Troubleshooting

### Workflow Not Running

**Check:**
1. Is the file in `.github/workflows/`? (Not `.github/workflows.yml`)
2. YAML syntax correct? (Use online YAML linter)
3. Branch matches trigger? (`push: branches: [master, staging]`)
4. Repository public? (Private repos have limitations)

**Fix:**
```bash
# Verify file exists
ls -la .github/workflows/

# Check syntax
grep "^on:" .github/workflows/build-and-deploy.yml
```

### Secrets Not Available

**Check:**
1. Repository secrets added? (Settings > Secrets)
2. Environment secrets added? (Settings > Environments)
3. Secret names match workflow? (Case-sensitive)

**Fix:**
```bash
# In workflow file, check exact names:
${{ secrets.REGISTRY_URL }}  # ✅ Correct
${{ secrets.registry_url }}  # ❌ Wrong case
```

### Deployment Failing

**Check:**
1. SSH key valid? (Test locally: `ssh -i key user@host`)
2. Server reachable? (Ping the server)
3. Docker installed? (SSH in and check: `docker version`)
4. Swarm service exists? (Check: `docker service ls`)

**Fix:**
```bash
# SSH into server manually
ssh -i private_key deploy@server.com

# Check services
docker service ls

# View logs
docker service logs maryai_frontv2
```

---

## Common Issues & Solutions

### Issue: "Resource not accessible by integration"

**Cause:** GitHub token permissions insufficient

**Solution:**
1. Go to **Settings** > **Actions** > **General**
2. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

### Issue: "The workflow is not valid"

**Cause:** YAML syntax error

**Solution:**
```bash
# Validate YAML online at: https://yamllint.com/
# Or install locally:
npm install -g yamllint
yamllint .github/workflows/build-and-deploy.yml
```

### Issue: Build succeeds but deployment doesn't run

**Cause:** Job condition (`if:`) not matching

**Solution:**
```yaml
# Check the condition:
if: github.ref == 'refs/heads/master'  # ✅ Correct
if: github.ref == 'refs/heads/main'    # ❌ Wrong branch

# Check actual branch name:
# Go to Actions tab, look at job output
```

---

## Post-Migration

### Keep GitLab Configured (Optional)

If you want to keep GitLab as a backup:
1. Keep `.gitlab-ci.yml` file
2. It will run both (parallel CI/CD)
3. Can disable later when confident in GitHub

### Communicate with Team

- [ ] Update deployment docs (DEPLOYMENT.md ✅)
- [ ] Update environment setup docs (ENVIRONMENT_SETUP.md ✅)
- [ ] Tell team: Push triggers automatic deployment
- [ ] Tell team: Prod deployments need approval
- [ ] Show team how to check logs (Actions tab)

### Delete Old CI/CD

When confident, delete GitLab CI:
```bash
# Option 1: Keep in git history
git rm .gitlab-ci.yml
git commit -m "Remove GitLab CI in favor of GitHub Actions"

# Option 2: Just delete, can restore from history
rm .gitlab-ci.yml
```

---

## Reference

- **Workflow file**: `.github/workflows/build-and-deploy.yml`
- **Deployment guide**: `DEPLOYMENT.md`
- **Environment setup**: `ENVIRONMENT_SETUP.md`
- **GitHub Docs**: https://docs.github.com/en/actions
- **Docker Buildx**: https://docs.docker.com/build/architecture/

---

## Questions?

1. Check GitHub Actions logs: Click on failed workflow
2. Read the error messages (usually very helpful)
3. Reference the workflow file: `.github/workflows/build-and-deploy.yml`
4. See DEPLOYMENT.md for troubleshooting
