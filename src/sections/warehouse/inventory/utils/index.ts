
import dayjs from 'dayjs';

export const formatInventoryDate = (date: string | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('DD.MM.YYYY');
};

export const formatInventoryAmount = (amount: number): string => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getInventoryStatusConfig = (status: string) => {
  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'var(--success)' },
    draft: { label: 'Draft', color: 'var(--warning)' },
    deleted: { label: 'Deleted', color: 'var(--danger)' },
  };

  return statusConfig[status] || statusConfig.draft;
};

export const getInventoryStatusLabel = (status: string): string => getInventoryStatusConfig(status).label;

export const getInventoryStatusColor = (status: string): string => getInventoryStatusConfig(status).color;
