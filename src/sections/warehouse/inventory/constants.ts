export const INVENTORY_ROW_GRID = 'minmax(0,1fr) 80px 100px 80px 120px 48px' as const;

export const LIST_MAX_HEIGHT = 'calc(100vh - 460px)';
export const ROW_ESTIMATE_PX = 48;
export const AVAILABLE_ROW_ESTIMATE_PX = 52;
export const LARGE_BATCH = 50;

export const initialInventoryItemsState = {
    transferredIds: [] as string[],
    quantities: {} as Record<string, number>,
};
