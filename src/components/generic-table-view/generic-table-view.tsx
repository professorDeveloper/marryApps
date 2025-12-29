// src/components/generic-table-view/generic-table-view.tsx
import type {
  GridColDef,
  GridRowSelectionModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';

import i18next from 'i18next';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { DataGrid, gridClasses } from '@mui/x-data-grid';

import { RouterLink } from 'src/routes/components';

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

  // Filter options
  filterOptions?: {
    [key: string]: FilterOption[];
  };

  // Delete handlers
  onDeleteRow?: (id: string) => void;
  onDeleteRows?: (ids: string[]) => void;

  // Filter state
  initialFilters?: Record<string, any>;

  // Hidden columns
  hideColumns?: Record<string, boolean>;
  hideColumnsTogglable?: string[];

  // Custom toolbar
  renderToolbar?: (props: any) => React.ReactNode;

  // Identifikator field nomi (default: 'id')
  idField?: string;
}

export function GenericTableView<T extends Record<string, any>>({
  data,
  loading,
  columns,
  breadcrumbs,
  addButton,
  filterOptions = {},
  onDeleteRow,
  onDeleteRows,
  initialFilters = {},
  hideColumns = {},
  hideColumnsTogglable = [],
  renderToolbar,
  idField = 'id',
}: GenericTableConfig<T>) {
  const confirmDialog = useBoolean();
  const toolbarOptions = useToolbarSettings();

  const [tableData, setTableData] = useState<T[]>(data);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });

  const filters = useSetState(initialFilters);

  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(hideColumns);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const canReset = useMemo(
    () => Object.values(filters.state).some((value) => Array.isArray(value) && value.length > 0),
    [filters.state]
  );

  const dataFiltered = useMemo(() => {
    let filtered = tableData;

    Object.entries(filters.state).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter((item) => value.includes(item[key]));
      }
    });

    return filtered;
  }, [tableData, filters.state]);

  const handleDeleteRow = useCallback(
    (id: string) => {
      if (onDeleteRow) {
        onDeleteRow(id);
      }
      setTableData((prev) => prev.filter((row) => row[idField] !== id));
      toast.success("O'chirildi!");
    },
    [onDeleteRow, idField]
  );

  const handleDeleteRows = useCallback(() => {
    const idsArray = Array.from(selectedRows.ids);
    if (onDeleteRows) {
      onDeleteRows(idsArray as string[]);
    }
    setTableData((prev) => prev.filter((row) => !selectedRows.ids.has(row[idField])));
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

  return (
    <>
      <DashboardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading={breadcrumbs.heading}
          links={breadcrumbs.links}
          action={
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
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card
          sx={{
            minHeight: 640,
            flexGrow: { md: 1 },
            display: { md: 'flex' },
            height: { xs: 800, md: '1px' },
            flexDirection: { md: 'column' },
          }}
        >
          <DataGrid
            // build localeText at render time so translations reflect current i18next language
            localeText={{
              filterPanelColumns: String(i18next.t('toolbar.columns', { ns: 'menu' })),
              filterPanelOperator: String(i18next.t('toolbar.operator', { ns: 'menu' })),
              filterPanelInputLabel: String(i18next.t('toolbar.value', { ns: 'menu' })),
            }}
            {...toolbarOptions.settings}
            checkboxSelection
            disableRowSelectionOnClick
            rows={dataFiltered}
            columns={columns}
            loading={loading}
            getRowHeight={() => 'auto'}
            getRowId={(row) => row[idField]}
            pageSizeOptions={[5, 10, 20, { value: -1, label: 'Hammasi' }]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            onRowSelectionModelChange={(newSelectionModel) => setSelectedRows(newSelectionModel)}
            slots={{
              noRowsOverlay: () => <EmptyContent />,
              noResultsOverlay: () => <EmptyContent title="Natija topilmadi" />,
              toolbar: renderToolbar || (() => (
                <GenericTableToolbar
                  filters={filters}
                  canReset={canReset}
                  filteredResults={dataFiltered.length}
                  selectedRowCount={selectedRows.ids.size}
                  onOpenConfirmDeleteRows={confirmDialog.onTrue}
                  filterOptions={filterOptions}
                  settings={toolbarOptions.settings}
                  onChangeSettings={toolbarOptions.onChangeSettings}
                />
              )),
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
              [`& .${gridClasses.cell}`]: {
                display: 'flex',
                alignItems: 'center',
              },
            }}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}