import type { DateRange } from '../constants';
import type { GoodsReportFilters } from '../types';

import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import { toApiEndDateTime, DEFAULT_PAGE_SIZE, toApiStartDateTime } from '../constants';

export function useGoodsReportFilters() {
  const [filters, setFilters] = useState<GoodsReportFilters>({
    start_date: '',
    end_date: '',
    department_id: '',
    category_id: '',
    good_id: '',
    waiter_id: '',
    hall_id: '',
    table_id: '',
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  });

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<DateRange>('day');

  // Initialize with today
  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setFilters((prev) => ({
      ...prev,
      start_date: toApiStartDateTime(today),
      end_date: toApiEndDateTime(today),
    }));
  }, []);

  const handleFilterChange = useCallback((updates: Record<string, string>) => {
    setFilters((prev) => ({ ...prev, ...updates, offset: 0 }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  // Sync date pickers → API filters
  useEffect(() => {
    const updates: Record<string, string> = {};
    if (startDate) updates.start_date = toApiStartDateTime(startDate);
    if (endDate) updates.end_date = toApiEndDateTime(endDate);
    if (Object.keys(updates).length > 0) handleFilterChange(updates);
  }, [startDate, endDate, handleFilterChange]);

  const handleRangeChange = useCallback((range: DateRange) => {
    const today = dayjs();
    setActiveRange(range);
    setStartDate(today.startOf(range));
    setEndDate(today.endOf(range));
  }, []);

  const handleStartDateChange = useCallback((value: dayjs.Dayjs | null) => {
    setStartDate(value);
    setActiveRange('day');
  }, []);

  const handleEndDateChange = useCallback((value: dayjs.Dayjs | null) => {
    setEndDate(value);
    setActiveRange('day');
  }, []);

  const handlePaginationChange = useCallback(
    (model: { page: number; pageSize: number }) => {
      setPaginationModel(model);
      setFilters((prev) => ({
        ...prev,
        limit: model.pageSize,
        offset: model.page * model.pageSize,
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      department_id: '',
      category_id: '',
      good_id: '',
      waiter_id: '',
      hall_id: '',
      table_id: '',
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
    }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  return {
    filters,
    paginationModel,
    startDate,
    endDate,
    activeRange,
    handleFilterChange,
    handleRangeChange,
    handleStartDateChange,
    handleEndDateChange,
    handlePaginationChange,
    handleReset,
  };
}
