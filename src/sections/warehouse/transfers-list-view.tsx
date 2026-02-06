import type { GridColDef } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

export function TransfersListView() {
  const { t } = useTranslation('menu');
  const rows: any[] = [];

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
          { name: t('app'), href: paths.warehouse.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.warehouse.root },
          { name: t('overview.warehouse.transfers', 'Transfers'), href: paths.warehouse.transfers.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.warehouse.transfers.new }}
    />
  );
}
