# Menu Feature Module

Menu management feature for departments, categories, and related items.

## Quick Start

### Using the Components

```typescript
import {
  DepartmentEditView,
  DepartmentListView,
  CategoriesTable,
} from 'src/sections/menu';

// List view
<DepartmentListView />

// Create view
<DepartmentEditView isNew />

// Edit view
<DepartmentEditView />

// Nested categories
<CategoriesTable departmentId="123" />
```

## Feature Overview

### Department Management
- **List View**: Browse departments with search, filter, and pagination
- **Edit View**: Create and edit department details (name, color, storage, image)
- **Multi-language**: Support for English, Russian, and Uzbek
- **Delete**: Confirmation dialog before deleting
- **Categories**: View nested categories for each department

### Key Features
✅ Form validation
✅ Image upload
✅ Color picker
✅ Multi-language support
✅ Search with debouncing
✅ Pagination
✅ Async image loading
✅ Cache invalidation
✅ Toast notifications

## File Structure

```
src/sections/menu/
├── DepartmentEditView.tsx      - Create/edit form
├── DepartmentListView.tsx      - List with table
├── components/
│   ├── CategoriesTable.tsx     - Nested categories table
│   └── DepartmentTableCells.tsx - Table cell renderers
├── hooks/
│   └── useFormLogic.ts         - Form submission logic
├── utils/
│   └── form-sections.ts        - Form configuration
├── constants.ts                 - Shared constants
├── types.ts                     - Type definitions
└── index.ts                     - Public API
```

## Common Tasks

### Add a New Form Field

1. Update `utils/form-sections.ts`
   ```typescript
   {
     key: 'newField',
     label: 'departments.newField',
     type: 'text',
     required: false,
     defaultValue: '',
   }
   ```

2. Update `types.ts` if adding to DepartmentFormData

3. Update `hooks/useFormLogic.ts` if validation needed

4. Add translation keys to locale files

### Customize Table Columns

1. Update `constants.ts` for column config
2. Modify column definitions in `DepartmentListView.tsx`
3. Create new cell renderer if needed in `components/DepartmentTableCells.tsx`

### Add a New Component

1. Create file in `components/`
2. Export from `index.ts`
3. Use in appropriate view

### Extend Form Logic

1. Add logic to `hooks/useFormLogic.ts`
2. Export additional callbacks from hook
3. Use in `DepartmentEditView.tsx`

## API Integration

Uses API hooks from `src/actions/departments`:
- `useGetDepartments` - List departments with search
- `useGetDepartment` - Get single department
- `useCreateDepartment` - Create new
- `useUpdateDepartment` - Update existing
- `useDeleteDepartment` - Delete department
- `useGetCategoriesByDepartment` - Get nested categories
- `useGetStorages` - Get storage options

## State Management

### Global Context Used
- `BranchContext` - Selected branch for API requests
- `AuthContext` - User authentication and permissions

### Local State (Component Level)
- `DepartmentListView`: search, pagination, delete dialog, modal
- `DepartmentEditView`: form state (via GenericEditView)
- `CategoriesTable`: image URLs cache

## Internationalization

Supports 4 languages:
- `en` - English
- `ru` - Russian
- `uz-Cyrl` - Uzbek (Cyrillic)
- `uz-Latn` - Uzbek (Latin)

All UI strings use translation keys in format: `departments.fieldName`

## Performance Optimizations

- **Search Debouncing**: 400ms delay before API call
- **Image Lazy Loading**: Categories images load asynchronously
- **SWR Caching**: Automatic cache revalidation on mutations
- **Code Splitting**: Views lazy-loaded via React.lazy()
- **Memoization**: useMemo for expensive computations

## Testing

Since this is a structural refactor, existing tests should work with updated imports:

```typescript
// Old
import { DepartmentListView } from 'src/sections/products/departments-list-view';

// New
import { DepartmentListView } from 'src/sections/menu';
```

All component interfaces and behavior remain unchanged.

## Troubleshooting

### Import Errors
- Verify import paths use `src/sections/menu`
- Check that component names match exports (DepartmentEditView, DepartmentListView)

### Form Validation Issues
- Check translation keys exist in locale files
- Verify field validation rules in `useFormLogic.ts`

### Table Display Issues
- Verify column configuration in `constants.ts`
- Check cell renderer props in `DepartmentTableCells.tsx`

### API Errors
- Ensure API endpoints are correct in `src/actions/departments`
- Check branch and brand context are set
- Verify authentication token is valid

## Related Documentation

- [REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md) - What changed and why
- [STRUCTURE.md](./STRUCTURE.md) - Detailed architecture
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - Refactor verification

---

**Module Status**: ✅ Production Ready

Last updated: 2026-04-12
