import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

export function LocationsListView() {
    const { t } = useTranslation('menu');
    const rows: any[] = [];

    const columns = useMemo(
        () => [
            {
                key: 'code',
                label: 'Code',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.code ?? '',
            },
            {
                key: 'name',
                label: t('overview.warehouse.locations'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.name ?? '',
            },
            {
                key: 'capacity',
                label: 'Capacity',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.capacity ?? '',
            },
        ],
        [t]
    );

    return (
        <DashboardContent
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100vh',
                '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
                '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
            }}
        >
            <DeductionUtilityDataTable
                persistKey="warehouse-locations"
                data={rows}
                getRowId={(row: any) => String(row?.id)}
                columns={columns}
                defaultConfig={{
                    order: ['code', 'name', 'capacity'],
                    visibility: {
                        code: true,
                        name: true,
                        capacity: true,
                    },
                    widths: {
                        code: '1fr',
                        name: '2fr',
                        capacity: '1fr',
                    },
                }}
                onReset={() => {}}
                headerActions={
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        component={RouterLink}
                        href={paths.warehouse.locations.new}
                        size="small"
                    >
                        {t('add')}
                    </Button>
                }
            />
        </DashboardContent>
    );
}
