import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { IProductTableFilters } from 'src/types/product';
import type { CustomToolbarSettingsButtonProps } from 'src/components/custom-data-grid';

import { useState, useCallback } from 'react';

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

import { ProductTableFiltersResult } from './product-table-filters-result';


// ----------------------------------------------------------------------

type FilterOption = {
  value: string;
  label: string;
};

type Props = CustomToolbarSettingsButtonProps & {
  canReset: boolean;
  filteredResults: number;
  selectedRowCount: number;
  filters: UseSetStateReturn<IProductTableFilters>;
  options: {
    stocks: FilterOption[];
    publishs: FilterOption[];
  };
  onOpenConfirmDeleteRows: () => void;
};

export function ProductTableToolbar({
  options,
  filters,
  canReset,
  filteredResults,
  selectedRowCount,
  onOpenConfirmDeleteRows,
  /********/
  settings,
  onChangeSettings,
}: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const [stock, setStock] = useState<string[]>(currentFilters.stock || []);
  const [publish, setPublish] = useState<string[]>(currentFilters.publish || []);

  const handleSelect = useCallback(
    (setter: (value: string[]) => void) => (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      const parsedValue = typeof value === 'string' ? value.split(',') : value;

      setter(parsedValue);
    },
    []
  );

  const renderLeftPanel = () => (
    <CustomToolbarQuickFilter />
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
          Delete ({selectedRowCount})
        </Button>
      )}

      {/* <CustomToolbarColumnsButton /> */}
      <CustomToolbarFilterButton />
      <CustomToolbarExportButton />
      {/* <CustomToolbarSettingsButton settings={settings} onChangeSettings={onChangeSettings} /> */}
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
        <ProductTableFiltersResult
          filters={filters}
          totalResults={filteredResults}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}
    </>
  );
}
