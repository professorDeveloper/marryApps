import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { _suppliers } from 'src/_mock/_warehouse';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView, RenderCellItem } from 'src/components/generic-table-view';

export function SuppliersListView() {
  const { t } = useTranslation('menu');
  const rows = _suppliers;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('overview.warehouse.suppliers', 'Name'),
        flex: 1,
        minWidth: 220,
        renderCell: (params) => <RenderCellItem params={params} imageField="avatarUrl" nameField="name" />,
      },
      { field: 'company', headerName: 'Company', width: 240 },
      { field: 'phone', headerName: 'Phone', width: 160 },
      { field: 'email', headerName: 'Email', width: 240 },
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
            href={paths.menu.warehouse.suppliers.edit(params.row.id)}
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
        heading: t('overview.warehouse.suppliers', 'Suppliers'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Ombor'), href: paths.menu.warehouse.root },
          { name: t('overview.warehouse.suppliers', 'Suppliers'), href: paths.menu.warehouse.suppliers.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.warehouse.suppliers.new }}
    />
  );
}
