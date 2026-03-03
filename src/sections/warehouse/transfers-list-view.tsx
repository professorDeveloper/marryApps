import type { GridColDef } from '@mui/x-data-grid';
import type { Transfer } from 'src/types/transfers';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';
import { endpoints, fetcher } from 'src/lib/axios';

interface Branch {
  id: string;
  name: string;
}

interface Storage {
  id: string;
  name: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

type BranchDetailsResponse = BackendResponse<Branch> | Branch;
type StoragesByBranchResponse = BackendResponse<Storage[]> | Storage[] | { data?: BackendResponse<Storage[]> | Storage[] };

export function TransfersListView() {
  const { t } = useTranslation('menu');
  const { getTransfers, deleteTransfer, getTransferGroups } = useTransfersAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});
  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transfersData, groupsData, branchesData, storagesData] = await Promise.all([
        getTransfers(),
        getTransferGroups(),
        fetcher<BackendResponse<Branch[]>>(endpoints.branches.list).catch(() => ({
          status: 'error',
          message: 'failed',
          data: [],
          code: 500,
        })),
        fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
          status: 'error',
          message: 'failed',
          data: [],
          code: 500,
        })),
      ]);

      const baseBranchesMap = (branchesData.data || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      );

      const missingBranchIds = Array.from(
        new Set(
          transfersData.flatMap((transfer) => [transfer.from_branch_id, transfer.to_branch_id])
        )
      ).filter((branchId) => branchId && !baseBranchesMap[branchId]);

      let resolvedBranchesMap: Record<string, string> = {};

      if (missingBranchIds.length) {
        const resolvedEntries = await Promise.all(
          missingBranchIds.map(async (branchId) => {
            try {
              const response = await fetcher<BranchDetailsResponse>(endpoints.branches.details(branchId));
              const branch = (response as BackendResponse<Branch>)?.data ?? (response as Branch);
              return [branchId, branch?.name || branchId] as const;
            } catch {
              return [branchId, branchId] as const;
            }
          })
        );

        resolvedBranchesMap = resolvedEntries.reduce(
          (acc, [branchId, branchName]) => ({ ...acc, [branchId]: branchName }),
          {} as Record<string, string>
        );
      }

      const branchIdsFromTransfers = Array.from(
        new Set(
          transfersData.flatMap((transfer) => [transfer.from_branch_id, transfer.to_branch_id])
        )
      ).filter(Boolean);

      const parseStoragesResponse = (response: StoragesByBranchResponse): Storage[] => {
        if (Array.isArray(response)) return response;
        if (response && 'data' in response && Array.isArray(response.data)) return response.data;
        if (
          response &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object' &&
          'data' in response.data &&
          Array.isArray((response.data as BackendResponse<Storage[]>).data)
        ) {
          return (response.data as BackendResponse<Storage[]>).data;
        }
        return [];
      };

      let storagesFromBranches: Storage[] = [];
      if (branchIdsFromTransfers.length) {
        const storagesByBranchResponses = await Promise.all(
          branchIdsFromTransfers.map((branchId) =>
            fetcher<StoragesByBranchResponse>(endpoints.storage.byBranch(branchId)).catch(() => [])
          )
        );

        storagesFromBranches = storagesByBranchResponses.flatMap((response) =>
          parseStoragesResponse(response as StoragesByBranchResponse)
        );
      }

      const baseStorages = Array.isArray(storagesData.data) ? storagesData.data : [];
      const storagesMapMerged = [...baseStorages, ...storagesFromBranches].reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      );

      setRows(transfersData);
      setGroupsMap(
        (groupsData || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
          {} as Record<string, string>
        )
      );
      setBranchesMap(
        {
          ...baseBranchesMap,
          ...resolvedBranchesMap,
        }
      );
      setStoragesMap(
        storagesMapMerged
      );
    } finally {
      setLoading(false);
    }
  }, [getTransferGroups, getTransfers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteTransfer(deleteId);
    setOpenConfirm(false);
    setDeleteId(null);
    await loadData();
  }, [deleteId, deleteTransfer, loadData]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'number',
        headerName: t('deductions.number', 'Number'),
        width: 90,
      },
      {
        field: 'from_branch_id',
        headerName: t('warehouse.branch', 'From branch'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => branchesMap[params.row.from_branch_id] || params.row.from_branch_id,
      },
      {
        field: 'to_branch_id',
        headerName: t('warehouse.branch', 'To branch'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => branchesMap[params.row.to_branch_id] || params.row.to_branch_id,
      },
      {
        field: 'from_storage_id',
        headerName: t('deductions.storage', 'From storage'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => storagesMap[params.row.from_storage_id] || params.row.from_storage_id,
      },
      {
        field: 'to_storage_id',
        headerName: t('warehouse.storage', 'To storage'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => storagesMap[params.row.to_storage_id] || params.row.to_storage_id,
      },
      {
        field: 'act_group_id',
        headerName: t('deductions.group', 'Group'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => groupsMap[params.row.act_group_id] || params.row.act_group_id,
      },
      {
        field: 'status',
        headerName: t('deductions.status', 'Status'),
        width: 120,
      },
      {
        field: 'total_amount',
        headerName: t('deductions.balance', 'Total'),
        width: 140,
        renderCell: (params) => Number(params.row.total_amount || 0).toLocaleString(),
      },
      {
        field: 'date',
        headerName: t('deductions.date', 'Date'),
        width: 140,
        renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            key="edit"
            icon={<Iconify icon="solar:pen-bold" />}
            label={t('common.edit', 'Edit')}
            href={paths.warehouse.transfers.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label={t('common.delete', 'Delete')}
            style={{ color: '#FB6633' }}
            onClick={() => {
              setDeleteId(params.row.id);
              setOpenConfirm(true);
            }}
          />,
        ],
      },
    ],
    [branchesMap, groupsMap, storagesMap, t]
  );

  return (
    <>
      <GenericTableView
        data={rows}
        columns={columns}
        loading={loading}
        breadcrumbs={{
          heading: t('overview.warehouse.transfers', 'Transfers'),
          links: [
            { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
            { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
            { name: t('overview.warehouse.transfers', 'Transfers') },
          ],
        }}
        addButton={{
          label: t('common.add', 'Add'),
          href: paths.warehouse.transfers.new,
        }}
      />

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage', 'Are you sure?')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
