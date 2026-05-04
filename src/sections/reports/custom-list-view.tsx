import type { DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo , useState, useEffect, useCallback } from 'react';

import { Box, Button } from '@mui/material';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';
import { RouterLink } from 'src/routes/components';

interface CustomReport {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  coverUrl?: string;
  createdAt: string;
  summary: string;
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

const initialFilters = {
  date_from: getTodayUtcBoundary(),
  date_to: getTomorrowUtcBoundary(true),
  author: '',
  q: '',
  limit: 20,
  offset: 0,
};

export function CustomReportsListView() {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");
  
  // Get global rows per page
  const { rowsPerPage: globalRowsPerPage } = usePaginationRows();
  
  // State management
  const [rawData, setRawData] = useState<CustomReport[]>([
    {
      id: '1',
      title: 'Sales Report Q1 2024',
      author: 'John Doe',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      coverUrl: 'https://mui.com/static/images/cards/contemplative-reptile.jpg',
      createdAt: '2024-01-15T10:00:00Z',
      summary: 'Comprehensive sales analysis for the first quarter of 2024',
    },
    {
      id: '2',
      title: 'Inventory Analysis',
      author: 'Jane Smith',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      coverUrl: 'https://mui.com/static/images/cards/live-from-space.jpg',
      createdAt: '2024-02-20T14:30:00Z',
      summary: 'Detailed inventory status and recommendations',
    },
    {
      id: '3',
      title: 'Customer Feedback Report',
      author: 'Bob Johnson',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      createdAt: '2024-03-10T09:15:00Z',
      summary: 'Analysis of customer satisfaction and feedback trends',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [rowCount, setRowCount] = useState(3);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const lastDataKeyRef = useRef('');

  // Mock authors for filter dropdown
  const authors = useMemo(() => {
    const uniqueAuthors = [...new Set(rawData.map(item => item.author).filter(Boolean))];
    return uniqueAuthors.map(author => ({ id: author, name: author }));
  }, [rawData]);

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

  // Effects
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

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

  const handleViewClick = useCallback((report: CustomReport) => {
    // Placeholder for view action - can be implemented as needed
    console.log('View report:', report);
  }, []);

  const handleReset = useCallback(() => {
    setDraftFilters(initialFilters);
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setActiveRange('day');
    setSearchQuery('');
  }, []);

  const startDateValue = useMemo(() => toPickerDate(draftFilters.date_from), [draftFilters.date_from]);
  const endDateValue = useMemo(() => toPickerDate(draftFilters.date_to), [draftFilters.date_to]);

  const columns = useMemo<DataTableColumn<CustomReport>[]>(
    () => [
      {
        key: 'title',
        label: t('overview.reports.custom', 'Title'),
        sortable: true,
        width: '2fr',
        align: 'left' as const,
        getValue: (row: CustomReport) => row?.title ?? '',
        renderCell: ({ row }: { row: CustomReport }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.coverUrl && (
              <Box
                component="img"
                src={row.coverUrl}
                alt={row.title}
                sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
              />
            )}
            <Box>
              <Box sx={{ fontWeight: 500, color: 'text.primary' }}>
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
        filter: {
          type: 'multi' as const,
          options: authors.map((a) => a.id),
          getOptionLabel: (id: string) => authors.find((a) => a.id === id)?.name || id,
        },
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: CustomReport) => row?.author ?? '',
        renderCell: ({ row }: { row: CustomReport }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.authorAvatar && (
              <Box
                component="img"
                src={row.authorAvatar}
                alt={row.author}
                sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <Box>{row.author}</Box>
          </Box>
        ),
      },
      {
        key: 'createdAt',
        label: 'Date',
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: CustomReport) =>
          row?.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
      },
      {
        key: 'summary',
        label: 'Summary',
        sortable: true,
        width: '2fr',
        align: 'left' as const,
        getValue: (row: CustomReport) => row?.summary ?? '',
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: () => null,
      },
    ],
    [t, handleViewClick, authors]
  );

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
  
      <DataTable<CustomReport>
        persistKey="reports-custom-list"
        data={rawData}
        getRowId={(row: CustomReport) => String(row?.id)}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={(value: string) => {
          setSearchQuery(value);
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }}
        filters={draftFilters.author ? { author: { type: 'multi', value: [draftFilters.author] } } : {}}
        onFiltersChange={(filterState) => {
          const selectedAuthor = (filterState.author?.value as string[])?.[0] || '';
          setDraftFilters((prev) => ({ ...prev, author: selectedAuthor }));
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }}
        page={paginationModel.page}
        rowsPerPage={paginationModel.pageSize}
        totalCount={rowCount}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={handlePaginationPageChange}
        onRowsPerPageChange={handlePaginationRowsPerPageChange}
        defaultConfig={{
          order: ['title', 'author', 'createdAt', 'summary', 'actions'],
          visibility: {
            title: true,
            author: true,
            createdAt: true,
            summary: true,
            actions: true,
          },
          widths: {
            title: '2fr',
            author: '1.5fr',
            createdAt: '1fr',
            summary: '2fr',
            actions: '0.7fr',
          },
        }}
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
        onRowClick={handleViewClick}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.menu.reports.custom.new}
            size="small"
          >
            {t('add')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
