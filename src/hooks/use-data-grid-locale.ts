import type { GridLocaleText } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to get fully localized MUI X DataGrid locale text
 * This ensures all filter operators are properly translated
 */
export function useDataGridLocale(): Partial<GridLocaleText> {
    const { t } = useTranslation('menu');

    return useMemo(
        () => ({
            // Toolbar
            toolbarDensity: t('toolbar.density'),
            toolbarDensityLabel: t('toolbar.densityLabel'),
            toolbarDensityCompact: t('toolbar.densityCompact'),
            toolbarDensityStandard: t('toolbar.densityStandard'),
            toolbarDensityComfortable: t('toolbar.densityComfortable'),
            toolbarColumns: t('toolbar.columns'),
            toolbarColumnsLabel: t('toolbar.columnsLabel'),
            toolbarFilters: t('toolbar.filters'),
            toolbarFiltersLabel: t('toolbar.filtersLabel'),
            toolbarQuickFilterLabel: t('toolbar.quickFilterLabel'),
            toolbarQuickFilterPlaceholder: t('toolbar.quickFilterPlaceholder'),

            // Filter panel
            filterPanelAddFilter: t('toolbar.filterPanelAddFilter'),
            filterPanelDeleteIconLabel: t('toolbar.filterPanelDeleteIconLabel'),
            filterPanelLinkOperator: t('toolbar.filterPanelLinkOperator'),
            filterPanelOperators: {
                equals: t('toolbar.operators.equals'),
                // notEquals: t('toolbar.operators.notEquals'),
                greaterThan: t('toolbar.operators.greaterThan'),
                lessThan: t('toolbar.operators.lessThan'),
                greaterThanOrEqual: t('toolbar.operators.greaterThanOrEqual'),
                lessThanOrEqual: t('toolbar.operators.lessThanOrEqual'),
                contains: t('toolbar.operators.contains'),
                startsWith: t('toolbar.operators.startsWith'),
                endsWith: t('toolbar.operators.endsWith'),
                isAnyOf: t('toolbar.operators.isAnyOf'),
                is: t('toolbar.operators.is'),
            },
            filterPanelColumns: t('toolbar.columns'),
            filterPanelInputLabel: t('toolbar.value'),
            filterPanelInputPlaceholder: t('toolbar.filterPanelInputPlaceholder'),
            filterOperatorContains: t('toolbar.operators.contains'),
            filterOperatorEquals: t('toolbar.operators.equals'),
            filterOperatorStartsWith: t('toolbar.operators.startsWith'),
            filterOperatorEndsWith: t('toolbar.operators.endsWith'),
            filterOperatorIs: t('toolbar.operators.is'),
            // filterOperatorNot: t('toolbar.operators.notEquals'),
            filterOperatorIsAnyOf: t('toolbar.operators.isAnyOf'),
            filterOperatorIsEmpty: t('toolbar.filterOperatorIsEmpty'),
            filterOperatorIsNotEmpty: t('toolbar.filterOperatorIsNotEmpty'),
            filterOperatorGreaterThan: t('toolbar.operators.greaterThan'),
            filterOperatorLessThan: t('toolbar.operators.lessThan'),
            filterOperatorGreaterThanOrEqual: t('toolbar.operators.greaterThanOrEqual'),
            filterOperatorLessThanOrEqual: t('toolbar.operators.lessThanOrEqual'),

            // Other
            columnsPanelTextFieldLabel: t('toolbar.columnsPanelTextFieldLabel'),
            columnsPanelTextFieldPlaceholder: t('toolbar.columnsPanelTextFieldPlaceholder'),
            columnsPanelDragIconLabel: t('toolbar.columnsPanelDragIconLabel'),
            columnsPanelShowAllButton: t('toolbar.columnsPanelShowAllButton'),
            columnsPanelHideAllButton: t('toolbar.columnsPanelHideAllButton'),
            noRowsLabel: t('toolbar.noRowsLabel'),
            noResultsOverlayLabel: t('toolbar.noResultsOverlayLabel'),
            footerRowSelected: (count) => `${count} ${t('toolbar.footerRowSelected')}`,
        }),
        [t]
    );
}
