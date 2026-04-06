export const ADDED_INVOICE_ROW_GRID =
    '40px minmax(120px,1fr) minmax(132px,auto) minmax(108px,auto) minmax(108px,auto) 48px' as const;

export const LIST_MAX_HEIGHT = 'calc(100vh - 460px)';

export const ADDED_ROW_ESTIMATE_PX = 50;
export const AVAILABLE_ROW_ESTIMATE_PX = 52;

export const LARGE_BATCH = 50;

export const initialTransferredState = {
    transferredIds: [] as string[],
    quantities: {} as Record<string, number>,
    pricesPerUnit: {} as Record<string, number>,
    prices: {} as Record<string, number>,
    showCalculation: false,
};
