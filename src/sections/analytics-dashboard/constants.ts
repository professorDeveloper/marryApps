import { DashboardOverviewParams } from './types';

export const CHART_COLORS = {
  primary: 'var(--color-primary-500)',
  secondary: 'var(--color-danger-500)',
  tertiary: 'var(--color-warning-500)',
  quaternary: 'var(--color-surface-tertiary)',
  success: 'var(--color-success-500)',
  warning: 'var(--color-warning-500)',
  error: 'var(--color-danger-600)',
  info: 'var(--color-info-500)',
};

export const KPI_CONFIG = {
  revenue: {
    label: 'Gross Revenue',
    icon: '💰',
    color: CHART_COLORS.primary,
  },
  checks_count: {
    label: 'Checks Count',
    icon: '📋',
    color: CHART_COLORS.info,
  },
  average_check: {
    label: 'Average Check',
    icon: '📊',
    color: CHART_COLORS.tertiary,
  },
  returns_count: {
    label: 'Returns Count',
    icon: '↩️',
    color: CHART_COLORS.error,
  },
  discounts_amount: {
    label: 'Discounts Amount',
    icon: '🏷️',
    color: CHART_COLORS.warning,
  },
  vat_amount: {
    label: 'VAT Amount',
    icon: '📄',
    color: CHART_COLORS.quaternary,
  },
} as const;

export const DATE_RANGE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

export const DEFAULT_API_PARAMS: Partial<DashboardOverviewParams> = {
  group_by: 'week',
  dish_metric: 'revenue',
  dish_sort: 'desc',
  limit: 10,
  lang: 'uz',
};

export const HALL_UTILIZATION_MOCK_DATA = {
  hallName: 'Main Hall',
  totalCapacity: 120,
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  timeSlots: ['12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'],
  data: Array.from({ length: 35 }, (_, i) => {
    const dayIndex = i % 7;
    const slotIndex = Math.floor(i / 7);
    const utilization = Math.floor(Math.random() * 100);
    return {
      day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex],
      timeSlot: ['12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'][slotIndex],
      utilization,
      capacity: 120,
    };
  }),
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  transfer: 'Transfer',
  other: 'Other',
};
