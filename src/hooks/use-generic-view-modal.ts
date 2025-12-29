/**
 * Use Generic View Modal - Modal ochish/yopish va data manage qilish uchun hook
 * Har xil data turlari bilan ishlaydi
 */

import { useCallback, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface GenericViewData {
    id?: string;
    [key: string]: any;
}

export interface UseGenericViewModalReturn<T extends GenericViewData> {
    isOpen: boolean;
    selectedData: T | null;
    openModal: (data: T) => void;
    closeModal: () => void;
    resetModal: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Generic modal state va action'larni boshqarish uchun hook
 * @template T - Ma'lumot tipi
 * @returns Modal control object
 */
export function useGenericViewModal<T extends GenericViewData = GenericViewData>(): UseGenericViewModalReturn<T> {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedData, setSelectedData] = useState<T | null>(null);

    const openModal = useCallback((data: T) => {
        setSelectedData(data);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const resetModal = useCallback(() => {
        setIsOpen(false);
        setSelectedData(null);
    }, []);

    return {
        isOpen,
        selectedData,
        openModal,
        closeModal,
        resetModal,
    };
}
