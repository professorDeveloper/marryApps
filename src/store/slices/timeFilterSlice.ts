import dayjs from 'dayjs';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'global-time-filter';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface TimeFilterState {
  startDate: string | null;
  endDate: string | null;
  activePeriod: TimePeriod;
}

export function getRangeForPeriod(period: TimePeriod): TimeFilterState {
  const today = dayjs();
  let start = today.startOf('day');

  switch (period) {
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

  return {
    startDate: start.toISOString(),
    endDate: today.endOf('day').toISOString(),
    activePeriod: period,
  };
}

function getTodayRange(): TimeFilterState {
  return getRangeForPeriod('day');
}

// Only the chosen period (day/week/month/year) is trusted from storage; its start/end
// boundaries are always recomputed against "now" so a filter saved weeks ago (e.g. "year")
// never reappears frozen at a stale end date on the next visit.
function getInitialTimeFilter(): TimeFilterState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TimeFilterState;
      if (parsed.activePeriod) {
        return getRangeForPeriod(parsed.activePeriod);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return getTodayRange();
}

const initialState: TimeFilterState = getInitialTimeFilter();

function persist(state: TimeFilterState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
}

const timeFilterSlice = createSlice({
  name: 'timeFilter',
  initialState,
  reducers: {
    setTimeFilter: (state, action: PayloadAction<Partial<TimeFilterState>>) => {
      if (action.payload.startDate !== undefined) state.startDate = action.payload.startDate;
      if (action.payload.endDate !== undefined) state.endDate = action.payload.endDate;
      if (action.payload.activePeriod !== undefined) state.activePeriod = action.payload.activePeriod;
      persist({ startDate: state.startDate, endDate: state.endDate, activePeriod: state.activePeriod });
    },
    resetTimeFilter: (state) => {
      const defaults = getTodayRange();
      state.startDate = defaults.startDate;
      state.endDate = defaults.endDate;
      state.activePeriod = defaults.activePeriod;
      persist(defaults);
    },
  },
});

export const { setTimeFilter, resetTimeFilter } = timeFilterSlice.actions;
export default timeFilterSlice.reducer;
