import type { GridColDef, GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import type { ColumnInfo } from './column-manager-panel';
import type { TotalRule, ConfigurableListProps, ConfigurableListHandle } from './types';

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useImperativeHandle,
} from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Toolbar, DataGrid, GridFooter, gridClasses } from '@mui/x-data-grid';

import { RouterLink } from 'src/routes/components';

import { useDataGridLocale } from 'src/hooks/use-data-grid-locale';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  ToolbarContainer,
  ToolbarLeftPanel,
  ToolbarRightPanel,
  useToolbarSettings,
  CustomToolbarQuickFilter,
  CustomToolbarFilterButton,
  CustomToolbarExportButton,
  CustomToolbarColumnsButton,
} from 'src/components/custom-data-grid';

import { localStorageAdapter } from './persistence';
import { useColumnConfig } from './use-column-config';
import { ColumnManagerPanel } from './column-manager-panel';

// ---------------------------------------------------------------------------
// Row number column definition
// ---------------------------------------------------------------------------

function makeRowNumberColumn<R extends Record<string, any>>(
  idField: string,
  data: R[]
): GridColDef<R> {
  return {
    field: '__rowNumber__',
    headerName: '#',
    width: 60,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => {
      const idx = data.findIndex((row) => row[idField] === params.row[idField]);
      return idx + 1;
    },
  };
}

// ---------------------------------------------------------------------------
// Totals computation
// ---------------------------------------------------------------------------

function computeAggregate<R>(rule: TotalRule<R>, rows: R[]): number | string {
  if (rule.aggregation === 'custom' && rule.compute) {
    return rule.compute(rows);
  }

  const values = rows
    .map((r) => {
      const raw = (r as any)[rule.field];
      return typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    })
    .filter((v) => !Number.isNaN(v));

  if (values.length === 0) return 0;

  switch (rule.aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}

function defaultFormat(value: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Main component (uses forwardRef for imperative handle)
// ---------------------------------------------------------------------------

function ConfigurableListInner<R extends Record<string, any>>(
  props: ConfigurableListProps<R>,
  ref: React.Ref<ConfigurableListHandle>
) {
  const {
    persistKey,
    data,
    loading,
    idField = 'id',
    columns: rawColumns,
    paginationMode,
    rowCount,
    paginationModel,
    onPaginationModelChange,
    pageSizeOptions = [10, 20, 50, 100],
    enableSelection = false,
    batchActions = [],
    onSelectionChange,
    showRowNumbers = false,
    totalRules,
    onRowClick,
    onQuickFilterChange,
    persistenceAdapter,
    renderFilters,
    renderHeaderActions,
    breadcrumbs,
    addButton,
  } = props;

  const adapter = persistenceAdapter ?? localStorageAdapter;
  const dataGridLocale = useDataGridLocale();
  const toolbarOptions = useToolbarSettings();

  // ----- Column configuration -----
  const {
    orderedColumns,
    visibilityModel,
    columnStates,
    toggleColumn,
    moveColumn,
    resizeColumn,
    resetColumns,
    onVisibilityModelChange,
  } = useColumnConfig({ persistKey, columns: rawColumns, adapter });

  // Expose imperative handle
  useImperativeHandle(ref, () => ({ resetColumns }), [resetColumns]);

  // ----- Column info for manager panel (avoids GridColDef union issues) -----
  const columnInfos = useMemo<ColumnInfo[]>(
    () =>
      rawColumns.map((col) => ({
        field: col.field,
        headerName: col.headerName,
        clHideable: col.clHideable,
        reorderable: col.reorderable,
      })),
    [rawColumns]
  );

  // ----- Column manager panel -----
  const [managerOpen, setManagerOpen] = useState(false);

  // ----- Selection state -----
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedRows.ids) as string[]);
  }, [selectedRows, onSelectionChange]);

  // ----- Row number injection -----
  const columnsWithExtras = useMemo(() => {
    const cols: GridColDef<R>[] = [];
    if (showRowNumbers) {
      cols.push(makeRowNumberColumn<R>(idField, data));
    }
    cols.push(...(orderedColumns as GridColDef<R>[]));
    return cols;
  }, [showRowNumbers, orderedColumns, idField, data]);

  // ----- Stable row count for server pagination -----
  const rowCountRef = useRef(typeof rowCount === 'number' ? rowCount : 0);
  const effectiveRowCount = useMemo(() => {
    if (typeof rowCount === 'number' && (!loading || rowCount > 0)) {
      rowCountRef.current = rowCount;
    }
    return rowCountRef.current;
  }, [loading, rowCount]);

  const useControlledPagination = Boolean(paginationModel && onPaginationModelChange);

  // ----- Quick filter -----
  const quickFilterValueRef = useRef('');
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

  // ----- Batch action bar -----
  const selectedCount = selectedRows.ids.size;

  // ----- Toolbar slot (matches GenericTableView style) -----
  const selectedCountRef = useRef(0);
  selectedCountRef.current = selectedCount;

  const openManagerRef = useRef(() => setManagerOpen(true));
  const batchActionsRef = useRef(batchActions);
  batchActionsRef.current = batchActions;
  const selectedRowsRef = useRef(selectedRows);
  selectedRowsRef.current = selectedRows;

  const ToolbarSlot = useCallback(() => {
    const count = selectedCountRef.current;
    const actions = batchActionsRef.current;
    const selRows = selectedRowsRef.current;

    return (
      <Toolbar>
        <ToolbarContainer>
          <ToolbarLeftPanel>
            <CustomToolbarQuickFilter
              sx={{ width: 280, maxWidth: { md: 280 } }}
              slotProps={{ textField: { size: 'small' } }}
            />
          </ToolbarLeftPanel>
          <ToolbarRightPanel>
            {/* Batch delete / actions */}
            {count > 0 &&
              actions.map((action) => (
                <Button
                  key={action.label}
                  size="small"
                  color={action.color ?? 'error'}
                  startIcon={action.icon}
                  onClick={() => action.onClick(Array.from(selRows.ids) as string[])}
                >
                  {action.label} ({count})
                </Button>
              ))}

            <CustomToolbarColumnsButton />
            <CustomToolbarFilterButton />
            <CustomToolbarExportButton />

            {/* Column manager button */}
            <Tooltip title="Column settings">
              <IconButton size="small" onClick={openManagerRef.current}>
                <Iconify icon="solar:settings-bold-duotone" width={20} />
              </IconButton>
            </Tooltip>
          </ToolbarRightPanel>
        </ToolbarContainer>
      </Toolbar>
    );
  }, []);

  // ----- Footer slot with totals -----
  const FooterSlot = useMemo(() => {
    if (!totalRules || totalRules.length === 0) return undefined;

    const visibleFields = new Set(
      columnStates.filter((s) => s.visible).map((s) => s.field)
    );
    const columnsMap = new Map(rawColumns.map((c) => [c.field, c]));

    const totals = totalRules
      .filter((rule) => visibleFields.has(rule.field))
      .map((rule) => {
        const raw = computeAggregate(rule, data);
        const numericValue = typeof raw === 'number' ? raw : parseFloat(String(raw));
        const format = rule.format || defaultFormat;
        const label = rule.label || columnsMap.get(rule.field)?.headerName || rule.field;
        return {
          field: rule.field,
          label,
          display: Number.isNaN(numericValue) ? String(raw) : format(numericValue),
        };
      });

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
          '& .MuiDataGrid-footerContainer': { borderTop: 'none', minHeight: 'unset' },
          '& .MuiTablePagination-root': { overflow: 'hidden' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            minWidth: 0,
            overflow: 'auto',
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            component="span"
            sx={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            TOTAL
          </Box>

          {totals.map((t) => (
            <Box
              key={t.field}
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 0.5,
                whiteSpace: 'nowrap',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {t.label}:
              </Box>
              <Box component="span" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                {t.display}
              </Box>
            </Box>
          ))}
        </Box>

        <GridFooter />
      </Box>
    );
  }, [totalRules, data, columnStates, rawColumns]);

  // ----- Grid height -----
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
        {/* Breadcrumbs & header */}
        {breadcrumbs && (
          <CustomBreadcrumbs
            heading={breadcrumbs.heading}
            links={breadcrumbs.links}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {renderHeaderActions?.()}

                {addButton && (
                  <Button
                    component={RouterLink}
                    href={addButton.href}
                    variant="contained"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                  >
                    {addButton.label}
                  </Button>
                )}
              </Box>
            }
            sx={{ mb: { xs: 2, md: 3 } }}
          />
        )}

        {/* Custom filters (above the table card) */}
        {renderFilters && <Card sx={{ p: 2, mb: 2.5 }}>{renderFilters()}</Card>}

        {/* Data grid card */}
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            height: gridHeight,
            maxHeight: gridHeight,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <DataGrid
            localeText={dataGridLocale}
            {...toolbarOptions.settings}
            checkboxSelection={enableSelection}
            disableRowSelectionOnClick
            rows={data}
            columns={columnsWithExtras}
            loading={loading}
            getRowHeight={() => 'auto'}
            getRowId={(row) => row?.[idField]}
            pageSizeOptions={pageSizeOptions}
            paginationMode={paginationMode}
            rowCount={paginationMode === 'server' ? effectiveRowCount : undefined}
            paginationModel={useControlledPagination ? paginationModel : undefined}
            onPaginationModelChange={
              useControlledPagination ? onPaginationModelChange : undefined
            }
            initialState={
              useControlledPagination
                ? undefined
                : { pagination: { paginationModel: { pageSize: 20 } } }
            }
            columnVisibilityModel={visibilityModel}
            onColumnVisibilityModelChange={onVisibilityModelChange}
            onColumnWidthChange={(params) => {
              // Persist user resizing for configurable columns only
              if (!params?.colDef?.field) return;
              const field = String(params.colDef.field);
              if (field === '__rowNumber__') return;
              if (!rawColumns.some((c) => c.field === field)) return;
              resizeColumn(field, params.width);
            }}
            // Persist drag-and-drop column reorder (when supported by the grid version)
            onColumnOrderChange={(params) => {
              const p = params as unknown as { column?: { field?: string }; targetIndex?: number };
              const field = String(p?.column?.field ?? '');
              if (!field || field === '__rowNumber__') return;
              if (!rawColumns.some((c) => c.field === field)) return;

              // MUI provides `targetIndex` as the new position among visible columns.
              // Our persisted order is for raw columns; clamp and apply.
              const targetIndex = Number(p?.targetIndex);
              if (Number.isNaN(targetIndex)) return;

              moveColumn(field, targetIndex);
            }}
            onFilterModelChange={handleFilterModelChange}
            onRowSelectionModelChange={(model) => setSelectedRows(model)}
            onRowClick={(params) => {
              onRowClick?.(params.row[idField]);
            }}
            slots={{
              noRowsOverlay: () => <EmptyContent title="No data" />,
              noResultsOverlay: () => <EmptyContent title="No results found" />,
              toolbar: ToolbarSlot,
              footer: FooterSlot,
            }}
            slotProps={{
              columnsManagement: {
                getTogglableColumns: () =>
                  rawColumns
                    .filter((col) => col.clHideable !== false)
                    .map((col) => col.field),
              },
            }}
            sx={{
              flex: 1,
              minHeight: 0,
              border: 0,
              '& .MuiDataGrid-columnHeaders': {
                transition: 'all 0.25s ease',
              },
              [`& .${gridClasses.cell}`]: {
                display: 'flex',
                alignItems: 'center',
                transition: 'width 0.25s ease, padding 0.25s ease',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none',
              },
              // Pagination styling (matches existing project style)
              '& .MuiTablePagination-root': { overflow: 'hidden' },
              '& .MuiTablePagination-toolbar': { height: 64 },
              '& .MuiTablePagination-selectLabel': { fontSize: '14px', fontWeight: 600 },
              '& .MuiTablePagination-input': {
                marginLeft: '8px',
                marginRight: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                height: '36px',
                minWidth: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                padding: '0 8px',
              },
              '& .MuiTablePagination-select': {
                paddingLeft: '8px',
                paddingRight: '24px !important',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiTablePagination-displayedRows': { fontSize: '14px', fontWeight: 600 },
              '& .MuiTablePagination-actions': { marginRight: '8px' },
            }}
          />
        </Card>
      </DashboardContent>

      {/* Column manager drawer */}
      <ColumnManagerPanel
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        columns={columnInfos}
        columnStates={columnStates}
        onToggle={toggleColumn}
        onMove={moveColumn}
        onReset={resetColumns}
      />
    </>
  );
}

// Cast forwardRef to preserve generic type parameter
export const ConfigurableList = forwardRef(ConfigurableListInner) as <
  R extends Record<string, any>,
>(
  props: ConfigurableListProps<R> & { ref?: React.Ref<ConfigurableListHandle> }
) => React.ReactElement | null;
