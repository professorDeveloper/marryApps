import type { TimePeriod } from 'src/store/slices/timeFilterSlice';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from 'src/store';
import { setTimeFilter, resetTimeFilter, getRangeForPeriod } from 'src/store/slices/timeFilterSlice';

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
      dispatch(setTimeFilter(getRangeForPeriod(range)));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetTimeFilter());
  }, [dispatch]);

  return { startDate, endDate, activePeriod, setDates, applyRange, reset };
}
