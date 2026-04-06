import type { TransferredState } from '../types';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useCallback, startTransition } from 'react';

import { LARGE_BATCH, initialTransferredState } from '../constants';
import { formatNumber, parseInputNumber } from '../utils/formatPrice';

export const useTransferredItems = () => {
    const { t } = useTranslation('menu');
    const [state, setState] = useState<TransferredState>(initialTransferredState);
    const stateRef = useRef(state);
    stateRef.current = state;

    const localBatchData = useMemo(() => {
        const { transferredIds, quantities, pricesPerUnit, prices } = state;
        if (transferredIds.length === 0) return [];

        const seen = new Set<string>();
        const uniqueOrdered: string[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            uniqueOrdered.push(id);
        }

        return [...uniqueOrdered]
            .sort()
            .map((id) => ({
                ingredient_id: id,
                quantity: quantities[id] ?? 0,
                price_per_unit: pricesPerUnit[id] ?? 0,
                price: prices[id] ?? 0,
            }));
    }, [state.transferredIds, state.quantities, state.pricesPerUnit, state.prices]);

    const handleQuantityChange = useCallback((id: string, value: string) => {
        setState((prev) => {
            const qty = parseInputNumber(value);
            const nextQuantities = { ...prev.quantities };
            if (qty === null) delete nextQuantities[id];
            else nextQuantities[id] = qty;

            let nextPrices = prev.prices;
            let nextPricesPerUnit = prev.pricesPerUnit;

            if (qty !== null && qty > 0) {
                const pricePerUnitVal = prev.pricesPerUnit[id];
                const totalPriceVal = prev.prices[id];

                if (pricePerUnitVal > 0) {
                    nextPrices = { ...prev.prices, [id]: formatNumber(qty * pricePerUnitVal) };
                } else if (totalPriceVal > 0) {
                    nextPricesPerUnit = { ...prev.pricesPerUnit, [id]: formatNumber(totalPriceVal / qty) };
                }
            }

            return { ...prev, quantities: nextQuantities, prices: nextPrices, pricesPerUnit: nextPricesPerUnit };
        });
    }, []);

    const handlePricePerUnitChange = useCallback((id: string, value: string) => {
        setState((prev) => {
            const pricePerUnitVal = parseInputNumber(value);
            const nextPricesPerUnit = { ...prev.pricesPerUnit };
            if (pricePerUnitVal === null) delete nextPricesPerUnit[id];
            else nextPricesPerUnit[id] = pricePerUnitVal;

            let nextPrices = prev.prices;
            let nextQuantities = prev.quantities;

            if (pricePerUnitVal !== null && pricePerUnitVal !== 0) {
                const qtyVal = prev.quantities[id] || 0;
                const totalPriceVal = prev.prices[id] || 0;

                if (qtyVal > 0) {
                    nextPrices = { ...prev.prices, [id]: formatNumber(qtyVal * pricePerUnitVal) };
                } else if (totalPriceVal > 0) {
                    nextQuantities = { ...prev.quantities, [id]: formatNumber(totalPriceVal / pricePerUnitVal) };
                }
            }

            return { ...prev, pricesPerUnit: nextPricesPerUnit, prices: nextPrices, quantities: nextQuantities };
        });
    }, []);

    const handleTotalPriceChange = useCallback((id: string, value: string) => {
        setState((prev) => {
            const totalPriceVal = parseInputNumber(value);
            const nextPrices = { ...prev.prices };
            if (totalPriceVal === null) delete nextPrices[id];
            else nextPrices[id] = totalPriceVal;

            let nextPricesPerUnit = prev.pricesPerUnit;
            let nextQuantities = prev.quantities;

            if (totalPriceVal !== null && totalPriceVal !== 0) {
                const qtyVal = prev.quantities[id] || 0;
                const pricePerUnitVal = prev.pricesPerUnit[id] || 0;

                if (qtyVal > 0) {
                    nextPricesPerUnit = { ...prev.pricesPerUnit, [id]: formatNumber(totalPriceVal / qtyVal) };
                } else if (pricePerUnitVal > 0) {
                    nextQuantities = { ...prev.quantities, [id]: formatNumber(totalPriceVal / pricePerUnitVal) };
                }
            }

            return { ...prev, prices: nextPrices, pricesPerUnit: nextPricesPerUnit, quantities: nextQuantities };
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
                return { ...prev, transferredIds: [...prev.transferredIds, ...toAdd], showCalculation: true };
            });

        if (uniqueIncoming.length >= LARGE_BATCH) {
            startTransition(apply);
        } else {
            apply();
        }
    }, []);

    const removeIngredientIds = useCallback(
        (ids: string[]) => {
            if (ids.length === 0) return;
            const unique = [...new Set(ids)];

            const apply = () =>
                setState((p) => {
                    const removeSet = new Set(unique);
                    const newTransferredIds = p.transferredIds.filter((id) => !removeSet.has(id));
                    const nextQ = { ...p.quantities };
                    const nextP = { ...p.prices };
                    const nextPPU = { ...p.pricesPerUnit };
                    unique.forEach((id) => {
                        delete nextQ[id];
                        delete nextP[id];
                        delete nextPPU[id];
                    });
                    return {
                        ...p,
                        transferredIds: newTransferredIds,
                        quantities: nextQ,
                        prices: nextP,
                        pricesPerUnit: nextPPU,
                        showCalculation: newTransferredIds.length > 0 && p.showCalculation,
                    };
                });

            if (unique.length >= LARGE_BATCH) {
                startTransition(apply);
            } else {
                apply();
            }

            if (unique.length > 1) {
                toast.success(t('warehouse.invoiceDetails.itemsDeleted', 'Items deleted'));
            }
        },
        [t]
    );

    const moveLeft = useCallback(() => {
        toast.success(t('warehouse.invoiceDetails.allItemsRemoved', 'All items removed'));
        setState(initialTransferredState);
    }, [t]);

    const restoreFromPersisted = useCallback((persistedDetails: any[] | undefined) => {
        if (!persistedDetails || persistedDetails.length === 0) {
            setState(initialTransferredState);
            return;
        }

        const incomingById = new Map<string, any>();
        persistedDetails.forEach((detail) => {
            const ingredientId = String(detail.ingredient_id || detail.id || '');
            if (!ingredientId || incomingById.has(ingredientId)) return;
            incomingById.set(ingredientId, {
                quantity: Number(detail.quantity) || 0,
                price_per_unit: Number(detail.price_per_unit) || 0,
                price: Number(detail.price) || 0,
            });
        });

        const newTransferredIds: string[] = Array.from(incomingById.keys());
        const newQuantities: Record<string, number> = {};
        const newPricesPerUnit: Record<string, number> = {};
        const newPrices: Record<string, number> = {};

        incomingById.forEach((detail, id) => {
            newQuantities[id] = detail.quantity;
            newPricesPerUnit[id] = detail.price_per_unit;
            newPrices[id] = detail.price;
        });

        setState({
            transferredIds: newTransferredIds,
            quantities: newQuantities,
            pricesPerUnit: newPricesPerUnit,
            prices: newPrices,
            showCalculation: true,
        });
    }, []);

    const clearAll = useCallback(() => {
        setState(initialTransferredState);
    }, []);

    return {
        transferredIds: state.transferredIds,
        quantities: state.quantities,
        pricesPerUnit: state.pricesPerUnit,
        prices: state.prices,
        showCalculation: state.showCalculation,
        localBatchData,
        moveRight,
        moveLeft,
        removeIngredientIds,
        handleQuantityChange,
        handlePricePerUnitChange,
        handleTotalPriceChange,
        restoreFromPersisted,
        clearAll,
    };
};
