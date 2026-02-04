import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    useTheme,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { useDeductionsAPI, DeductionGroup } from 'src/hooks/use-deductions-api';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { toast } from 'sonner';

export function DeductionGroupsListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();

    const { getDeductionGroups, createDeductionGroup, deleteDeductionGroup } =
        useDeductionsAPI();

    const [groups, setGroups] = useState<DeductionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Fetch groups
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDeductionGroups();
            setGroups(data);
        } catch (error) {
            console.error('Error loading groups:', error);
            toast.error(t('deductions.loadError', 'Failed to load groups'));
        } finally {
            setLoading(false);
        }
    }, [getDeductionGroups, t]);

    // Load data on mount
    const [mounted, setMounted] = useState(false);
    if (!mounted) {
        setMounted(true);
        fetchGroups();
    }

    // Handle delete
    const handleDeleteClick = (id: string) => {
        setSelectedGroupId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedGroupId) return;

        try {
            await deleteDeductionGroup(selectedGroupId);
            setGroups(groups.filter((g) => g.id !== selectedGroupId));
            setDeleteDialogOpen(false);
            setSelectedGroupId(null);
            toast.success(t('deductions.groupDeleted', 'Group deleted successfully'));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('deductions.groupName', 'Group Name'),
                flex: 1,
                minWidth: 200,
                renderCell: (params) => <Box sx={{ mt: 2, mb: 2 }}>{params.row.name}</Box>,
            },
            {
                field: 'created_at',
                headerName: t('deductions.createdAt', 'Created At'),
                // flex: 1,
                minWidth: 300,
                renderCell: (params) =>
                    new Date(params.row.created_at).toLocaleDateString('uz-UZ'),
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
                    // <CustomGridActionsCellItem
                    //     showInMenu
                    //     label={t('common.view', 'View')}
                    //     icon={<Iconify icon="solar:eye-bold" />}
                    //     onClick={() => router.push(paths.warehouse.deductionGroups.edit(String(params.id)))}
                    // />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('common.edit', 'Edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => router.push(paths.warehouse.deductionGroups.edit(String(params.id)))}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        showInMenu
                        label={t('common.delete', 'Delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(String(params.id))}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [t, theme]
    );

    return (
        <>
            <GenericTableView
                data={groups.map((group, idx) => ({ ...group, id: group.id || `group-${idx}` }))}
                columns={columns}
                loading={loading}
                breadcrumbs={{
                    heading: t('deductions.groups', 'Deduction Groups'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        // { name: t('warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                        { name: t('deductions.title', 'Deductions'), href: paths.warehouse.deductions.root },
                        { name: t('deductions.groups', 'Groups'), href: paths.warehouse.deductionGroups.root },
                    ],
                }}
                addButton={{
                    label: t('deductions.addGroup', 'Add Group'),
                    href: paths.warehouse.deductionGroups.new,
                }}
                onDeleteRow={handleDeleteClick}
            // onRowClick={(id: string) => {
            //     router.push(paths.warehouse.deductionGroups.edit(id));
            // }}
            />

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('deductions.deleteConfirm', 'Confirm Delete')}</DialogTitle>
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
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                    >
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
