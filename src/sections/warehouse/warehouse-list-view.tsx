import type { GridColDef } from '@mui/x-data-grid';

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { _warehouses } from 'src/_mock/_warehouse';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView, RenderCellItem } from 'src/components/generic-table-view';

export function WarehouseListView() {
  const { t } = useTranslation('menu');

  const warehouses = _warehouses;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('overview.warehouse.stocks', 'Name'),
        flex: 1,
        minWidth: 240,
        renderCell: (params) => <RenderCellItem params={params} nameField="name" />,
      },
      {
        field: 'code',
        headerName: 'Code',
        width: 120,
      },
      {
        field: 'stock',
        headerName: t('overview.warehouse.stocks', 'Stock'),
        width: 120,
      },
      {
        field: 'location',
        headerName: t('overview.warehouse.locations', 'Location'),
        width: 160,
      },
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
            href={paths.menu.warehouse.edit(params.row.id)}
          />,
        ],
      },
    ],
    [t]
  );

  return (
    <GenericTableView
      data={warehouses}
      loading={false}
      columns={columns}
      breadcrumbs={{
        heading: t('overview.warehouse.title', 'Ombor'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.menu.warehouse.root },
          { name: t('list', 'List') },
        ],
      }}
      addButton={{
        label: t('add'),
        href: paths.menu.warehouse.new,
      }}
      onDeleteRow={() => {}}
      onDeleteRows={() => {}}
    />
  );
}
