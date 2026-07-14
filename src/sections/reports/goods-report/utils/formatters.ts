const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumberSpaced(value: number): string {
  return numberFormatter.format(value).replace(/,/g, ' ');
}

export const formatAmount = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return formatNumberSpaced(amount);
};

export const formatPercent = (value: string | number | undefined): string => {
  const amount = Number(value) || 0;
  return `${formatNumberSpaced(amount)}%`;
};
