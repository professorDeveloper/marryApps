import type {
  IUserOption,
  IBranchOption,
  ITransactionGroup,
  ICashRegisterOption,
} from 'src/types/transactions';

import useSWR from 'swr';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------
// Shared SWR hooks for static reference lists (storages, branches, groups,
// ingredients, suppliers, cash registers, staff). Views used to fetch these
// with raw `fetcher` calls inside effects, which re-issued every request on
// each mount (and let StrictMode double them). Going through SWR dedupes
// concurrent and repeat requests across all mounted consumers
// (dedupingInterval: 60s — see src/lib/swr.tsx).
//
// Keys are the bare endpoint strings (or the exact [url, config] tuples the
// old code used) so existing `mutate(...)` invalidation calls keep working.
// ----------------------------------------------------------------------

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

export interface ReferenceItem {
  id: string;
  name: string;
}

export interface StorageItem extends ReferenceItem {
  branch_id?: string;
}

export interface IngredientItem extends ReferenceItem {
  measurement?: string;
  price_per_unit?: string;
}

export interface BranchDetailItem {
  branch_id: string;
  name: string;
  storages?: StorageItem[];
}

type ListResponse<T> = BackendResponse<T[]> | T[];

function unwrapList<T>(data: ListResponse<T> | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.data) ? data.data : [];
}

function toNameMap(items: Array<{ id: string; name?: string }>): Record<string, string> {
  return items.reduce(
    (acc, item) => {
      acc[item.id] = item.name || item.id;
      return acc;
    },
    {} as Record<string, string>
  );
}

// ----------------------------------------------------------------------

/**
 * Branches with their nested storages, localized — one combined request
 * (`/api/v1/branches-lang/detail`) instead of separate branches + storages
 * list calls.
 */
export function useBranchesDetail() {
  const { i18n } = useTranslation();

  const langCode = i18n.language?.startsWith('ru')
    ? 'ru'
    : i18n.language?.startsWith('en')
      ? 'en'
      : 'uz';

  const { data, isLoading, error } = useSWR<BackendResponse<BranchDetailItem[]>>(
    [endpoints.branches.detail, { params: { lang: langCode } }],
    fetcher
  );

  return useMemo(() => {
    const branchDetails = Array.isArray(data?.data) ? data.data : [];

    const branches: ReferenceItem[] = branchDetails.map((b) => ({
      id: b.branch_id,
      name: b.name || b.branch_id,
    }));

    const branchesMap = toNameMap(branches);

    const storagesMap: Record<string, string> = {};
    const branchStoragesMap: Record<string, StorageItem[]> = {};
    branchDetails.forEach((b) => {
      const storages = Array.isArray(b.storages) ? b.storages : [];
      branchStoragesMap[b.branch_id] = storages;
      storages.forEach((s) => {
        storagesMap[s.id] = s.name || s.id;
      });
    });

    return { branchDetails, branches, branchesMap, storagesMap, branchStoragesMap, isLoading, error };
  }, [data, isLoading, error]);
}

/** Deduction/transfer act groups (`/api/v1/deductions/group`). */
export function useDeductionGroups() {
  const { data, isLoading, error } = useSWR<ListResponse<ReferenceItem>>(
    endpoints.deductions.groups,
    fetcher
  );

  return useMemo(() => {
    const groups = unwrapList(data);
    return { groups, groupsMap: toNameMap(groups), isLoading, error };
  }, [data, isLoading, error]);
}

/** Plain storages list (`/api/v1/storages`). */
export function useStoragesList() {
  const { data, isLoading, error } = useSWR<ListResponse<StorageItem>>(
    endpoints.storage.list,
    fetcher
  );

  return useMemo(() => {
    const storages = unwrapList(data);
    return { storages, storagesMap: toNameMap(storages), isLoading, error };
  }, [data, isLoading, error]);
}

/** Plain branches list (`/api/v1/branches`). Shares its cache entry with useGetWorkspacesBranches / preload-critical. */
export function useBranchesList() {
  const { data, isLoading, error } = useSWR<ListResponse<IBranchOption>>(
    endpoints.branches.list,
    fetcher
  );

  return useMemo(() => {
    const branches = unwrapList(data);
    return { branches, branchesMap: toNameMap(branches), isLoading, error };
  }, [data, isLoading, error]);
}

/** Ingredients list (`/api/v1/ingredients`). */
export function useIngredientsList() {
  const { data, isLoading, error } = useSWR<ListResponse<IngredientItem>>(
    endpoints.ingredient.list,
    fetcher
  );

  return useMemo(() => {
    const ingredients = unwrapList(data);
    return { ingredients, ingredientsMap: toNameMap(ingredients), isLoading, error };
  }, [data, isLoading, error]);
}

/** Suppliers list (`/api/v1/suppliers`). */
export function useSuppliersList() {
  const { data, isLoading, error } = useSWR<ListResponse<ReferenceItem>>(
    endpoints.supplier.list,
    fetcher
  );

  return useMemo(() => {
    const suppliers = unwrapList(data);
    return { suppliers, suppliersMap: toNameMap(suppliers), isLoading, error };
  }, [data, isLoading, error]);
}

/** Cashbox transaction groups. */
export function useTransactionGroupsList() {
  const { data, isLoading, error } = useSWR<ListResponse<ITransactionGroup>>(
    endpoints.cashbox.groupTransactions.root,
    fetcher
  );

  return useMemo(() => {
    const transactionGroups = unwrapList(data);
    return { transactionGroups, transactionGroupsMap: toNameMap(transactionGroups), isLoading, error };
  }, [data, isLoading, error]);
}

/** Cash registers list. */
export function useCashRegistersList() {
  const { data, isLoading, error } = useSWR<ListResponse<ICashRegisterOption>>(
    endpoints.cashbox.cashRegisters.root,
    fetcher
  );

  return useMemo(() => {
    const cashRegisters = unwrapList(data);
    return { cashRegisters, cashRegistersMap: toNameMap(cashRegisters), isLoading, error };
  }, [data, isLoading, error]);
}

/** Staff users list (`/api/v1/users/staff`). */
export function useStaffUsersList() {
  const { data, isLoading, error } = useSWR<ListResponse<IUserOption>>(
    endpoints.users.staff,
    fetcher
  );

  return useMemo(() => {
    const staffUsers = unwrapList(data);
    const staffUsersMap = staffUsers.reduce(
      (acc, user) => {
        acc[user.id] = user.full_name || user.username || user.id;
        return acc;
      },
      {} as Record<string, string>
    );
    return { staffUsers, staffUsersMap, isLoading, error };
  }, [data, isLoading, error]);
}
