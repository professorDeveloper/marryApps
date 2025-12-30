import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { _settings } from 'src/_mock/_settings';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

export function SettingsListView() {
  const { t } = useTranslation('menu');

  const settings = _settings;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'key', headerName: 'Key', flex: 1, minWidth: 240 },
      { field: 'label', headerName: t('overview.settings.general', 'Label'), width: 240 },
      { field: 'value', headerName: 'Value', width: 160 },
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
            href={paths.menu.settings.edit(params.row.id)}
          />,
        ],
      },
    ],
    [t]
  );

  return (
    <GenericTableView
      data={settings}
      loading={false}
      columns={columns}
      breadcrumbs={{
        heading: t('overview.settings.title', 'Sozlamalar'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.settings.title', 'Sozlamalar'), href: paths.menu.settings.root },
          { name: t('list', 'List') },
        ],
      }}
    />
  );
}
