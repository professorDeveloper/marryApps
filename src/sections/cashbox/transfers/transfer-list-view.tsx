import type { GridColDef } from '@mui/x-data-grid';
import type { Transfer } from 'src/types/transfers';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

import { TransferDeleteDialog } from './components/TransferDeleteDialog';
import type { Branch, Storage } from './types';

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

export function TransactionsListView() {
  const { t } = useTranslation('menu');
  const { getTransfers, getTransferGroups } = useTransfersAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});
  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
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

      setRows(transfersData.items || []);
      setGroupsMap(
        (groupsData || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
          {} as Record<string, string>
        )
      );
      setBranchesMap(
        (branchesData.data || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
          {} as Record<string, string>
        )
      );
      setStoragesMap(
        (storagesData.data || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.name || '-' }),
          {} as Record<string, string>
        )
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getTransferGroups, getTransfers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'number',
        headerName: t('deductions.number'),
        width: 90,
      },
      {
        field: 'from_branch_id',
        headerName: t('warehouse.branch'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => branchesMap[params.row.from_branch_id] || params.row.from_branch_id,
      },
      {
        field: 'to_branch_id',
        headerName: t('warehouse.branch'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => branchesMap[params.row.to_branch_id] || params.row.to_branch_id,
      },
      {
        field: 'from_storage_id',
        headerName: t('deductions.storage'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => storagesMap[params.row.from_storage_id] || '-',
      },
      {
        field: 'to_storage_id',
        headerName: t('warehouse.storage'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => storagesMap[params.row.to_storage_id] || params.row.to_storage_id,
      },
      {
        field: 'act_group_id',
        headerName: t('deductions.group'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => groupsMap[params.row.act_group_id] || params.row.act_group_id,
      },
      {
        field: 'status',
        headerName: t('deductions.status'),
        width: 120,
      },
      {
        field: 'total_amount',
        headerName: t('deductions.balance'),
        width: 140,
        renderCell: (params) => Number(params.row.total_amount || 0).toLocaleString(),
      },
      {
        field: 'date',
        headerName: t('deductions.date'),
        width: 140,
        renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: t('common.actions'),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            key="delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label={t('common.delete')}
            style={{ color: 'var(--accent)' }}
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
          heading: t('cashbox.sidebar.transactions'),
          links: [
            { name: t('dashboard'), href: paths.dashboard.root },
            { name: t('cashbox.sidebar.title'), href: paths.cashbox.root },
            { name: t('cashbox.sidebar.transactions') },
          ],
        }}
        addButton={{
          label: t('common.add'),
          href: `${paths.cashbox.transactions}/new`,
        }}
      />

      <TransferDeleteDialog
        open={openConfirm}
        transferId={deleteId}
        onClose={() => {
          setOpenConfirm(false);
          setDeleteId(null);
        }}
        onSuccess={() => {
          setDeleteId(null);
          loadData({ silent: true });
        }}
      />
    </>
  );
}
