import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem, GenericTableView } from 'src/components/generic-table-view';

export function SalesListView() {
  const { t } = useTranslation('menu');
  const rows: any[] = [];

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'title',
        headerName: t('overview.reports.sales', 'Title'),
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
        heading: t('overview.reports.sales', 'Sales'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.reports.title', 'Hisobotlar'), href: paths.menu.reports.root },
          { name: t('overview.reports.sales', 'Sales'), href: paths.menu.reports.sales.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.reports.sales.new }}
    />
  );
}
