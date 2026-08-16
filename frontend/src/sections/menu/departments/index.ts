/**
 * Menu feature section
 * Exports all public components and utilities
 */

// Constants
export * from './constants';
// Hooks
export { useFormLogic } from './hooks/useFormLogic';

export { DepartmentListView } from './DepartmentListView';
// Components
export { CategoriesTable } from './components/CategoriesTable';

// Views
export { DepartmentEditView, type DepartmentEditViewProps } from './DepartmentEditView';

// Utils
export {
  buildImageSection,
  buildBasicInfoSection,
  buildColorAndStorageSection,
} from './utils/form-sections';

export {
  RenderCellColor,
  RenderCellStorageId,
  RenderCellDepartmentName,
} from './components/DepartmentTableCells';

// Types
export type * from './types';
