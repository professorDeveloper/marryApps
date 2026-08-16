import type { ColumnDef } from './types';

export const LIST_MAX_HEIGHT = 'calc(100vh - 200px)';
export const ADDED_LIST_MAX_HEIGHT = 'calc(100vh - 490px)';

export const ADDED_ROW_ESTIMATE_PX = 50;
export const AVAILABLE_ROW_ESTIMATE_PX = 52;

export const LARGE_BATCH = 50;

/**
 * Build the CSS grid-template-columns string for the added-items panel.
 *
 * Layout: `40px  minmax(120px,1fr)  [dynamic columns…]  48px`
 *          #      Product name       user-defined cols   delete btn
 */
export const buildGridTemplate = (columns: ColumnDef[]): string => {
    const colWidths = columns.map((c) => c.width).join(' ');
    return `40px minmax(120px,1fr) ${colWidths} 48px`;
};
