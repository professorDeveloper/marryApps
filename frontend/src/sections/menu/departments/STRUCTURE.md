# Menu Feature Structure

## Directory Layout

```
src/sections/menu/
│
├── DepartmentEditView.tsx          (73 lines)  - Create/edit view component
├── DepartmentListView.tsx          (246 lines) - List view with table & deletion
│
├── components/
│   ├── CategoriesTable.tsx         (157 lines) - Nested categories table
│   └── DepartmentTableCells.tsx    (69 lines)  - Table cell renderers
│
├── hooks/
│   └── useFormLogic.ts             (117 lines) - Form submission & deletion logic
│
├── utils/
│   └── form-sections.ts            (73 lines)  - Form configuration builders
│
├── constants.ts                    (18 lines)  - Table & form constants
├── types.ts                        (15 lines)  - TypeScript interfaces
├── index.ts                        (20 lines)  - Public API exports
│
└── STRUCTURE.md                    - This file

Total: 886 lines (vs 739 lines in original dual-file structure)
Extra lines are comments, type definitions, and improved organization
```

## Key Design Decisions

### 1. **Separation of Concerns**
- **Views** (Edit, List) - Handle UI layout and state management
- **Components** - Reusable UI pieces (table cells, nested tables)
- **Hooks** - Business logic (form submission, deletion)
- **Utils** - Configuration builders and helpers
- **Types** - All TS interfaces in one place
- **Constants** - Table config and reusable values

### 2. **Data Flow Architecture**

```
DepartmentListView.tsx
├── Fetches: useGetDepartments (via API hook)
├── Updates: useDeleteDepartment
├── Components: RenderCell* (pure presentational)
└── Nested: CategoriesTable (self-contained)

DepartmentEditView.tsx
├── Fetches: useGetDepartment, useGetStorages (via API hooks)
├── Logic: useFormLogic (submit/delete)
├── Config: buildImageSection, buildBasicInfoSection, etc.
└── Renders: GenericEditView (form builder)
```

### 3. **Dependencies**

**Internal (within menu/):**
- DepartmentListView imports components, constants
- DepartmentEditView imports hooks, utils, constants
- index.ts exports everything for public use

**External (outside menu/):**
- API hooks (useGetDepartments, useGetDepartment, etc.)
- Material-UI components
- GenericEditView (form builder)
- DeductionUtilityDataTable (shared table component)
- i18next (translations)

## File Responsibilities

### Views
| File | Responsibility | Lines |
|------|-----------------|-------|
| DepartmentEditView.tsx | Form layout, section configuration, submission | 73 |
| DepartmentListView.tsx | List layout, table setup, delete dialog, search | 246 |

### Components
| File | Responsibility | Lines |
|------|-----------------|-------|
| CategoriesTable.tsx | Render nested categories table with image loading | 157 |
| DepartmentTableCells.tsx | Cell renderers (name, storage, color) | 69 |

### Logic & Config
| File | Responsibility | Lines |
|------|-----------------|-------|
| useFormLogic.ts | Form submission, deletion, cache sync | 117 |
| form-sections.ts | Form field/section builders | 73 |

### Supporting
| File | Responsibility | Lines |
|------|-----------------|-------|
| types.ts | TypeScript interfaces | 15 |
| constants.ts | Table config, colors, widths | 18 |
| index.ts | Public API exports | 20 |

## Import Patterns

### From Views
```typescript
// Using the feature
import { DepartmentEditView, DepartmentListView } from 'src/sections/menu';
```

### From Route Configuration
```typescript
// Route setup
import { DepartmentListView } from 'src/sections/menu';
import { DepartmentEditView } from 'src/sections/menu';
```

### Internal Imports (within menu/)
```typescript
// Components
import { CategoriesTable } from './components/CategoriesTable';

// Hooks
import { useFormLogic } from './hooks/useFormLogic';

// Utils
import { buildImageSection } from './utils/form-sections';

// Constants & Types
import { TABLE_COLUMN_ORDER } from './constants';
import type { DepartmentFormData } from './types';
```

## Extensibility

To add new features:

1. **New table column**: Update `constants.ts` → `DepartmentListView.tsx`
2. **New form field**: Update `form-sections.ts` → `DepartmentEditView.tsx`
3. **New department component**: Add to `components/` → export from `index.ts`
4. **New nested view**: Create similar to `CategoriesTable.tsx`
5. **New logic hook**: Create in `hooks/` → export from `index.ts`

## Testing Strategy

Since only structure changed, tests can be updated to use new imports:

```typescript
// Old
import { DepartmentListView } from 'src/sections/products/departments-list-view';

// New
import { DepartmentListView } from 'src/sections/menu';
```

All component props, exports, and behaviors remain identical.
