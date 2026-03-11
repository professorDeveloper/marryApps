import type { GridColDef } from '@mui/x-data-grid';
import type {
  OutgoingInvoice,
  OutgoingInvoiceFilters,
  OutgoingInvoiceBatchApiResponse,
} from 'src/types/outgoing-invoices';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
  Box,
  Table,
  Button,
  Dialog,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useOutgoingInvoicesAPI } from 'src/hooks/use-outgoing-invoices-api';

import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

const getTodayUtcBoundary = (endOfDay = false): string => {
  const now = dayjs();
  const date = new Date(
    Date.UTC(
      now.year(),
      now.month(),
      now.date(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0
    )
  );

  return date.toISOString().replace('.000Z', 'Z');
};

const initialFilters: OutgoingInvoiceFilters = {
  start_date: getTodayUtcBoundary(),
  end_date: getTodayUtcBoundary(true),
  storage_id: '',
  group_id: '',
  status: '',
  limit: 1000,
  offset: 0,
};

interface Ingredient {
  id: string;
  name: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const date = new Date(
    Date.UTC(
      value.year(),
      value.month(),
      value.date(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0
    )
  );

  return date.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value.slice(0, 10)) : null;

export function OutgoingInvoicesListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();

  const { getOutgoingInvoices, getOutgoingInvoiceById, deleteOutgoingInvoice } = useOutgoingInvoicesAPI();
  const { getStorages } = useStorageAPI();
  const { getDeductionGroups } = useDeductionsAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OutgoingInvoice[]>([]);
  const [total, setTotal] = useState(0);

  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState<OutgoingInvoiceFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<OutgoingInvoiceFilters>(initialFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<OutgoingInvoiceBatchApiResponse | null>(null);

  const openViewModal = useCallback(async (outgoingInvoiceId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const details = await getOutgoingInvoiceById(outgoingInvoiceId);
      setViewData(details);
    } finally {
      setViewLoading(false);
    }
  }, [getOutgoingInvoiceById]);

  const loadBaseData = useCallback(async () => {
    const [storagesData, groupsData, ingredientsData] = await Promise.all([
      getStorages(),
      getDeductionGroups(),
      fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list).catch(() => ({
        status: 'error',
        message: 'failed',
        data: [],
        code: 500,
      })),
    ]);

    setStoragesMap(
      (storagesData || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );

    setGroupsMap(
      (groupsData || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );

    setIngredientsMap(
      (ingredientsData.data || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );
  }, [getStorages, getDeductionGroups]);

  const loadOutgoingInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOutgoingInvoices(filters);
      setRows(response.data);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  }, [filters, getOutgoingInvoices]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadOutgoingInvoices();
  }, [loadOutgoingInvoices]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      offset: 0,
    }));
  }, [draftFilters]);

  const handleResetFilters = useCallback(() => {
    setDraftFilters(initialFilters);
  }, []);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'number',
        headerName: t('deductions.number', 'Number'),
        width: 90,
      },
      {
        field: 'date',
        headerName: t('deductions.date', 'Date'),
        width: 130,
        renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
      },
      {
        field: 'storage_id',
        headerName: t('deductions.storage', 'Storage'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => storagesMap[params.row.storage_id] || params.row.storage_id,
      },
      {
        field: 'group_id',
        headerName: t('outgoingInvoices.group', 'Group'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => groupsMap[params.row.group_id] || params.row.group_id,
      },
      {
        field: 'status',
        headerName: t('deductions.status', 'Status'),
        width: 120,
      },
      {
        field: 'total_amount',
        headerName: t('outgoingInvoices.totalAmount', 'Total amount'),
        width: 150,
        renderCell: (params) => Number(params.row.total_amount || 0).toLocaleString(),
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            key="edit"
            icon={<Iconify icon="solar:pen-bold" />}
            label={t('common.edit', 'Edit')}
            onClick={() => router.push(paths.warehouse.outgoingInvoices.edit(String(params.row.id)))}
          />,
          <CustomGridActionsCellItem
            key="delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label={t('common.delete', 'Delete')}
            style={{ color: '#FB6633' }}
            onClick={() => setDeleteId(params.row.id)}
          />,
        ],
      },
    ],
    [storagesMap, groupsMap, t, router]
  );

  const startDateValue = useMemo(() => toPickerDate(draftFilters.start_date), [draftFilters.start_date]);
  const endDateValue = useMemo(() => toPickerDate(draftFilters.end_date), [draftFilters.end_date]);

  return (
    <>
      <GenericTableView
        data={rows}
        columns={columns}
        loading={loading}
        onRowClick={(rowId) => openViewModal(String(rowId))}
        renderFilters={() => (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <DatePicker
              label={t('ingredientReports.startDate', 'Start date')}
              value={startDateValue}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  start_date: value ? toUtcDayBoundary(value) : '',
                }))
              }
              format="DD.MM.YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  inputProps: { readOnly: true },
                  sx: { cursor: 'pointer' },
                },
              }}
            />
            <DatePicker
              label={t('ingredientReports.endDate', 'End date')}
              value={endDateValue}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  end_date: value ? toUtcDayBoundary(value, true) : '',
                }))
              }
              format="DD.MM.YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  inputProps: { readOnly: true },
                  sx: { cursor: 'pointer' },
                },
              }}
            />
            <TextField
              select
              size="small"
              label={t('deductions.storage', 'Storage')}
              SelectProps={{ native: true }}
              value={draftFilters.storage_id || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  storage_id: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              {Object.entries(storagesMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('outgoingInvoices.group', 'Group')}
              SelectProps={{ native: true }}
              value={draftFilters.group_id || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  group_id: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              {Object.entries(groupsMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('deductions.status', 'Status')}
              SelectProps={{ native: true }}
              value={draftFilters.status || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              <option value="active">{t('deductions.active', 'Active')}</option>
              <option value="draft">{t('common.draft', 'Draft')}</option>
              <option value="cancelled">{t('deductions.canceled', 'Canceled')}</option>
            </TextField>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={handleResetFilters}
                sx={{ flex: 1 }}
              >
                {t('ingredientReports.reset', 'Reset')}
              </Button>
            </Box>
          </Box>
        )}
        breadcrumbs={{
          heading: t('overview.warehouse.expensesInvoices', 'Expenses invoices'),
          links: [
            { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
            { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
            { name: t('overview.warehouse.expensesInvoices', 'Expenses invoices') },
          ],
        }}
        addButton={{
          label: t('common.add', 'Add'),
          href: paths.warehouse.outgoingInvoices.new,
        }}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage', 'Are you sure?')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deleteId) return;
              await deleteOutgoingInvoice(deleteId);
              setDeleteId(null);
              await loadOutgoingInvoices();
            }}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <GenericViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        title={t('overview.warehouse.expensesInvoices', 'Expenses invoices')}
        data={viewData}
        loading={viewLoading}
        position="right"
        slideDirection="left"
        maxWidth="lg"
        renderContent={(payload: OutgoingInvoiceBatchApiResponse | null) => {
          const outgoingInvoice = payload?.data?.invoice;
          const items = payload?.data?.items || [];
          if (!outgoingInvoice) return null;

          const totalAmount = Number(outgoingInvoice.total_amount || 0);

          return (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('deductions.number', 'Number')}</TableCell>
                      <TableCell>{t('deductions.date', 'Date')}</TableCell>
                      <TableCell>{t('deductions.status', 'Status')}</TableCell>
                      <TableCell>{t('deductions.storage', 'Storage')}</TableCell>
                      <TableCell>{t('outgoingInvoices.group', 'Group')}</TableCell>
                      <TableCell>{t('deductions.description', 'Description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{outgoingInvoice.number}</TableCell>
                      <TableCell>{new Date(outgoingInvoice.date).toLocaleString()}</TableCell>
                      <TableCell>{outgoingInvoice.status}</TableCell>
                      <TableCell>{storagesMap[outgoingInvoice.storage_id] || outgoingInvoice.storage_id}</TableCell>
                      <TableCell>{groupsMap[outgoingInvoice.group_id] || outgoingInvoice.group_id}</TableCell>
                      <TableCell>{outgoingInvoice.description || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                      <TableCell>{t('calculation.quantity', 'Qty')}</TableCell>
                      <TableCell>{t('outgoingInvoices.pricePerUnit', 'Price / Unit')}</TableCell>
                      <TableCell>{t('outgoingInvoices.total', 'Total')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockBefore', 'Stock Before')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockAfter', 'Stock After')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id || `${item.ingredient_id}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{ingredientsMap[item.ingredient_id] || item.ingredient_id}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price_per_unit}</TableCell>
                        <TableCell>{item.total_amount}</TableCell>
                        <TableCell>{item.stock_before}</TableCell>
                        <TableCell>{item.stock_after}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="body2">
                  <strong>{t('outgoingInvoices.total', 'Total')}:</strong> {totalAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
