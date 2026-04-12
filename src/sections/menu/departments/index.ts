/**
 * Menu feature section
 * Exports all public components and utilities
 */

// Views
export { DepartmentEditView, type DepartmentEditViewProps } from './DepartmentEditView';
export { DepartmentListView } from './DepartmentListView';

// Components
export { CategoriesTable } from './components/CategoriesTable';
export {
  RenderCellColor,
  RenderCellDepartmentName,
  RenderCellStorageId,
} from './components/DepartmentTableCells';

// Hooks
export { useFormLogic } from './hooks/useFormLogic';

// Utils
export {
  buildImageSection,
  buildBasicInfoSection,
  buildColorAndStorageSection,
} from './utils/form-sections';

// Constants
export * from './constants';

// Types
export type * from './types';
