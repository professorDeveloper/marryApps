import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { _transfers } from 'src/_mock/_warehouse';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

export function TransfersListView() {
  const { t } = useTranslation('menu');
  const rows = _transfers;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'fromWarehouse', headerName: 'From', width: 160 },
      { field: 'toWarehouse', headerName: 'To', width: 160 },
      { field: 'quantity', headerName: 'Quantity', width: 120 },
      { field: 'status', headerName: 'Status', width: 140 },
      { field: 'createdAt', headerName: 'Date', width: 180 },
      {
        type: 'actions',
        field: 'actions',
        headerName: ' ',
        width: 64,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            showInMenu
            label={t('view')}
            icon={<Iconify icon="solar:eye-bold" />}
          />,
        ],
      },
    ],
    [t]
  );

  return (
    <GenericTableView
      data={rows}
      loading={false}
      columns={columns}
      breadcrumbs={{
        heading: t('overview.warehouse.transfers', 'Transfers'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.menu.warehouse.root },
          { name: t('overview.warehouse.transfers', 'Transfers'), href: paths.menu.warehouse.transfers.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.warehouse.transfers.new }}
    />
  );
}
