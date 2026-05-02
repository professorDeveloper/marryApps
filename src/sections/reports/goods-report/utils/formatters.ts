export const formatAmount = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return amount.toLocaleString();
};

export const formatPercent = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString()}%`;
};
