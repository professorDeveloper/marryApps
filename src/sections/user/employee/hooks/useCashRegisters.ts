import type { CashRegisterOption } from '../types';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

export function useCashRegisters() {
    const { t } = useTranslation('menu');
    const { getCashRegistersByBranch } = useTransactionsAPI();

    const [options, setOptions] = useState<CashRegisterOption[]>([]);
    const [loading, setLoading] = useState(false);

    const ownBranchId = useMemo(
        () => localStorage.getItem('selectedBranchId') || localStorage.getItem('branch_id') || '',
        []
    );

    const loadedRef = useRef(false);

    const load = useCallback(async () => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        if (!ownBranchId) {
            setOptions([]);
            return;
        }

        setLoading(true);
        try {
            const registers = await getCashRegistersByBranch(ownBranchId);
            setOptions(
                (registers || []).map((item: any) => ({
                    value: item.id,
                    label: item.name || item.id,
                }))
            );
        } catch (err) {
            console.error('Error loading cash registers:', err);
            toast.error(t('error.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [getCashRegistersByBranch, ownBranchId, t]);

    useEffect(() => {
        void load();
    }, [load]);

    return {
        ownBranchId,
        options,
        loading,
    };
}
