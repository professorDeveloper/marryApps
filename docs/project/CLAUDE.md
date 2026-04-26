# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Deployment & Environment Documentation

**New to this project?** Start here:
- **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** — TL;DR for developers (5 min read)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Full deployment guide with checklist
- **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** — Environment variables & secrets explained
- **[GITHUB_MIGRATION.md](GITHUB_MIGRATION.md)** — GitHub Actions setup (migrated from GitLab)

## Commands

```bash
# Development
yarn dev              # Start dev server on port 8081
yarn build            # Production build
yarn start            # Preview production build

# Linting & formatting
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix ESLint issues
yarn fm:fix           # Auto-format with Prettier
yarn fix:all          # Run lint:fix + fm:fix

# Type checking
yarn typecheck        # TypeScript type check (Bun)

# Clean reinstall
yarn re:dev           # Remove node_modules, reinstall, start dev
yarn re:build         # Remove node_modules, reinstall, build
```

Requires Node.js >=22.12.0 and Yarn 1.22.22.

## Architecture Overview

**Restaurant/Warehouse Management SaaS** — multi-tenant app supporting multiple brands and branches, with role-based access (superadmin, admin, branch manager, staff).

### Directory Structure

```
src/
├── auth/              # JWT auth context, guards, hooks
├── components/        # Shared/generic UI components
├── hooks/             # API hooks (useStorageAPI, useMealsAPI, etc.)
├── layouts/           # Dashboard, Auth, Simple layouts
├── pages/             # Top-level page components
├── routes/sections/   # React Router route config (lazy-loaded)
├── sections/          # Feature views (meals, warehouse, reports, etc.)
├── theme/             # MUI theme configuration
├── locales/langs/     # i18n translations (en, ru, uz-Cyrl, uz-Latn)
├── lib/               # Axios instance, image upload utilities
├── types/             # Shared TypeScript types
└── actions/           # API action handlers
```

### Routing

React Router v7, configured in `src/routes/sections/`. Routes use `React.lazy()` for code splitting. Main route groups:
- `/auth/jwt/*` — authentication pages
- `/dashboard/*` — all authenticated feature pages

Access control via `AuthGuard`, `GuestGuard`, and `RoleBasedGuard` wrappers.

### State Management

Three global React Contexts:
1. **AuthContext** (`src/auth/context/jwt/`) — JWT tokens in localStorage/sessionStorage, user info (id, username, role, branch, brand)
2. **SettingsContext** — theme mode, direction (LTR/RTL), sidebar state
3. **BranchContext** (`src/components/contexts/branch-context.tsx`) — selected branch, persisted to localStorage; changing it invalidates SWR cache globally

### API Layer

- **Axios** instance in `src/lib/axios.ts` with request interceptors that inject:
  - `Authorization: Bearer <token>`
  - `X-Brand-Id` — brand identifier
  - `X-Branch-ID` — branch identifier (for superadmin: uses `selectedBranchId` from BranchContext)
  - `limit=20, offset=0` pagination defaults on GET requests
- **SWR** for data fetching/caching; cache is keyed by URL so branch changes trigger refetch
- **API Hooks pattern**: each domain has a hook (e.g. `useMealsAPI()`) that returns typed CRUD functions wrapping `fetcher/poster/putter/deleter` from axios lib
- Standard response shape: `BackendResponse<T> = { status, message, data, code }`

### Multi-language Support

i18next with four locales: `en`, `ru`, `uz-Cyrl`, `uz-Latn`. Translation files are in `src/locales/langs/<locale>/`. When adding UI text, always add keys to all four locale files.

### Environment

- Dev/staging backend: `https://back.staging.maryai.yurtal.tech/`
- Production backend: `https://back.maryai.yurtal.tech`
- Environment variables use `VITE_` prefix (Vite convention)
- Three env files: `.env`, `.env.staging`, `.env.prod`

### Forms

React Hook Form + Yup or Zod for validation. Generic form patterns are encapsulated in `src/components/generic-edit-view/GenericEditView.tsx`.

### Feature Section Structure

When creating a new feature section (e.g., invoice, warehouse, meals), organize all related files within that feature's directory. Each feature should be self-contained with its own components, hooks, constants, types, and utilities.

Example structure for a feature section:

```
src/sections/[feature-name]/
components/
    AddedItemRow.tsx
    AddedItemsPanel.tsx
    AvailableItemRow.tsx
    AvailableItemsPanel.tsx
    FormLineItemsSection.tsx
    FormView.tsx
    MetaFields.tsx
    SummaryPanel.tsx
constants.ts
hooks/
    useItems.ts
    useTransferedItems.ts
index.ts
types.ts
utils/
    formatPrice.ts
```

**Key principles:**
- All feature-specific files stay within the feature directory
- Only truly shared/common components go in `src/components/`
- Each feature manages its own state, types, and utilities
- This keeps features modular and independent

### UI

Material-UI v7 throughout. MUI X DataGrid v8 for tables. Custom theme in `src/theme/`. Icons via `@iconify/react` and `lucide-react`. Toasts via `sonner`.
