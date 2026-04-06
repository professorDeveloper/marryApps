import type { InventoryItemsState } from '../types';
import type { IInventoryItemInput } from 'src/types/inventory';

import { useRef, useMemo, useState, useCallback, startTransition } from 'react';

import { parseInputNumber } from '../utils/formatPrice';
import { LARGE_BATCH, initialInventoryItemsState } from '../constants';

export const useInventoryItems = () => {
    const [state, setState] = useState<InventoryItemsState>(initialInventoryItemsState);
    const stateRef = useRef(state);
    stateRef.current = state;

    const handleQuantityChange = useCallback((id: string, value: string) => {
        setState((prev) => {
            const qty = parseInputNumber(value);
            const nextQuantities = { ...prev.quantities };
            if (qty === null) delete nextQuantities[id];
            else nextQuantities[id] = qty;
            return { ...prev, quantities: nextQuantities };
        });
    }, []);

    const moveRight = useCallback((selectedIds: string[]) => {
        if (selectedIds.length === 0) return;
        const uniqueIncoming = [...new Set(selectedIds)];

        const apply = () =>
            setState((prev) => {
                const existing = new Set(prev.transferredIds);
                const toAdd = uniqueIncoming.filter((id) => !existing.has(id));
                if (toAdd.length === 0) return prev;
                return { ...prev, transferredIds: [...prev.transferredIds, ...toAdd] };
            });

        if (uniqueIncoming.length >= LARGE_BATCH) {
            startTransition(apply);
        } else {
            apply();
        }
    }, []);

    const removeIds = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        const unique = [...new Set(ids)];

        const apply = () =>
            setState((p) => {
                const removeSet = new Set(unique);
                const nextQ = { ...p.quantities };
                unique.forEach((id) => { delete nextQ[id]; });
                return {
                    ...p,
                    transferredIds: p.transferredIds.filter((id) => !removeSet.has(id)),
                    quantities: nextQ,
                };
            });

        if (unique.length >= LARGE_BATCH) {
            startTransition(apply);
        } else {
            apply();
        }
    }, []);

    const restoreFromPersisted = useCallback((persistedItems: any[] | undefined) => {
        if (!persistedItems || persistedItems.length === 0) {
            setState(initialInventoryItemsState);
            return;
        }

        const newTransferredIds: string[] = [];
        const newQuantities: Record<string, number> = {};

        persistedItems.forEach((item) => {
            const id = String(item.ingredient_id || item.id || '');
            if (!id || newQuantities[id] !== undefined) return;
            newTransferredIds.push(id);
            newQuantities[id] = Number(item.counted_quantity) || 0;
        });

        setState({ transferredIds: newTransferredIds, quantities: newQuantities });
    }, []);

    const getBatchData = useCallback((): IInventoryItemInput[] => {
        const { transferredIds, quantities } = stateRef.current;
        const seen = new Set<string>();
        return transferredIds
            .filter((id) => {
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .map((id) => ({
                ingredient_id: id,
                counted_quantity: String(quantities[id] ?? 0),
            }));
    }, []);

    const clearAll = useCallback(() => {
        setState(initialInventoryItemsState);
    }, []);

    const excludedIdSet = useMemo(() => new Set(state.transferredIds), [state.transferredIds]);

    return {
        transferredIds: state.transferredIds,
        quantities: state.quantities,
        excludedIdSet,
        handleQuantityChange,
        moveRight,
        removeIds,
        restoreFromPersisted,
        getBatchData,
        clearAll,
    };
};
