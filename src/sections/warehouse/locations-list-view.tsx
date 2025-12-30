import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { _locations } from 'src/_mock/_warehouse';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

export function LocationsListView() {
  const { t } = useTranslation('menu');
  const rows = _locations;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'code', headerName: 'Code', width: 140 },
      { field: 'name', headerName: t('overview.warehouse.locations', 'Name'), flex: 1, minWidth: 220 },
      { field: 'capacity', headerName: 'Capacity', width: 140 },
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
            href={paths.menu.warehouse.locations.edit(params.row.id)}
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
        heading: t('overview.warehouse.locations', 'Locations'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.menu.warehouse.root },
          { name: t('overview.warehouse.locations', 'Locations'), href: paths.menu.warehouse.locations.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.warehouse.locations.new }}
    />
  );
}
