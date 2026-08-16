import type { SWRConfiguration } from 'swr';
import type { IBranchItem } from 'src/types/branches';

import useSWR from 'swr';
import { useMemo } from 'react';

import { CONFIG } from 'src/global-config';
import { fetcher, endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales/use-locales';

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

interface WorkspaceData {
    id: string;
    name: string;
    logo: string;
    address?: string;
    phone?: string;
}

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Branches API'dan workspaces ma'lumotlarini oladi
 * Va ularni workspace formatiga o'zgartiradi
 */
export function useGetWorkspacesBranches() {
    const { currentLang } = useTranslate();
    const url = endpoints.branches.list;

    const { data, isLoading, error, isValidating } = useSWR<
        BackendResponse<IBranchItem[]> | IBranchItem[]
    >(url, fetcher, { ...swrOptions });

    // Backend response'ni parse qilamiz
    const workspaces = useMemo(() => {
        if (!data) return [];

        let branches: IBranchItem[] = [];

        // Agar response array bo'lsa
        if (Array.isArray(data)) {
            branches = data;
        }
        // Agar BackendResponse formatida bo'lsa
        else if ('data' in data && Array.isArray(data.data)) {
            branches = data.data;
        }

        // Branches'ni workspace formatiga o'zgartiradi
        return branches.map((branch) => {
            // Translation'ni qo'llash uchun
            let displayName = branch.name;

            if (branch.name_i18n && typeof branch.name_i18n === 'object') {
                // Current locale uchun translation'ni olish
                const translation = (branch.name_i18n as Record<string, any>)[currentLang as unknown as string];
                if (translation) {
                    displayName = translation;
                }
            }

            return {
                id: branch.id,
                name: displayName,
                logo: branch.picture_url || `${CONFIG.assetsDir}/assets/icons/workspaces/logo-5.webp`,
                address: branch.address,
                phone: branch.phone,
            };
        }) as WorkspaceData[];
    }, [data, currentLang]);

    const memoizedValue = useMemo(
        () => ({
            workspaces,
            workspacesLoading: isLoading,
            workspacesError: error,
            workspacesValidating: isValidating,
            workspacesEmpty: !isLoading && !isValidating && !workspaces.length,
        }),
        [workspaces, error, isLoading, isValidating]
    );

    return memoizedValue;
}
