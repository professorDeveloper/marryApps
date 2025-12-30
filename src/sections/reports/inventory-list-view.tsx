import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { _reportsInventory } from 'src/_mock/_reports';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem, GenericTableView } from 'src/components/generic-table-view';

export function InventoryReportsListView() {
  const { t } = useTranslation('menu');
  const rows = _reportsInventory;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'title',
        headerName: t('overview.reports.inventory', 'Title'),
        flex: 1,
        minWidth: 260,
        renderCell: (params) => (
          <RenderCellItem params={params} imageField="coverUrl" nameField="title" />
        ),
      },
      {
        field: 'author',
        headerName: 'Author',
        width: 200,
        renderCell: (params) => (
          <RenderCellItem params={params} imageField="authorAvatar" nameField="author" />
        ),
      },
      { field: 'createdAt', headerName: 'Date', width: 140 },
      { field: 'summary', headerName: 'Summary', width: 320 },
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
        heading: t('overview.reports.inventory', 'Inventory'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.reports.title', 'Hisobotlar'), href: paths.menu.reports.root },
          { name: t('overview.reports.inventory', 'Inventory'), href: paths.menu.reports.inventory.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.reports.inventory.new }}
    />
  );
}
