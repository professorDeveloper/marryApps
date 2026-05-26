import type { ICategory } from 'src/types/category';
import type { DataTableColumn } from 'src/sections/common/data-table/types/types';
import { CELL_SX } from 'src/sections/common/data-table/utils/constants';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { Button , IconButton } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

import { useCategoryData } from './hooks/useCategoryData';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';
import { StorageNameCell } from './components/StorageNameCell';
import { StorageFilter } from 'src/sections/common/data-table/components/StorageFilter';
import { DepartmentFilter } from 'src/sections/common/data-table/components/DepartmentFilter';
import { CategoryGoodsTable } from './components/CategoryGoodsTable';
import { RouterLink } from 'src/routes/components';

/**
 * Category List View Component
 * Uses DataTable component and follows invoice structure patterns
 */
export function CategoryListView() {
    const { t } = useTranslation('menu');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [storageFilterId, setStorageFilterId] = useState('');
    const [departmentFilterId, setDepartmentFilterId] = useState('');

    // Use custom hook for category data management
    const {
        categories,
        totalCount,
        storages,
        departments,
        selectedCategory,
        goodsModalOpen,
        searchQuery,
        sortState,
        handleSearch,
        handlePageChange,
        handleFilterChange,
        handleDelete,
        handleViewGoods,
        handleCloseGoodsModal,
        handleEdit,
        handleSortChange,
    } = useCategoryData();

    // Define DataTable columns
    const columns = useMemo<DataTableColumn<ICategory>[]>(
        () => [
            {
                key: 'category',
                label: t('categories.name'),
                width: '2fr',
                sortable: false,
                filterable: false,
                getValue: (row: ICategory) => row.name || '-',
                renderCell: ({ row }: { row: ICategory }) => (
                    <Box sx={CELL_SX}>
                        {row.name || '-'}
                    </Box>
                ),
            },
            {
                key: 'storage_name',
                label: t('categories.storage'),
                width: '1.2fr',
                sortable: false,
                filterable: false,
                getValue: (row: ICategory) => row,
                renderCell: ({ row }: { row: ICategory }) => (
                    <Box sx={CELL_SX}>
                        <StorageNameCell category={row} />
                    </Box>
                ),
            },
            {
                key: 'department_name',
                label: t('categories.department'),
                width: '1.2fr',
                sortable: false,
                filterable: false,
                getValue: (row) => row.department_name || '-',
                renderCell: ({ row }: { row: ICategory }) => (
                    <Box sx={CELL_SX}>
                        {row.department_name || '-'}
                    </Box>
                ),
            },
            {
                key: 'color_code',
                label: t('categories.color'),
                width: '0.8fr',
                sortable: false,
                getValue: (row) => row.color_code || '-',
                renderCell: ({ row, value }: { row: ICategory; value: unknown }) => {
                    const colorValue = value as string;
                    if (!colorValue) {
                        return (
                            <Box sx={CELL_SX}>
                                -
                            </Box>
                        );
                    }
                    return (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 1
                        }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 32,
                                    borderRadius: '6px',
                                    bgcolor: colorValue,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                            />
                        </Box>
                    );
                },
            },
            {
                key: 'created_at',
                label: t('categories.createdAt'),
                width: '1fr',
                sortable: true,
                getValue: (row) => row.created_at,
                renderCell: ({ row, value }: { row: ICategory; value: unknown }) => {
                    const dateValue = value as string | Date;
                    const parsedDate = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
                    return (
                        <Box sx={CELL_SX}>
                            {parsedDate.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </Box>
                    );
                },
            },
            {
                key: 'actions',
                label: t('actions'),
                width: '0.8fr',
                sortable: false,
                filterable: false,
                getValue: (row) => row,
                renderCell: ({ row }: { row: ICategory }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row);
                            }}
                            sx={{ 
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(row.id);
                            }}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    backgroundColor: 'error.lighter',
                                    color: 'error.dark'
                                }
                            }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, storages, departments, handleViewGoods, handleEdit]
    );

    // Handle delete confirmation
    const handleDeleteClick = (id: string) => {
        setSelectedDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedDeleteId) {
            const success = await handleDelete(selectedDeleteId);
            if (success) {
                toast.success(t('categories.deleteSuccess'));
            } else {
                toast.error(t('categories.deleteError'));
            }
        }
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    // Render function for category goods
    const renderCategoryGoods = useCallback((category: ICategory) => {
        if (!category) return null;
        return <CategoryGoodsTable categoryId={category.id} />;
    }, []);

    // Handle pagination
    const { rowsPerPage } = usePaginationRows();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: rowsPerPage });

    // Sync paginationModel with rowsPerPage when it changes externally
    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
    }, [rowsPerPage]);

    const handlePageChangeInternal = useCallback((page: number, pageSize: number) => {
        setPaginationModel({ page, pageSize });
        handlePageChange(page, pageSize);
    }, [handlePageChange]);

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
                    persistKey="category-list-view"
                    data={categories}
                    getRowId={(row) => String(row.id)}
                    columns={columns}
                    search={{ value: searchQuery, onChange: handleSearch }}
                    onSortChange={handleSortChange}
                    onReset={() => {
                        handleSearch('');
                        handleSortChange({ key: null, dir: null });
                        setStorageFilterId('');
                        setDepartmentFilterId('');
                        handleFilterChange({});
                    }}
                    toolbarActions={
                        <>
                            <StorageFilter
                                storageId={storageFilterId}
                                storages={storages.map((s) => ({ id: s.id, name: s.name }))}
                                onStorageChange={(id) => {
                                    setStorageFilterId(id);
                                    handleFilterChange({ storage_id: id || undefined, department_id: departmentFilterId || undefined });
                                    setPaginationModel((p) => ({ ...p, page: 0 }));
                                }}
                                label={t('categories.storage')}
                            />
                            <DepartmentFilter
                                departmentId={departmentFilterId}
                                departments={departments.map((d) => ({ id: d.id, name: d.name }))}
                                onDepartmentChange={(id) => {
                                    setDepartmentFilterId(id);
                                    handleFilterChange({ storage_id: storageFilterId || undefined, department_id: id || undefined });
                                    setPaginationModel((p) => ({ ...p, page: 0 }));
                                }}
                                label={t('categories.department')}
                            />
                        </>
                    }
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: (page) => handlePageChangeInternal(page, paginationModel.pageSize),
                        onRowsPerPageChange: (pageSize) => handlePageChangeInternal(0, pageSize),
                    }}
                    defaultConfig={{
                        order: ['category', 'storage_name', 'department_name', 'color_code', 'created_at', 'actions'],
                        visibility: {
                            category: true,
                            storage_name: true,
                            department_name: true,
                            color_code: true,
                            created_at: true,
                            actions: true,
                        },
                        widths: {
                            category: '2fr',
                            storage_name: '1.2fr',
                            department_name: '1.2fr',
                            color_code: '0.8fr',
                            created_at: '1fr',
                            actions: '0.8fr',
                        },
                    }}
                    onRowClick={handleViewGoods}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.menu.category.new}
                            size="small"
                        >
                            {t('add')}
                        </Button>
                    }
                    showTotals={false}
                />
            </DashboardContent>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('categories.deleteConfirmation')}</DialogTitle>
                <DialogContent>
                    <p>{t('categories.deleteMessage') as string}</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        {t('delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <GenericViewModal
                isOpen={goodsModalOpen}
                onClose={handleCloseGoodsModal}
                title={`${selectedCategory?.name || ''} - ${selectedCategory?.name_en || 'Goods'}`}
                data={selectedCategory}
                renderContent={renderCategoryGoods}
                maxWidth="lg"
                slideDirection="left"
                position="right"
                paperSx={{
                    width: { xs: '100%', sm: '50vw' },
                    maxWidth: { xs: '100%', sm: '50vw' },
                }}
            />
        </>
    );
}
