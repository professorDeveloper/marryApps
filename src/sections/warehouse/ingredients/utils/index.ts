
export const getMeasurementLabel = (value: string, t: any): string => {
  switch (value) {
    case 'kg':
      return t('ingredients.measurementKg', 'kg');
    case 'l':
      return t('ingredients.measurementL', 'l');
    case 'piece':
      return t('ingredients.measurementDona', 'piece');
    default:
      return value;
  }
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
    'var(--color-primary-500)', 'var(--color-success-500)', 'var(--color-info-500)', 'var(--color-warning-500)', 'var(--color-secondary-500)',
    'var(--color-danger-500)', 'var(--color-danger-600)', 'var(--color-danger-100)', 'var(--color-info-100)', 'var(--color-primary-600)'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};
