import type { IIngredientGroupItem } from 'src/types/ingredient-group';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Button,
    Dialog,
    Typography,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useDeleteIngredientGroup, useGetIngredientGroupsPage } from 'src/actions/ingredient-group';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { CELL_SX } from './deduction/components/utility-data-table/utils';
import { RouterLink } from 'src/routes/components';

export function IngredientGroupListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const { ingredientGroups, ingredientGroupsLoading, pagination } = useGetIngredientGroupsPage({
        search: debouncedSearchQuery,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
    });
    const { deleteIngredientGroup } = useDeleteIngredientGroup();

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<IIngredientGroupItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery]);

    const handleEditGroup = useCallback((id: string) => {
        router.push(paths.menu.ingredients_group.edit(id));
    }, [router]);

    const handleConfirmDelete = useCallback(async () => {
        if (groupToDelete) {
            try {
                await deleteIngredientGroup(groupToDelete);
                toast.success(t('success.deleteSuccess'));
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error(t('error.deleteFailed'));
            } finally {
                setDeleteDialogOpen(false);
                setGroupToDelete(null);
            }
        }
    }, [groupToDelete, deleteIngredientGroup, t]);

    const handleViewGroup = useCallback((group: IIngredientGroupItem) => {
        setSelectedGroup(group);
        setViewModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setViewModalOpen(false);
        setSelectedGroup(null);
    }, []);

    const columns = useMemo(
        () => [
            {
                key: 'name',
                label: t('warehouse.name'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: IIngredientGroupItem) => row?.name ?? '',
                renderCell: ({ row }: { row: IIngredientGroupItem }) => (
                    <Box sx={CELL_SX}>
                        {row.name || '-'}
                    </Box>
                ),
            },
            {
                key: 'color_code',
                label: t('warehouse.color'),
                sortable: false,
                width: '1fr',
                align: 'center' as const,
                getValue: (row: IIngredientGroupItem) => row?.color_code || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const colorCode = value as string;
                    if (!colorCode) {
                        return <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>-</div>;
                    }
                    return (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                                py: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 32,
                                    borderRadius: 1,
                                    bgcolor: colorCode,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                        </Box>
                    );
                },
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: IIngredientGroupItem }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditGroup(row.id);
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setGroupToDelete(row.id);
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
        [t, handleEditGroup, handleViewGroup]
    );

    const renderGroupSpecifications = useCallback((group: IIngredientGroupItem) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.picture_url && (
                <Box
                    component="img"
                    src={group.picture_url}
                    alt={group.name}
                    sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
                />
            )}
            <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.id')}</Typography>
                <Typography variant="body2">{group.id}</Typography>
            </Box>
            <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.name')}</Typography>
                <Typography variant="body2">{group.name}</Typography>
            </Box>
            {group.color_code && (
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.color')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                bgcolor: group.color_code,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        />
                        <Typography variant="body2">{group.color_code}</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    ), [t]);

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
                    persistKey="warehouse-ingredient-groups"
                    data={Array.isArray(ingredientGroups) ? ingredientGroups : []}
                    getRowId={(row: IIngredientGroupItem) => String(row?.id)}
                    columns={columns}
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={pagination?.total || 0}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(p) => setPaginationModel((prev) => ({ ...prev, page: p }))}
                    onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
                    defaultConfig={{
                        order: ['name', 'color_code', 'actions'],
                        visibility: {
                            name: true,
                            color_code: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            color_code: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={() => {}}
                    onRowClick={handleViewGroup}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.menu.ingredients_group.new}
                            size="small"
                        >
                            {t('warehouse.addGroup')}
                        </Button>
                    }
                />
            </DashboardContent>

            <GenericViewModal
                isOpen={viewModalOpen}
                onClose={handleCloseModal}
                title={selectedGroup?.name || t('warehouse.ingredientGroups')}
                data={selectedGroup}
                renderContent={renderGroupSpecifications}
                maxWidth="sm"
                slideDirection="left"
                position="right"
                paperSx={{
                    width: { xs: '100%', sm: '30vw' },
                    maxWidth: { xs: '100%', sm: '30vw' },
                }}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('warehouse.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    {t('warehouse.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        {t('warehouse.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        autoFocus
                    >
                        {t('warehouse.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
