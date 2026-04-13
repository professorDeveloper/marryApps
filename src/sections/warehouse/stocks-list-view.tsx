import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Box } from '@mui/material';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

export function StocksListView() {
    const { t } = useTranslation('menu');
    const rows: any[] = [];

    const columns = useMemo(
        () => [
            {
                key: 'sku',
                label: 'SKU',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.sku ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        fontWeight: 400
                    }}>
                        {row?.sku ?? '-'}
                    </Box>
                ),
            },
            {
                key: 'name',
                label: t('overview.warehouse.stocks', 'Name'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.name ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        fontWeight: 400
                    }}>
                        {row?.name ?? '-'}
                    </Box>
                ),
            },
            {
                key: 'quantity',
                label: 'Quantity',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.quantity ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        fontWeight: 400
                    }}>
                        {row?.quantity ?? '-'}
                    </Box>
                ),
            },
            {
                key: 'location',
                label: t('overview.warehouse.locations', 'Location'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.location ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        fontWeight: 400
                    }}>
                        {row?.location ?? '-'}
                    </Box>
                ),
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
                persistKey="warehouse-stocks"
                data={rows}
                getRowId={(row: any) => String(row?.id)}
                columns={columns}
                defaultConfig={{
                    order: ['sku', 'name', 'quantity', 'location'],
                    visibility: {
                        sku: true,
                        name: true,
                        quantity: true,
                        location: true,
                    },
                    widths: {
                        sku: '1fr',
                        name: '2fr',
                        quantity: '1fr',
                        location: '1fr',
                    },
                }}
                onReset={() => {}}
                headerActions={
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mingcute:add-line" />}
                        href={paths.warehouse.stocks.new}
                        size="small"
                    >
                        {t('add')}
                    </Button>
                }
            />
        </DashboardContent>
    );
}
