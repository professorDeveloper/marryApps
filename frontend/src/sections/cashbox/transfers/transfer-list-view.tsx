import type { GridColDef } from '@mui/x-data-grid';
import type { Transfer } from 'src/types/transfers';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';
import {
  useBranchesList,
  useStoragesList,
  useDeductionGroups,
} from 'src/hooks/use-reference-data';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

import { TransferDeleteDialog } from './components/TransferDeleteDialog';

export function TransactionsListView() {
  const { t } = useTranslation('menu');
  const { getTransfers } = useTransfersAPI();

  // Shared reference data (SWR-deduped across views/mounts)
  const { branchesMap } = useBranchesList();
  const { storagesMap } = useStoragesList();
  const { groupsMap } = useDeductionGroups();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    try {
      const transfersData = await getTransfers();
      setRows(transfersData.items || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getTransfers]);

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
            { name: t('nav.pos'), href: paths.cashbooks.transactions },
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
