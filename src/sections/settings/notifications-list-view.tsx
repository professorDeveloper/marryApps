import type { GridColDef } from '@mui/x-data-grid';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { _settingsNotifications } from 'src/_mock/_settings';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

export function SettingsNotificationsListView() {
  const { t } = useTranslation('menu');
  const rows = _settingsNotifications;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'key', headerName: 'Key', flex: 1, minWidth: 240 },
      { field: 'label', headerName: t('overview.settings.notifications', 'Label'), width: 240 },
      {
        field: 'value',
        headerName: 'Value',
        width: 160,
        renderCell: (params) => {
          const val = params.row.value;
          if (typeof val === 'boolean') {
            return <Label variant="soft" color={val ? 'success' : 'default'}>{String(val)}</Label>;
          }
          return <span>{String(val)}</span>;
        },
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
            href={paths.menu.settings.notifications.edit(params.row.id)}
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
        heading: t('overview.settings.notifications', 'Notifications'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.settings.title', 'Sozlamalar'), href: paths.menu.settings.root },
          { name: t('overview.settings.notifications', 'Notifications'), href: paths.menu.settings.notifications.root },
        ],
      }}
      addButton={{ label: t('add'), href: paths.menu.settings.notifications.new }}
    />
  );
}
