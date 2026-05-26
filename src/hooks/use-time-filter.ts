import type { TimePeriod } from 'src/store/slices/timeFilterSlice';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from 'src/store';
import { setTimeFilter, resetTimeFilter } from 'src/store/slices/timeFilterSlice';

export function useTimeFilter() {
  const dispatch = useAppDispatch();
  const { startDate: startIso, endDate: endIso, activePeriod } = useAppSelector(
    (state) => state.timeFilter
  );

  // Memoize by ISO string to avoid creating new dayjs objects on every render.
  // Without useMemo, every component that does useEffect([startDate, endDate])
  // fires on every render → infinite setState loop → Maximum update depth exceeded.
  const startDate = useMemo(() => (startIso ? dayjs(startIso) : null), [startIso]);
  const endDate = useMemo(() => (endIso ? dayjs(endIso) : null), [endIso]);

  const setDates = useCallback(
    (start: dayjs.Dayjs | null, end: dayjs.Dayjs | null, period?: TimePeriod) => {
      dispatch(
        setTimeFilter({
          startDate: start ? start.toISOString() : null,
          endDate: end ? end.toISOString() : null,
          ...(period ? { activePeriod: period } : {}),
        })
      );
    },
    [dispatch]
  );

  const applyRange = useCallback(
    (range: TimePeriod) => {
      const today = dayjs();
      let start = today.startOf('day');
      const end = today.endOf('day');

      switch (range) {
        case 'week':
          start = today.startOf('week');
          break;
        case 'month':
          start = today.startOf('month');
          break;
        case 'year':
          start = today.startOf('year');
          break;
        default:
          break;
      }

      dispatch(
        setTimeFilter({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          activePeriod: range,
        })
      );
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetTimeFilter());
  }, [dispatch]);

  return { startDate, endDate, activePeriod, setDates, applyRange, reset };
}
