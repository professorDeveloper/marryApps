import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { _stocks } from 'src/_mock/_warehouse';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView, RenderCellItem } from 'src/components/generic-table-view';

export function StocksListView() {
  const { t } = useTranslation('menu');
  const rows = _stocks;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'sku', headerName: 'SKU', width: 140 },
      {
        field: 'name',
        headerName: t('overview.warehouse.stocks', 'Name'),
        flex: 1,
        minWidth: 220,
        renderCell: (params) => <RenderCellItem params={params} imageField="coverUrl" nameField="name" />,
      },
      { field: 'quantity', headerName: 'Quantity', width: 120 },
      { field: 'location', headerName: t('overview.warehouse.locations', 'Location'), width: 160 },
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
            label={t('edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            href={paths.menu.warehouse.stocks.edit(params.row.id)}
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
        heading: t('overview.warehouse.stocks', 'Stocks'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.menu.warehouse.root },
          { name: t('overview.warehouse.stocks', 'Stocks'), href: paths.menu.warehouse.stocks.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.warehouse.stocks.new }}
    />
  );
}
