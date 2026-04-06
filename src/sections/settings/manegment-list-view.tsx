import type { GridColDef } from '@mui/x-data-grid';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { GenericTableView } from 'src/components/generic-table-view';

export function ManagementListView() {
  const { t } = useTranslation('menu');

  // Demo ma'lumotlar - keyin API dan keladi
  const rows: any[] = [
    {
      id: '1',
      connection_date: '2024-01-15T10:30:00',
      name: 'John Doe',
      phone_type: 'A',
      indefactor: 'Ha',
      active: true,
    },
    {
      id: '2',
      connection_date: '2024-01-20T14:45:00',
      name: 'Jane Smith',
      phone_type: 'A',
      indefactor: 'Yoq',
      active: false,
    },
    {
      id: '3',
      connection_date: '2024-01-25T09:15:00',
      name: 'Bob Johnson',
      phone_type: 'B',
      indefactor: 'Ha',
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
        field: 'name',
        headerName: 'Nomi',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'connection_date',
        headerName: 'Oxirgi sinxronlash sanasi',
        width: 200,
        renderCell: (params) => fDateTime(params.row.connection_date, 'DD/MM/YYYY HH:mm'),
      },
      {
        field: 'phone_type',
        headerName: 'Hisob indikatori',
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
        field: 'indefactor',
        headerName: 'Hisob indikatori',
        width: 180,
        renderCell: (params) => {
          const phoneType = params.row.indefactor;
          return (
            <Box
              sx={{
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {phoneType === 'Ha' ? 'Ha' : 'Yoq'}
            </Box>
          );
        }
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
        heading: t('overview.settings.title', 'Profile'),
        links: [
          { name: t('app'), href: paths.menu.root },
          { name: t('overview.settings.title', 'Sozlamalar'), href: paths.settings.root },
        ],
      }}
      // addButton={{ label: t('add'), href: paths.settings.profile.new }}
      hideFilters
      hideCheckboxes
    />
  );
}
