export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

export const formatPercentage = (value: string | number, showSign = true): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const formatQuantity = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(3);
};

export const getTrendColor = (trend: 'up' | 'down' | 'same'): string => {
  switch (trend) {
    case 'up':
      return 'var(--color-success-500)';
    case 'down':
      return 'var(--color-danger-500)';
    case 'same':
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-muted)';
  }
};

export const getTrendIcon = (trend: 'up' | 'down' | 'same'): string => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'same':
      return '→';
    default:
      return '→';
  }
};

export const getUtilizationColor = (utilization: number): string => {
  if (utilization >= 80) return 'var(--color-success-500)';
  if (utilization >= 50) return 'var(--color-warning-500)';
  return 'var(--color-danger-500)';
};
