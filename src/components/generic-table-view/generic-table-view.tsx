// src/components/generic-table-view/generic-table-view.tsx
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRowSelectionModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';

import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { DataGrid, GridFooter, gridClasses } from '@mui/x-data-grid';

import { RouterLink } from 'src/routes/components';

import { useDataGridLocale } from 'src/hooks/use-data-grid-locale';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useToolbarSettings } from 'src/components/custom-data-grid';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GenericTableToolbar } from './generic-table-toolbar';

// ----------------------------------------------------------------------

interface BreadcrumbLink {
  name: string;
  href?: string;
  icon?: React.ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
}

export interface GenericTableConfig<T = any> {
  // Ma'lumotlar
  data: T[];
  loading: boolean;

  // Columns
  columns: GridColDef[];

  // Breadcrumb
  breadcrumbs: {
    heading: string;
    links: BreadcrumbLink[];
  };

  // Add button
  addButton?: {
    label: string;
    href: string;
  };
  // Custom header actions
  headerActions?: React.ReactNode;

  // Filter options
  filterOptions?: {
    [key: string]: FilterOption[];
  };

  // Delete handlers
  onDeleteRow?: (id: string) => void;
  onDeleteRows?: (ids: string[]) => void;

  // Row click handler
  onRowClick?: (id: string) => void;

  // Filter state
  initialFilters?: Record<string, any>;

  // Hidden columns
  hideColumns?: Record<string, boolean>;
  hideColumnsTogglable?: string[];

  // Custom toolbar
  renderToolbar?: (props: any) => React.ReactNode;

  // Identifikator field nomi (default: 'id')
  idField?: string;

  // Hide filters (only search will remain)
  hideFilters?: boolean;

  // Hide checkboxes (will show row numbers instead)
  hideCheckboxes?: boolean;

  // Custom filters render function
  renderFilters?: () => React.ReactNode;

  // Optional footer content rendered inside the table card
  renderFooter?: () => React.ReactNode;

  // Optional quick filter callback for server-side search
  onQuickFilterChange?: (value: string) => void;

  // Server-side pagination (optional)
  paginationMode?: 'client' | 'server';
  rowCount?: number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
}

export function GenericTableView<T extends Record<string, any>>({
  data,
  loading,
  columns,
  breadcrumbs,
  addButton,
  headerActions,
  filterOptions = {},
  onDeleteRow,
  onDeleteRows,
  onRowClick,
  initialFilters = {},
  hideColumns = {},
  hideColumnsTogglable = [],
  renderToolbar,
  idField = 'id',
  hideFilters = false,
  hideCheckboxes = false,
  renderFilters,
  renderFooter,
  onQuickFilterChange,
  paginationMode,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions,
}: GenericTableConfig<T>) {
  const confirmDialog = useBoolean();
  const toolbarOptions = useToolbarSettings();
  const dataGridLocale = useDataGridLocale();

  const [tableData, setTableData] = useState<T[]>(data);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });

  const filters = useSetState(initialFilters);

  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(hideColumns);
  const quickFilterValueRef = useRef('');
  const rowCountRef = useRef(typeof rowCount === 'number' ? rowCount : 0);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const normalizedTableData = useMemo(() => {
    if (!Array.isArray(tableData)) {
      return [] as T[];
    }

    return tableData
      .filter((row): row is T => Boolean(row) && typeof row === 'object')
      .map((row, index) => {
        if (row[idField] == null) {
          return { ...row, [idField]: `__fallback_row_${index}` } as T;
        }
        return row;
      });
  }, [tableData, idField]);

  const canReset = useMemo(
    () => Object.values(filters.state).some((value) => Array.isArray(value) && value.length > 0),
    [filters.state]
  );

  const dataFiltered = useMemo(() => {
    let filtered = normalizedTableData;

    Object.entries(filters.state).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter((item) => value.includes(item[key]));
      }
    });

    return filtered;
  }, [normalizedTableData, filters.state]);

  // Add row number column when checkboxes are hidden
  const columnsWithRowNumber = useMemo(() => {
    if (hideCheckboxes) {
      const rowNumberColumn: GridColDef = {
        field: '__rowNumber__',
        headerName: 'N',
        width: 60,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const rowIndex = dataFiltered.findIndex(
            (row) => row[idField] === params.row[idField]
          );
          return rowIndex + 1;
        },
      };
      return [rowNumberColumn, ...columns];
    }
    return columns;
  }, [hideCheckboxes, columns, dataFiltered, idField]);

  const handleDeleteRow = useCallback(
    (id: string) => {
      if (onDeleteRow) {
        onDeleteRow(id);
      }
      setTableData((prev) => prev.filter((row) => row && row[idField] !== id));
      toast.success("O'chirildi!");
    },
    [onDeleteRow, idField]
  );

  const handleDeleteRows = useCallback(() => {
    const idsArray = Array.from(selectedRows.ids);
    if (onDeleteRows) {
      onDeleteRows(idsArray as string[]);
    }
    setTableData((prev) => prev.filter((row) => row && !selectedRows.ids.has(row[idField])));
    toast.success("O'chirildi!");
  }, [selectedRows.ids, onDeleteRows, idField]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="O'chirish"
      content={
        <>
          Haqiqatan ham <strong>{selectedRows.ids.size}</strong> ta elementni o&apos;chirmoqchimisiz?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          O&apos;chirish
        </Button>
      }
    />
  );

  const defaultToolbarPropsRef = useRef({
    filters,
    canReset,
    filteredResults: dataFiltered.length,
    selectedRowCount: selectedRows.ids.size,
    onOpenConfirmDeleteRows: confirmDialog.onTrue,
    filterOptions,
    settings: toolbarOptions.settings,
    onChangeSettings: toolbarOptions.onChangeSettings,
    hideFilters,
  });

  defaultToolbarPropsRef.current = {
    filters,
    canReset,
    filteredResults: dataFiltered.length,
    selectedRowCount: selectedRows.ids.size,
    onOpenConfirmDeleteRows: confirmDialog.onTrue,
    filterOptions,
    settings: toolbarOptions.settings,
    onChangeSettings: toolbarOptions.onChangeSettings,
    hideFilters,
  };

  const DefaultToolbarSlot = useCallback(() => {
    const current = defaultToolbarPropsRef.current;

    return (
      <GenericTableToolbar
        filters={current.filters}
        canReset={current.canReset}
        filteredResults={current.filteredResults}
        selectedRowCount={current.selectedRowCount}
        onOpenConfirmDeleteRows={current.onOpenConfirmDeleteRows}
        filterOptions={current.filterOptions}
        settings={current.settings}
        onChangeSettings={current.onChangeSettings}
        hideFilters={current.hideFilters}
      />
    );
  }, []);

  const ToolbarSlot = useMemo(
    () => renderToolbar || DefaultToolbarSlot,
    [renderToolbar, DefaultToolbarSlot]
  );

  const FooterSlot = useMemo(() => {
    if (!renderFooter) return undefined;

    return () => (
      <Box
        sx={{
          width: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1,
          borderTop: '1px solid var(--color-border)',
          overflow: 'hidden',
          '& .MuiDataGrid-footerContainer': {
            borderTop: 'none',
            minHeight: 'unset',
          },
          '& .MuiTablePagination-root': {
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>{renderFooter()}</Box>
        <GridFooter />
      </Box>
    );
  }, [renderFooter]);

  const useControlledPagination = Boolean(paginationModel && onPaginationModelChange);
  const effectiveRowCount = useMemo(() => {
    if (typeof rowCount === 'number' && (!loading || rowCount > 0)) {
      rowCountRef.current = rowCount;
    }

    return rowCountRef.current;
  }, [loading, rowCount]);

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      if (!onQuickFilterChange) return;

      const nextQuickFilter = (model.quickFilterValues || [])
        .map((value) => String(value))
        .join(' ')
        .trim();

      if (quickFilterValueRef.current !== nextQuickFilter) {
        quickFilterValueRef.current = nextQuickFilter;
        onQuickFilterChange(nextQuickFilter);
      }
    },
    [onQuickFilterChange]
  );

  const gridHeight = 'clamp(320px, 70vh, 800px)';

  return (
    <>
      <DashboardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          '--layout-dashboard-content-pt': { xs: '16px', md: '24px' },
          '--layout-dashboard-content-pb': { xs: '16px', md: '24px' },
        }}
      >
        <CustomBreadcrumbs
          heading={breadcrumbs.heading}
          links={breadcrumbs.links}
          action={
            headerActions || (
              addButton && (
                <Button
                  component={RouterLink}
                  href={addButton.href}
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  {addButton.label}
                </Button>
              )
            )
          }
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        {renderFilters && (
          <Card sx={{ p: 2, mb: 2.5 }}>
            {renderFilters()}
          </Card>
        )}

        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: renderFooter ? 'auto' : gridHeight,
            maxHeight: renderFooter ? gridHeight : undefined,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <DataGrid
            // use fully localized locale text from hook
            localeText={dataGridLocale}
            {...toolbarOptions.settings}
            checkboxSelection={!hideCheckboxes}
            disableRowSelectionOnClick
            rows={dataFiltered}
            columns={columnsWithRowNumber}
            loading={loading}
            getRowHeight={() => 'auto'}
            getRowId={(row) => row?.[idField]}
            pageSizeOptions={pageSizeOptions || [10, 20, 50, 100, 500]}
            paginationMode={paginationMode}
            rowCount={paginationMode === 'server' ? effectiveRowCount : undefined}
            paginationModel={useControlledPagination ? paginationModel : undefined}
            onPaginationModelChange={useControlledPagination ? onPaginationModelChange : undefined}
            initialState={
              useControlledPagination ? undefined : { pagination: { paginationModel: { pageSize: 20 } } }
            }
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            onFilterModelChange={handleFilterModelChange}
            onRowSelectionModelChange={(newSelectionModel) => setSelectedRows(newSelectionModel)}
            onRowClick={(params) => {
              if (onRowClick && !hideCheckboxes) {
                onRowClick(params.row[idField]);
              }
            }}
            slots={{
              noRowsOverlay: () => <EmptyContent title="Ishlab chiqish jarayonida" />,
              noResultsOverlay: () => <EmptyContent title="Natija topilmadi" />,
              toolbar: ToolbarSlot,
              footer: FooterSlot,
            }}
            slotProps={{
              columnsManagement: {
                getTogglableColumns: () =>
                  columns
                    .filter((col) => !hideColumnsTogglable.includes(col.field))
                    .map((col) => col.field),
              },
            }}
            sx={{
              flex: 1,
              minHeight: 0,
              border: 0,
              '& .MuiDataGrid-root': {
                border: 0,
              },
              [`& .${gridClasses.cell}`]: {
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none',
              },

              // --- PAGINATION KENGAYTIRISH STILLARI ---
              '& .MuiTablePagination-root': {
                overflow: 'hidden',
                // borderTop: '1px solid rgba(145, 158, 171, 0.24)', // Ajratib turish uchun chiziq
              },
              '& .MuiTablePagination-toolbar': {
                height: 64, // Toolbar balandligini oshirish
              },
              '& .MuiTablePagination-selectLabel': {
                fontSize: '14px', // Yozuvni kattalashtirish
                fontWeight: 600,
              },
              '& .MuiTablePagination-input': {
                // Select input (dropdown) stillari
                marginLeft: '8px',
                marginRight: '8px',
                border: '1px solid var(--color-border)', // Chegara
                borderRadius: 'var(--radius-sm)', // Yumaloq burchaklar
                height: '36px',
                minWidth: '100px', // Minimal kenglik (juda tor bo'lmasligi uchun)
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                padding: '0 8px',
              },
              '& .MuiTablePagination-select': {
                paddingLeft: '8px',
                paddingRight: '24px !important', // Icon uchun joy
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: '14px',
                fontWeight: 600,
              },
              '& .MuiTablePagination-actions': {
                marginRight: '8px',
              },
              // ------------------------------------------
            }}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
