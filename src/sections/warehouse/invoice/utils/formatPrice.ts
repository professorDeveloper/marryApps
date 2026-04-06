export const formatPrice = (price: number) => {
    const formatted = Math.round(price * 100) / 100;
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(formatted);
};

export const formatNumber = (num: number): number => Math.round(num * 100) / 100;



export const parseInputNumber = (value: string): number | null => {
    if (value.trim() === '') return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? formatNumber(parsed) : null;
};
