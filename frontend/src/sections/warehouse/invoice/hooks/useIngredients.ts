import type { Ingredient } from '../types';
import type { IIngredientItem } from 'src/types/ingredients';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect, useCallback } from 'react';

import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';

export const useIngredients = () => {
    const { getIngredients } = useInvoiceDetailsAPI();
    const { t } = useTranslation('menu');

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const loadedRef = useRef(false);

    const loadIngredients = useCallback(async () => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        try {
            setLoading(true);
            const data = await getIngredients();
            setIngredients(data || []);
        } catch (error) {
            console.error('Error loading ingredients:', error);
            toast.error(t('error.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [getIngredients, t]);

    // Initial load (only once on mount)
    useEffect(() => {
        loadIngredients();
    }, []); // Empty array: run only once

    // Manual refresh (with success toast)
    const refreshIngredients = useCallback(async () => {
        loadedRef.current = false; // Allow refresh
        try {
            setLoading(true);
            const data = await getIngredients();
            setIngredients(data || []);
            toast.success(t('warehouse.ingredients.created'));
        } catch (error) {
            console.error('Error refreshing ingredients:', error);
            toast.error(t('warehouse.ingredients.createFailed'));
        } finally {
            setLoading(false);
        }
    }, [getIngredients, t]);

    // Prepend a newly created ingredient into local state without refetching
    const addIngredient = useCallback((item: IIngredientItem) => {
        setIngredients((prev) => {
            if (prev.some((ing) => ing.id === item.id)) return prev;
            return [
                {
                    id: item.id,
                    name: item.name,
                    measurement: item.measurement,
                    price_per_unit: item.price_per_unit ?? '',
                    group_id: item.group_id,
                },
                ...prev,
            ];
        });
    }, []);

    return {
        ingredients,
        loading,
        refreshIngredients,
        addIngredient,
    };
};