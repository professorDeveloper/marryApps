import type {
    Deduction,
    DeductionGroup,
    BackendPagination} from 'src/hooks/use-deductions-api';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Button,
    Dialog,
    useTheme,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
    useDeductionsAPI
} from 'src/hooks/use-deductions-api';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

import {
    DeductionsDetailsModal,
    type DeductionDetailsData,
} from './deductions-details-modal';

interface Storage {
    id: string;
    name: string;
}

interface Ingredient {
    id: string;
    name: string;
}

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
}

// Reverse lookup: find ID (key) from name (value) in a map
const reverseMap = (map: Record<string, string>, name: string): string =>
    Object.entries(map).find(([, v]) => v === name)?.[0] ?? '';

let staticLookupCache: {
    groups: DeductionGroup[];
    storages: Storage[];
    ingredientsMap: Record<string, string>;
} | null = null;

let staticLookupPromise: Promise<{
    groups: DeductionGroup[];
    storages: Storage[];
    ingredientsMap: Record<string, string>;
}> | null = null;

export function DeductionsListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const { getDeductions, getDeductionById, deleteDeduction, getDeductionGroups } = useDeductionsAPI();
    const [deductions, setDeductions] = useState<Deduction[]>([]);
    const [groups, setGroups] = useState<DeductionGroup[]>([]);
    const [storages, setStorages] = useState<Storage[]>([]);
    const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewData, setViewData] = useState<DeductionDetailsData | null>(null);
    const [sortState, setSortState] = useState<{ key: string | null; dir: string | null }>({ key: null, dir: null });
    const [filterValues, setFilterValues] = useState<{ storage_id: string; act_group_id: string; status: string }>({ storage_id: '', act_group_id: '', status: '' });

    const storagesMap = useMemo(
        () =>
            storages.reduce(
                (acc, storage) => ({ ...acc, [storage.id]: storage.name || storage.id }),
                {} as Record<string, string>
            ),
        [storages]
    );

    const groupsMap = useMemo(
        () =>
            groups.reduce(
                (acc, group) => ({ ...acc, [group.id]: group.name || group.id }),
                {} as Record<string, string>
            ),
        [groups]
    );

    // Fetch deductions and groups
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (!staticLookupCache) {
                if (!staticLookupPromise) {
                    staticLookupPromise = Promise.all([
                        getDeductionGroups(),
                        fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
                            data: [],
                        })),
                        fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list).catch(() => ({
                            data: [],
                        })),
                    ]).then(([groupsData, storagesData, ingredientsData]) => {
                        const finalGroups = Array.isArray(groupsData) ? groupsData : [];
                        const finalStorages = Array.isArray(storagesData?.data) ? storagesData.data : [];
                        const finalIngredients = Array.isArray(ingredientsData?.data) ? ingredientsData.data : [];

                        return {
                            groups: finalGroups,
                            storages: finalStorages,
                            ingredientsMap: finalIngredients.reduce(
                                (acc, ingredient) => ({ ...acc, [ingredient.id]: ingredient.name || ingredient.id }),
                                {} as Record<string, string>
                            ),
                        };
                    });
                }

                staticLookupCache = await staticLookupPromise;
            }

            const finalGroups = staticLookupCache?.groups || [];
            const finalStorages = staticLookupCache?.storages || [];
            const finalIngredientsMap = staticLookupCache?.ingredientsMap || {};

            setGroups(finalGroups);
            setStorages(finalStorages);
            setIngredientsMap(finalIngredientsMap);

            // Then load deductions with server-side filters
            const deductionsResponse = await getDeductions({
                expand: 'act_group_id,storage_id',
                limit: paginationModel.pageSize,
                offset: paginationModel.page * paginationModel.pageSize,
                ...(searchQuery ? { search: searchQuery } : {}),
                ...(startDate ? { date_from: dayjs(startDate).format('YYYY-MM-DD') } : {}),
                ...(endDate ? { date_to: dayjs(endDate).format('YYYY-MM-DD') } : {}),
                ...(sortState.key ? { sort_by: sortState.key } : {}),
                ...(sortState.dir && (sortState.dir === 'asc' || sortState.dir === 'desc') ? { sort_order: sortState.dir as 'asc' | 'desc' } : {}),
                ...(filterValues.storage_id ? { storage_id: filterValues.storage_id } : {}),
                ...(filterValues.act_group_id ? { act_group_id: filterValues.act_group_id } : {}),
                ...(filterValues.status ? { status: filterValues.status } : {}),
            });
            const deductionsData = deductionsResponse.items || [];
            const pagination = deductionsResponse.pagination as BackendPagination | undefined;

            // Enrich deductions with storage_name and group_name if not present
            const enrichedDeductions = deductionsData.map(d => {
                const storage = d._expand?.storage_id || finalStorages.find(s => s.id === d.storage_id);
                const group = d._expand?.act_group_id || finalGroups.find(g => g.id === d.act_group_id);

                return {
                    ...d,
                    storage_name: d.storage_name || storage?.name || d.storage_id,
                    group_name: d.group_name || group?.name || d.act_group_id,
                };
            });

            setDeductions(enrichedDeductions);
            setRowCount(pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Continue anyway - deduction object may have storage_name and group_name
        } finally {
            setLoading(false);
        }
    }, [getDeductions, getDeductionGroups, paginationModel.page, paginationModel.pageSize, searchQuery, startDate, endDate, sortState, filterValues]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle delete deduction
    const handleDeleteClick = (id: string) => {
        setSelectedDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDeleteId) return;

        try {
            await deleteDeduction(selectedDeleteId);
            await fetchData();
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    const handleEdit = (row: Deduction) => {
        router.push(`${paths.warehouse.deductions.root}/${(row as any)?.id}/edit`);
    };

    const handleDelete = (row: Deduction) => {
        setSelectedDeleteId((row as any)?.id);
        setDeleteDialogOpen(true);
    };

    const openViewModal = useCallback(
        async (deductionId: string) => {
            setViewOpen(true);
            setViewLoading(true);
            setViewData(null);
            try {
                const details = await getDeductionById(deductionId);
                setViewData((details as DeductionDetailsData) || null);
            } finally {
                setViewLoading(false);
            }
        },
        [getDeductionById]
    );

    const closeViewModal = useCallback(() => {
        setViewOpen(false);
        setViewData(null);
    }, []);

    const applyPeriod = useCallback((period: 'day' | 'week' | 'month' | 'year') => {
        setActivePeriod(period);
        const now = dayjs();
        let nextStart: Date;
        let nextEnd: Date;

        switch (period) {
            case 'day':
                nextStart = now.startOf('day').toDate();
                nextEnd = now.endOf('day').toDate();
                break;
            case 'week':
                nextStart = now.startOf('week').toDate();
                nextEnd = now.endOf('day').toDate();
                break;
            case 'month':
                nextStart = now.startOf('month').toDate();
                nextEnd = now.endOf('day').toDate();
                break;
            case 'year':
                nextStart = now.startOf('year').toDate();
                nextEnd = now.endOf('day').toDate();
                break;
        }

        setStartDate(nextStart);
        setEndDate(nextEnd);
    }, []);

    // Format date
    const formatDate = (dateString: string): string => new Date(dateString).toLocaleDateString('uz-UZ');

    // Format price
    const formatPrice = (price: string | number): string => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const proColumns = useMemo(
        () => [
            {
                key: 'storage_id',
                label: t('deductions.storage', 'Storage'),
                sortable: true,
                filter: { type: 'multi' as const, options: Object.values(storagesMap) },
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: Deduction) =>
                    (row as any)?._expand?.storage_id?.name ||
                    (row as any)?.storage_name ||
                    storagesMap[(row as any)?.storage_id] ||
                    (row as any)?.storage_id ||
                    '',
            },
            {
                key: 'act_group_id',
                label: t('deductions.group', 'Group'),
                sortable: true,
                filter: { type: 'multi' as const, options: Object.values(groupsMap) },
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: Deduction) =>
                    (row as any)?._expand?.act_group_id?.name ||
                    (row as any)?.group_name ||
                    groupsMap[(row as any)?.act_group_id] ||
                    (row as any)?.act_group_id ||
                    '',
            },
            {
                key: 'description',
                label: t('deductions.description', 'Description'),
                sortable: true,
                filterable: true,
                editable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: Deduction) => (row as any)?.description ?? '',
            },
            {
                key: 'balance',
                label: t('deductions.balance', 'Balance'),
                sortable: true,
                filterable: true,
                align: 'left' as const,
                mono: true,
                width: '2fr',
                getValue: (row: Deduction) => Number((row as any)?.balance ?? 0),
                renderCell: ({ value }: { value: unknown }) => formatPrice(Number(value ?? 0)),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'status',
                label: t('deductions.status', 'Status'),
                sortable: true,
                filter: { type: 'multi' as const, options: ['active', 'draft'] },
                width: '0.75fr',
                align: 'left' as const,
                getValue: (row: Deduction) => String((row as any)?.status ?? ''),
                renderCell: ({ value }: { value: unknown }) => (
                    <Box
                        sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 0.75,
                            border: '1px solid',
                            borderColor: (value ?? '') === 'active' ? theme.vars.palette.success.dark : theme.vars.palette.warning.dark,
                            backgroundColor:
                                (value ?? '') === 'active'
                                    ? 'rgba(34, 197, 94, 0.10)'
                                    : 'rgba(245, 158, 11, 0.10)',
                            color:
                                (value ?? '') === 'active'
                                    ? theme.vars.palette.success.light
                                    : theme.vars.palette.warning.light,
                            fontSize: 12,
                            fontWeight: 700,
                            textAlign: 'center',
                            minWidth: 72,
                        }}
                    >
                        {String(value ?? '')}
                    </Box>
                ),
            },
            {
                key: 'date',
                label: t('deductions.date', 'Date'),
                sortable: true,
                filterable: true,
                mono: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: Deduction) => formatDate(String((row as any)?.date ?? '')),
            },
            {
                key: 'actions',
                label: t('actions', 'Actions'),
                sortable: false,
                filterable: false,
                width: '1fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: Deduction }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(row)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(row)}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, storagesMap, groupsMap, theme]
    );

    return (
        <>
           
            {/* ProAccountant utility table preview (wired for visibility) */}
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
                    persistKey="warehouse-deductions-utility"
                    data={deductions}
                    getRowId={(row: Deduction) => String((row as any)?.id)}
                    columns={proColumns}
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={rowCount}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(p) => {
                        setPaginationModel((prev) => ({ ...prev, page: p }));
                    }}
                    onRowsPerPageChange={(size) => {
                        setPaginationModel({ page: 0, pageSize: size });
                    }}
                    onSortChange={(sort) => {
                        setSortState({ key: sort.key, dir: sort.dir });
                    }}
                    onFiltersChange={(fs: Record<string, any>) => {
                        const storageName = (fs.storage_id?.value as string[])?.[0];
                        const groupName = (fs.act_group_id?.value as string[])?.[0];
                        const statusValue = (fs.status?.value as string[])?.[0];

                        // Map display names back to IDs using the reverseMap helper
                        const storageId = storageName ? reverseMap(storagesMap, storageName) : '';
                        const groupId = groupName ? reverseMap(groupsMap, groupName) : '';

                        setFilterValues({ storage_id: storageId, act_group_id: groupId, status: statusValue || '' });
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    defaultConfig={{
                        order: ['storage_id', 'act_group_id', 'description', 'balance', 'status', 'date', 'actions'],
                        visibility: {
                            storage_id: true,
                            act_group_id: true,
                            description: true,
                            balance: true,
                            status: true,
                            date: true,
                            actions: true,
                        },
                        widths: { 
                            storage_id: '1.5fr',
                            act_group_id: '1.2fr', 
                            description: '2fr',
                            balance: '2fr',
                            status: '0.75fr',
                            date: '1fr',
                            actions: '0.5fr'
                        },
                    }}
                    onReset={() => {
                        setSearchQuery('');
                        setFilterValues({ storage_id: '', act_group_id: '', status: '' });
                        setSortState({ key: null, dir: null });
                        setPaginationModel({ page: 0, pageSize: 20 });
                        setStartDate(new Date());
                        setEndDate(new Date());
                        setActivePeriod('month');
                    }}
                    showPeriodPicker
                    periodPickerProps={{
                        startDate,
                        endDate,
                        onStartDateChange: setStartDate,
                        onEndDateChange: setEndDate,
                    }}
                    showPeriodButtons
                    periodButtonProps={{
                        activePeriod,
                        onPeriodChange: applyPeriod,
                    }}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            onClick={() => router.push(paths.warehouse.deductions.new)}
                            size="small"
                        >
                            {t('deductions.addNew', 'Add New Deduction')}
                        </Button>
                    }
                    batchActions={[
                        {
                            label: t('common.export', 'Export'),
                            icon: <Iconify icon="solar:notes-bold-duotone" width={18} />,
                            onClick: (rows: Deduction[]) => {
                                // temporary: makes it easy to confirm selection UX
                                 
                                console.log('selected deductions', rows);
                            },
                        },
                    ]}
                  
                    onCellEdit={async ({ row, key, value }) => {
                        // temporary: prove inline editing; real persistence can be wired to API later
                         
                        console.log('edit', { id: (row as any)?.id, key, value });
                    }}
                />
            </DashboardContent>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
                <DialogContent>
                    {t('common.deleteMessage', 'Are you sure you want to delete this deduction?')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <DeductionsDetailsModal
                isOpen={viewOpen}
                onClose={closeViewModal}
                loading={viewLoading}
                data={viewData}
                storagesMap={storagesMap}
                groupsMap={groupsMap}
                ingredientsMap={ingredientsMap}
            />
        </>
    );
}
