import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Button,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface SalesReport {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  coverUrl?: string;
  createdAt: string;
  summary: string;
  status?: 'pending' | 'completed' | 'cancelled';
  totalAmount?: number;
}

interface SalesReportFilters {
  date_from: string;
  date_to: string;
  status: string;
  author: string;
  q: string;
  limit: number;
  offset: number;
}

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
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");
  
  const [salesData, setSalesData] = useState<SalesReport[]>(mockSalesData);
  const [authors] = useState(mockAuthors);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<SalesReportFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<SalesReportFilters>(initialFilters);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const lastDataKeyRef = useRef('');

  const isAuthorsEmpty = authors.length === 0;

  // Set default date range on component mount
  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
  }, []);

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

  // Apply range changes
  const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
    const today = dayjs();
    let nextStart = today.startOf('day');
    let nextEnd = today.endOf('day');

    switch (range) {
      case 'day':
        nextStart = today.startOf('day');
        nextEnd = today.endOf('day');
        break;
      case 'week':
        nextStart = today.startOf('week');
        nextEnd = today.endOf('day');
        break;
      case 'month':
        nextStart = today.startOf('month');
        nextEnd = today.endOf('day');
        break;
      case 'year':
        nextStart = today.startOf('year');
        nextEnd = today.endOf('day');
        break;
    }

    setActiveRange(range);
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

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
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setActiveRange('day');
    setSearchQuery('');
  }, []);

  const columns = useMemo(
    (): DataTableColumn<SalesReport>[] => [
      {
        key: 'title',
        label: t('overview.reports.sales', 'Title'),
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
        filter: { type: 'multi', options: ['pending', 'completed', 'cancelled'] },
        width: '1fr',
        align: 'left',
        getValue: (row: SalesReport) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '').toLowerCase();
          let bgColor = '#E2E3E5';
          let textColor = '#383D41';
          if (status === 'pending') { bgColor = '#FFF3CD'; textColor = '#856404'; }
          if (status === 'completed') { bgColor = '#D1ECF1'; textColor = '#0C5460'; }
          if (status === 'cancelled') { bgColor = '#F8D7DA'; textColor = '#721C24'; }
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                backgroundColor: bgColor,
                color: textColor,
              }}
            >
              {status}
            </span>
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
        searchValue={searchQuery}
        onSearchChange={(value: string) => {
          setSearchQuery(value);
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }}
        page={paginationModel.page}
        rowsPerPage={paginationModel.pageSize}
        totalCount={rowCount}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={handlePaginationPageChange}
        onRowsPerPageChange={handlePaginationRowsPerPageChange}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        showPeriodPicker
        periodPickerProps={{
          startDate: startDate ? startDate.toDate() : null,
          endDate: endDate ? endDate.toDate() : null,
          onStartDateChange: (date: Date | null) => {
            setStartDate(date ? dayjs(date) : null);
            setActiveRange('day');
          },
          onEndDateChange: (date: Date | null) => {
            setEndDate(date ? dayjs(date) : null);
            setActiveRange('day');
          }
        }}
        showPeriodButtons
        periodButtonProps={{
          activePeriod: activeRange,
          onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
            applyRange(period);
          }
        }}
        onRowClick={(row: SalesReport) => console.log('View sales report:', row)}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
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
