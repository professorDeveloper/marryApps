import type { GridColDef } from '@mui/x-data-grid';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { Label } from 'src/components/label';
import { GenericTableView } from 'src/components/generic-table-view';
import { fDateTime } from 'src/utils/format-time';

export function ConnectedDeviceListView() {
  const { t } = useTranslation('menu');

  // Demo ma'lumotlar - keyin API dan keladi
  const rows: any[] = [
    {
      id: '1',
      connection_date: '2024-01-15T10:30:00',
      name: 'John Doe',
      phone_type: 'Android',
      active: true,
    },
    {
      id: '2',
      connection_date: '2024-01-20T14:45:00',
      name: 'Jane Smith',
      phone_type: 'iOS',
      active: false,
    },
    {
      id: '3',
      connection_date: '2024-01-25T09:15:00',
      name: 'Bob Johnson',
      phone_type: 'Android',
      active: true,
    },
    {
      id: '4',
      connection_date: '2024-02-01T16:20:00',
      name: 'Alice Williams',
      phone_type: 'iOS',
      active: true,
    },
  ];

  const handleToggle = useCallback((id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    console.log('Toggle status:', id, newStatus ? 'Yoqildi' : "O'chirildi");
    // Bu yerda API chaqiruvi bo'lishi kerak
  }, []);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'connection_date',
        headerName: 'Ulangan sana',
        width: 200,
        renderCell: (params) => {
          return fDateTime(params.row.connection_date, 'DD/MM/YYYY HH:mm');
        },
      },
      {
        field: 'name',
        headerName: 'Ism',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'phone_type',
        headerName: 'Mobil telefon turi',
        width: 180,
        renderCell: (params) => {
          const phoneType = params.row.phone_type;
          return (
            <Label
              variant="soft"
            // color={phoneType === 'iOS' ? 'primary' : 'success'}
            >
              {phoneType}
            </Label>
          );
        },
      },
      {
        field: 'actions',
        headerName: 'Ilovani bu qurilmadan ochirish',
        width: 250,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const isActive = params.row.active !== false; // default true

          return (
            <Tooltip title={isActive ? "Ilovani bu qurilmadan o'chirish" : "Ilovani bu qurilmada yoqish"} sx={{ m: 3, p: 1, borderRadius: '12px' }}>
              <Button
                variant="contained"
                color={isActive ? 'error' : 'inherit'}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(params.row.id, isActive);
                }}
              >
                {isActive ? "O'chirish" : 'Yoqish'}
              </Button>
            </Tooltip>
          );
        },
      },
    ],
    [t, handleToggle]
  );

  return (
    <GenericTableView
      data={rows}
      loading={false}
      columns={columns}
      breadcrumbs={{
        heading: t('overview.settings.title', 'Settings'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.settings.title', 'Sozlamalar'), href: paths.settings.root },
        ],
      }}
      // addButton={{ label: t('add'), href: paths.settings.profile.new }}
      hideFilters={true}
      hideCheckboxes={true}
    />
  );
}
