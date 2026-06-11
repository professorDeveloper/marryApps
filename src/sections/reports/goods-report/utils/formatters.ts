function formatNumberSpaced(value: number, decimals = 2): string {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const result = decPart ? `${grouped},${decPart}` : grouped;
  return negative ? `-${result}` : result;
}

export const formatAmount = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return formatNumberSpaced(amount, 2);
};

export const formatPercent = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return `${formatNumberSpaced(amount, 2)}%`;
};
