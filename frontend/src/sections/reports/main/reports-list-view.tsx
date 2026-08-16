import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

export function ReportsListView() {
  const { t } = useTranslation('menu');

  const reports: any[] = [];

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'title', headerName: t('overview.reports.sales'), flex: 1, minWidth: 240 },
      { field: 'type', headerName: t('overview.reports.custom'), width: 140, renderCell: (params) => <span>{t(`overview.reports.${params.value}`)}</span> },
      { field: 'createdAt', headerName: 'Date', width: 160 },
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
      data={reports}
      loading={false}
      columns={columns}
      breadcrumbs={{
        heading: t('overview.reports.title'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.reports.title'), href: paths.menu.reports.root },
          { name: t('list') },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.reports.new }}
    />
  );
}
