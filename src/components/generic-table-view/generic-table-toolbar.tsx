// src/components/generic-table-view/generic-table-toolbar.tsx
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { CustomToolbarSettingsButtonProps } from 'src/components/custom-data-grid';

import Button from '@mui/material/Button';
import { Toolbar } from '@mui/x-data-grid';

import { Iconify } from 'src/components/iconify';
import {
  ToolbarContainer,
  ToolbarLeftPanel,
  ToolbarRightPanel,
  CustomToolbarQuickFilter,
  CustomToolbarExportButton,
  CustomToolbarFilterButton,
} from 'src/components/custom-data-grid';

import { GenericFiltersResult, type GenericTableFilters } from './generic-filters-result';

// ----------------------------------------------------------------------

interface FilterOption {
  value: string;
  label: string;
}

interface GenericTableToolbarProps<T extends GenericTableFilters = any>
  extends CustomToolbarSettingsButtonProps {
  canReset: boolean;
  filteredResults: number;
  selectedRowCount: number;
  filters: UseSetStateReturn<T>;
  filterOptions: {
    [key: string]: FilterOption[];
  };
  filterKeys?: (keyof T)[];
  onOpenConfirmDeleteRows: () => void;
  onRenderFiltersResult?: (
    filters: T,
    resetFilters: () => void
  ) => React.ReactNode;
}

export function GenericTableToolbar<T extends GenericTableFilters = any>({
  filters,
  canReset,
  filteredResults,
  selectedRowCount,
  onOpenConfirmDeleteRows,
  filterOptions,
  filterKeys,
  onRenderFiltersResult,
  settings,
  onChangeSettings,
}: GenericTableToolbarProps<T>) {
  const { state: currentFilters, resetState: resetFilters } = filters;

  const renderLeftPanel = () => (
    <CustomToolbarQuickFilter
      sx={{ width: 280, maxWidth: { md: 280 } }}
      slotProps={{ textField: { size: 'small' } }}
    />
  );

  const renderRightPanel = () => (
    <>
      {!!selectedRowCount && (
        <Button
          size="small"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={onOpenConfirmDeleteRows}
        >
          O&apos;chirish ({selectedRowCount})
        </Button>
      )}

      <CustomToolbarFilterButton />
      <CustomToolbarExportButton />
    </>
  );

  return (
    <>
      <Toolbar>
        <ToolbarContainer>
          <ToolbarLeftPanel>{renderLeftPanel()}</ToolbarLeftPanel>
          <ToolbarRightPanel>{renderRightPanel()}</ToolbarRightPanel>
        </ToolbarContainer>
      </Toolbar>

      {canReset && (
        onRenderFiltersResult ? (
          onRenderFiltersResult(currentFilters, resetFilters)
        ) : filterKeys && filterKeys.length > 0 ? (
          <GenericFiltersResult<T>
            filters={filters}
            totalResults={filteredResults}
            sx={{ p: 2.5, pt: 0 }}
            filterKeys={filterKeys}
          />
        ) : null
      )}
    </>
  );
}