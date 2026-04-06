import type { ReactNode } from 'react';

import { mutate } from 'swr';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

interface BranchContextType {
    selectedBranchId: string | null;
    setSelectedBranchId: (id: string | null) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const BRANCH_STORAGE_KEY = 'selectedBranchId';

export function BranchProvider({ children }: { children: ReactNode }) {
    const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // localStorage'dan init qilish
    useEffect(() => {
        const storedId = localStorage.getItem(BRANCH_STORAGE_KEY);
        if (storedId) {
            setSelectedBranchIdState(storedId);
        }
        setIsHydrated(true);
    }, []);

    // localStorage'ga save qilish
    const setSelectedBranchId = useCallback((id: string | null) => {
        setSelectedBranchIdState(id);
        if (id) {
            localStorage.setItem(BRANCH_STORAGE_KEY, id);
        } else {
            localStorage.removeItem(BRANCH_STORAGE_KEY);
        }

        // Branch o'zgarganda SWR query'larini qayta yuklaymiz
        void mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/'),
            undefined,
            { revalidate: true }
        );
    }, []);

    const value = useMemo(
        () => ({
            selectedBranchId,
            setSelectedBranchId,
        }),
        [selectedBranchId, setSelectedBranchId]
    );

    // Hydrated bo'lguncha children render qilmamiz (SSR issues'ni oldini olish)
    if (!isHydrated) {
        return null;
    }

    return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranchContext() {
    const context = useContext(BranchContext);

    if (context === undefined) {
        throw new Error('useBranchContext must be used within BranchProvider');
    }

    return context;
}
