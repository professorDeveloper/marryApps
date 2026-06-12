
export const getMeasurementLabel = (value: string, t: any): string => {
  if (!value || value === '-') return value;
  return t(`units.${value}`, { defaultValue: value });
};

export const formatIngredientPrice = (price: number | string | undefined): string => {
  if (price === undefined || price === null || price === '') return '-';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export const getIngredientInitials = (name: string): string => name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

export const getIngredientAvatarColor = (name: string): string => {
  const colors = [
    'var(--accent)', 'var(--success)', '#60A5FA', 'var(--warning)', 'var(--text-2)',
    'var(--danger)', 'var(--danger)', 'var(--danger)', 'color-mix(in oklch, #60A5FA 20%, transparent)', 'var(--accent)'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + (hash * 32 - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};
