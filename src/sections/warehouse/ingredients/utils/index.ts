
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
    '#ff4d1a', '#12b76a', '#2e90fa', '#f79009', '#8E33FF',
    '#f04438', '#d92d20', '#fda29b', '#84caff', '#e83a06'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};
