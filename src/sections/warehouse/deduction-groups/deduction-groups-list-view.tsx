import type { DeductionGroup } from 'src/hooks/use-deductions-api';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import {
    Box,
    Button,
    Dialog,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDeductionsAPI } from 'src/hooks/use-deductions-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { RouterLink } from 'src/routes/components';

export function DeductionGroupsListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();

    const { getDeductionGroups, deleteDeductionGroup } = useDeductionsAPI();

    const [groups, setGroups] = useState<DeductionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const fetchGroups = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDeductionGroups();
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
            toast.error(t('deductions.loadError'));
        } finally {
            if (!silent) setLoading(false);
        }
    }, [getDeductionGroups, t]);

    const [mounted, setMounted] = useState(false);
    if (!mounted) {
        setMounted(true);
        fetchGroups();
    }

    const handleDeleteConfirm = async () => {
        if (!selectedGroupId) return;

        try {
            await deleteDeductionGroup(selectedGroupId);
            setDeleteDialogOpen(false);
            setSelectedGroupId(null);
            toast.success(t('deductions.groupDeleted'));
            await fetchGroups({ silent: true });
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const columns = useMemo(
        () => [
            {
                key: 'name',
                label: t('deductions.groupName'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: DeductionGroup) => row?.name ?? '',
            },
            {
                key: 'created_at',
                label: t('deductions.createdAt'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: DeductionGroup) =>
                    row?.created_at
                        ? new Date(row.created_at).toLocaleDateString('uz-UZ')
                        : '',
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.5fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: DeductionGroup }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => router.push(paths.warehouse.deductionGroups.edit(String(row.id)))}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setSelectedGroupId(String(row.id));
                                setDeleteDialogOpen(true);
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, router]
    );

    const tableData = useMemo(() => {
        const base = groups.map((group, idx) => ({ ...group, id: group.id || `group-${idx}` }));
        if (!searchQuery.trim()) return base;
        const q = searchQuery.toLowerCase();
        return base.filter((g) => g.name?.toLowerCase().includes(q));
    }, [groups, searchQuery]);

    return (
        <>
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
                    persistKey="warehouse-deduction-groups"
                    data={tableData}
                    getRowId={(row: DeductionGroup) => String(row?.id)}
                    columns={columns}
                    search={{ value: searchQuery, onChange: setSearchQuery }}
                    defaultConfig={{
                        order: ['name', 'created_at', 'actions'],
                        visibility: {
                            name: true,
                            created_at: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            created_at: '1.5fr',
                            actions: '0.5fr',
                        },
                    }}
                    onReset={() => {}}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.warehouse.deductionGroups.new}
                            size="small"
                        >
                            {t('deductions.addGroup')}
                        </Button>
                    }
                />
            </DashboardContent>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('deductions.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    <p>
                        {t(
                            'deductions.deleteGroupMessage',
                            'Are you sure you want to delete this group?'
                        )}
                    </p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
