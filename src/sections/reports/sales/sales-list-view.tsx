import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';
import type { SalesReport, SalesReportFilters } from './types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { useTimeFilter } from 'src/hooks/use-time-filter';

import {
  Box,
  Chip,
  Button,
  MenuItem,
  TextField,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';
import { DashboardContent } from 'src/layouts/dashboard';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/common/data-table';
import { RouterLink } from 'src/routes/components';


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

const getTomorrowUtcBoundary = (endOfDay = false): string => {
  const now = dayjs().add(1, 'day');
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

const initialFilters: SalesReportFilters = {
  date_from: getTodayUtcBoundary(),
  date_to: getTomorrowUtcBoundary(true),
  status: '',
  author: '',
  q: '',
  limit: 20,
  offset: 0,
};

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

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

// ----------------------------------------------------------------------
// Mock data (in real implementation, this would come from API)
// ----------------------------------------------------------------------

const mockSalesData: SalesReport[] = [
  {
    id: '1',
    title: 'Daily Sales Report',
    author: 'John Doe',
    authorAvatar: '/assets/avatar-1.jpg',
    coverUrl: '/assets/cover-1.jpg',
    createdAt: '2024-01-15T10:30:00Z',
    summary: 'Summary of daily sales performance including revenue and transaction counts',
    status: 'completed',
    totalAmount: 15000,
  },
  {
    id: '2',
    title: 'Weekly Sales Analysis',
    author: 'Jane Smith',
    authorAvatar: '/assets/avatar-2.jpg',
    coverUrl: '/assets/cover-2.jpg',
    createdAt: '2024-01-14T15:45:00Z',
    summary: 'Comprehensive weekly sales analysis with trends and forecasts',
    status: 'pending',
    totalAmount: 85000,
  },
];

const mockAuthors = [
  { id: 'john-doe', name: 'John Doe' },
  { id: 'jane-smith', name: 'Jane Smith' },
  { id: 'bob-wilson', name: 'Bob Wilson' },
];

export function SalesListView() {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable');
  
  // Get global rows per page
  const { rowsPerPage: globalRowsPerPage } = usePaginationRows();
  
  const [salesData, setSalesData] = useState<SalesReport[]>(mockSalesData);
  const [authors] = useState(mockAuthors);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<SalesReportFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<SalesReportFilters>(initialFilters);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: globalRowsPerPage }));
  }, [globalRowsPerPage]);
  const { startDate, endDate, activePeriod: activeRange, setDates, applyRange, reset: resetTimeFilter } = useTimeFilter();
  const lastDataKeyRef = useRef('');

  const isAuthorsEmpty = authors.length === 0;

  // Apply date range changes
  useEffect(() => {
    setDraftFilters((prev) => ({
      ...prev,
      date_from: startDate ? toUtcDayBoundary(startDate) : '',
      date_to: endDate ? toUtcDayBoundary(endDate, true) : '',
      offset: 0,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [startDate, endDate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      const key = JSON.stringify({
        date_from: filters.date_from,
        date_to: filters.date_to,
        status: filters.status,
        author: filters.author,
        q: filters.q,
        limit: filters.limit,
        offset: filters.offset,
      });

      if (lastDataKeyRef.current === key) return;
      lastDataKeyRef.current = key;

      try {
        // In real implementation, this would be an API call
        // const response = await getSalesReports(filters);
        // setRowCount(response.total || 0);
        // setSalesData(response.items || []);
        
        // For now, use mock data
        setRowCount(mockSalesData.length);
        setSalesData(mockSalesData);
      } finally {
        // Loading state handled by DataTable component
      }
    };

    fetchData();
  }, [filters]);

  useEffect(() => {
    setDraftFilters((prev) => ({
      ...prev,
      q: debouncedSearchQuery,
    }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      offset: 0,
      limit: paginationModel.pageSize,
    }));
  }, [draftFilters, paginationModel.pageSize]);

  const handlePaginationPageChange = (page: number) => {
    setPaginationModel((prev) => ({ ...prev, page }));
    setFilters((prev) => ({
      ...prev,
      offset: page * paginationModel.pageSize,
    }));
    lastDataKeyRef.current = '';
  };

  const handlePaginationRowsPerPageChange = (pageSize: number) => {
    setPaginationModel({ page: 0, pageSize });
    setFilters((prev) => ({
      ...prev,
      limit: pageSize,
      offset: 0,
    }));
    lastDataKeyRef.current = '';
  };

  const handleViewClick = useCallback((sale: SalesReport) => {
    // In real implementation, navigate to details page or open modal
    console.log('View sales report:', sale);
  }, []);

  const handleReset = useCallback(() => {
    setDraftFilters(initialFilters);
    resetTimeFilter();
    setSearchQuery('');
  }, [resetTimeFilter]);

  const columns = useMemo(
    (): DataTableColumn<SalesReport>[] => [
      {
        key: 'title',
        label: t('overview.reports.sales'),
        sortable: true,
        width: '2fr',
        align: 'left',
        getValue: (row: SalesReport) => row?.title ?? '',
        renderCell: ({ row }: { row: SalesReport }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {row.coverUrl && (
              <Box
                component="img"
                src={row.coverUrl}
                alt={row.title}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1,
                  objectFit: 'cover',
                }}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.4 }}>
                {row.title}
              </Box>
            </Box>
          </Box>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        sortable: true,
        width: '1.5fr',
        align: 'left',
        getValue: (row: SalesReport) => row?.author ?? '',
        renderCell: ({ row }: { row: SalesReport }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {row.authorAvatar && (
              <Box
                component="img"
                src={row.authorAvatar}
                alt={row.author}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            )}
            <Box sx={{ fontWeight: 500 }}>{row.author}</Box>
          </Box>
        ),
      },
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        width: '1fr',
        align: 'left',
        getValue: (row: SalesReport) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
      },
      {
        key: 'summary',
        label: 'Summary',
        sortable: false,
        width: '2fr',
        align: 'left',
        getValue: (row: SalesReport) => row?.summary ?? '',
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: '1fr',
        align: 'left',
        getValue: (row: SalesReport) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '');
          return (
            <Chip
              size="small"
              label={formatStatusLabel(status)}
              color={getStatusColor(status)}
              sx={{ textTransform: 'capitalize' }}
            />
          );
        },
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center',
        renderCell: () => null,
      },
    ],
    [t, handleViewClick]
  );

  const startDateValue = useMemo(() => toPickerDate(draftFilters.date_from), [draftFilters.date_from]);
  const endDateValue = useMemo(() => toPickerDate(draftFilters.date_to), [draftFilters.date_to]);

  const defaultConfig: DataTableDefaultConfig = {
    order: ['title', 'author', 'createdAt', 'summary', 'status', 'actions'],
    visibility: {
      title: true,
      author: true,
      createdAt: true,
      summary: true,
      status: true,
      actions: true,
    },
    widths: {
      title: '2fr',
      author: '1.5fr',
      createdAt: '1fr',
      summary: '2fr',
      status: '1fr',
      actions: '0.7fr',
    },
  };

  return (
    <DashboardContent
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh',
        '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
        '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
      }}
    >
   

   

      <DataTable<SalesReport>
        persistKey="sales-reports-list"
        data={salesData}
        getRowId={(row: SalesReport) => String(row?.id)}
        columns={columns}
        search={{ value: searchQuery, onChange: (value: string) => { setSearchQuery(value); setPaginationModel((prev) => ({ ...prev, page: 0 })); } }}
        toolbarActions={
          <TextField
            select size="small" label="Status"
            value={draftFilters.status || ''}
            onChange={(e) => { setDraftFilters((prev) => ({ ...prev, status: e.target.value })); setPaginationModel((prev) => ({ ...prev, page: 0 })); }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {['pending', 'completed', 'cancelled'].map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
        }
        pagination={{
          page: paginationModel.page,
          rowsPerPage: paginationModel.pageSize,
          totalCount: rowCount,
          rowsPerPageOptions: [10, 20, 50, 100],
          onPageChange: handlePaginationPageChange,
          onRowsPerPageChange: handlePaginationRowsPerPageChange,
        }}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        periodFilter={{
          startDate: startDate ? startDate.toDate() : null,
          endDate: endDate ? endDate.toDate() : null,
          onStartDateChange: (date: Date | null) => { setDates(date ? dayjs(date) : null, endDate, 'day'); },
          onEndDateChange: (date: Date | null) => { setDates(startDate, date ? dayjs(date) : null, 'day'); },
          activePeriod: activeRange,
          onPeriodChange: applyRange,
        }}
        onRowClick={(row: SalesReport) => console.log('View sales report:', row)}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.menu.reports.sales.new}
            size="small"
          >
            {t('add')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
