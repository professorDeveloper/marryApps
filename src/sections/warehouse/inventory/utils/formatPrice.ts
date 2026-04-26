export const formatPrice = (price: number) => {
    if (Number.isNaN(price)) return '0.00';
    const formatted = Math.round(price * 100) / 100;
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    }).format(formatted).replace(/,/g, ' ');
};

export const formatNumber = (num: number): number => Math.round(num * 100) / 100;

export const parseInputNumber = (value: string): number | null => {
    if (value.trim() === '') return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? formatNumber(parsed) : null;
};
