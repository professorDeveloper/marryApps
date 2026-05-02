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
      return '#4CAF50';
    case 'down':
      return '#F44336';
    case 'same':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
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
  if (utilization >= 80) return '#4CAF50';
  if (utilization >= 50) return '#FF9800';
  return '#F44336';
};
