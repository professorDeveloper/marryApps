import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Box,
    Paper,
    Table,
    Button,
    Divider,
    Checkbox,
    TableRow,
    useTheme,
    TextField,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    IconButton,
    TableContainer,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

// ============================================================================
// TYPES
// ============================================================================

interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
    quantity?: number;
    picture_url?: string;
}

interface DeductionItem {
    ingredient_id: string;
    quantity: string;
}

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);

// ============================================================================
// COMPONENT
// ============================================================================

interface DeductionsDetailsCalculationProps {
    deductionId?: string;
    storageId?: string;
    actGroupId?: string;
    items?: DeductionItem[];
    isNewDeduction?: boolean;
    onSuccess?: () => void;
    onItemsChange?: (items: DeductionItem[]) => void;
    formData?: {
        date: string;
        status: string;
        storage_id: string;
        description: string;
        act_group_id: string;
    };
}

export function DeductionsDetailsCalculation({
    deductionId,
    storageId,
    actGroupId,
    items: initialItems = [],
    isNewDeduction = false,
    onSuccess,
    onItemsChange,
    formData: parentFormData,
}: DeductionsDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();

    // State
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Load ingredients
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const ingredientsData = await fetcher<BackendResponse<Ingredient[]>>(
                    endpoints.ingredient.list
                );
                setIngredients(Array.isArray(ingredientsData?.data) ? ingredientsData.data : []);
            } catch (error) {
                console.error('Error loading ingredients:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [t]);

    // Initialize transferred items from initialItems prop (only once after ingredients are loaded)
    useEffect(() => {
        if (!initialized && initialItems && initialItems.length > 0 && ingredients.length > 0) {
            const ids = initialItems.map((item) => item.ingredient_id);
            const newQuantities: Record<string, string> = {};
            initialItems.forEach((item) => {
                newQuantities[item.ingredient_id] = item.quantity || '1';
            });
            setTransferredIds(ids);
            setQuantities(newQuantities);
            setInitialized(true);
        }
    }, [initialItems, ingredients, initialized]);

    // Call onItemsChange whenever items change
    useEffect(() => {
        if (onItemsChange) {
            const items = transferredIds.map((id) => ({
                ingredient_id: id,
                quantity: quantities[id] || '1',
            }));
            onItemsChange(items);
        }
    }, [transferredIds, quantities, onItemsChange]);

    // Filter ingredients by search term
    const filteredIngredients = useMemo(
        () =>
            ingredients.filter(
                (ing) =>
                    !transferredIds.includes(ing.id) &&
                    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [ingredients, searchTerm, transferredIds]
    );

    // Transferred items
    const transferredItems = useMemo(
        () => ingredients.filter((ing) => transferredIds.includes(ing.id)),
        [ingredients, transferredIds]
    );

    // Handle transfer
    const handleTransfer = () => {
        const newTransferred = [...transferredIds, ...selectedIds];
        setTransferredIds(newTransferred);
        setSelectedIds([]);
        // Initialize quantities
        const newQuantities = { ...quantities };
        selectedIds.forEach((id) => {
            if (!newQuantities[id]) {
                newQuantities[id] = '1';
            }
        });
        setQuantities(newQuantities);
    };

    // Handle remove
    const handleRemoveItem = (id: string) => {
        setTransferredIds(transferredIds.filter((tid) => tid !== id));
        const newQuantities = { ...quantities };
        delete newQuantities[id];
        setQuantities(newQuantities);
    };

    // Handle quantity change
    const handleQuantityChange = (id: string, value: string) => {
        setQuantities({
            ...quantities,
            [id]: value,
        });
    };

    // Calculate totals
    const calculateTotals = () => {
        let totalQuantity = 0;
        let totalPrice = 0;

        transferredItems.forEach((item) => {
            const qty = parseFloat(quantities[item.id] || '0') || 0;
            const unitPrice = parseFloat(item.price_per_unit) || 0;
            const price = qty * unitPrice;

            totalQuantity += qty;
            totalPrice += price;
        });

        return { totalQuantity, totalPrice };
    };

    const totals = calculateTotals();

    // Handle save
    const handleSave = async () => {
        if (transferredItems.length === 0) {
            toast.error(t('deductions.itemsRequired'));
            return;
        }

        if (!parentFormData?.storage_id) {
            toast.error(t('deductions.storageRequired'));
            return;
        }

        if (!parentFormData?.act_group_id) {
            toast.error(t('deductions.groupRequired'));
            return;
        }

        // For existing deductions, ensure deductionId exists before delegating save
        if (!isNewDeduction && !deductionId) {
            toast.error(t('deductions.deductionIdRequired'));
            return;
        }

        setSaving(true);
        try {
            await onSuccess?.();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error(t('deductions.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Instructions */}
            {/* <Paper sx={{ p: 2, mb: 3, backgroundColor: 'info.lighter' }}>
                <Typography variant="body2" sx={{ color: 'info.dark' }}>
                    {t(
                        'deductions.instructionsInfo',
                        'Select ingredients from the left panel and transfer them to the right using the arrow button'
                    )}
                </Typography>
            </Paper> */}

            {/* Items Selection Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' },
                    gap: 2,
                    alignItems: 'flex-start',
                    mb: 3,
                }}
            >
                {/* LEFT PANEL: Available Ingredients */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {t('deductions.availableIngredients')}
                    </Typography>

                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        fullWidth
                        sx={{ mb: 2 }}
                    />

                    {/* Ingredients List */}
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {filteredIngredients.length === 0 ? (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                {t('deductions.noIngredients')}
                            </Typography>
                        ) : (
                            filteredIngredients.map((ing) => (
                                <Box
                                    key={ing.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                        '&:hover': { backgroundColor: theme.vars.palette.action.hover },
                                    }}
                                >
                                    <Checkbox
                                        checked={selectedIds.includes(ing.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds([...selectedIds, ing.id]);
                                            } else {
                                                setSelectedIds(selectedIds.filter((id) => id !== ing.id));
                                            }
                                        }}
                                        size="small"
                                    />
                                    <Box sx={{ flex: 1, ml: 1 }}>
                                        <Typography variant="subtitle2">{ing.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {t(`units.${ing.measurement}`, { defaultValue: ing.measurement })}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Paper>

                {/* MIDDLE: Transfer Buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleTransfer}
                        disabled={selectedIds.length === 0}
                        endIcon={<ChevronRightIcon />}
                    >
                        {t('common.add')}
                    </Button>
                </Box>

                {/* RIGHT PANEL: Transferred Items */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {t('deductions.selectedItems')} ({transferredItems.length})
                    </Typography>

                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {transferredItems.length === 0 ? (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                {t('deductions.noItemsSelected')}
                            </Typography>
                        ) : (
                            transferredItems.map((item) => (
                                <Paper
                                    key={item.id}
                                    sx={{
                                        p: 2,
                                        mb: 1.5,
                                        backgroundColor: theme.vars.palette.action.hover,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            {item.name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 1,
                                        }}
                                    >
                                        <TextField
                                            size="small"
                                            label={t('deductions.quantity')}
                                            type="number"
                                            value={quantities[item.id] || ''}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            inputProps={{ step: '0.01', min: '0' }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        {t(`units.${item.measurement}`, { defaultValue: item.measurement })}
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />

                                        <TextField
                                            size="small"
                                            label={t('deductions.unitPrice')}
                                            type="number"
                                            disabled
                                            value={item.price_per_unit}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">UZS</InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ mt: 1, textAlign: 'right' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {t('deductions.total')}:{' '}
                                            {formatPrice(
                                                (parseFloat(quantities[item.id] || '0') || 0) *
                                                (parseFloat(item.price_per_unit) || 0)
                                            )}{' '}
                                            UZS
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* BOTTOM: Calculation Table */}
            {transferredItems.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        {t('deductions.summary')}
                    </Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: theme.vars.palette.background.paper }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {t('deductions.ingredient')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {t('deductions.quantity')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {t('deductions.unitPrice')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {t('deductions.total')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transferredItems.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell align="right">
                                            {quantities[item.id] || '0'} {t(`units.${item.measurement}`, { defaultValue: item.measurement })}
                                        </TableCell>
                                        <TableCell align="right">{formatPrice(Number(item.price_per_unit))} UZS</TableCell>
                                        <TableCell align="right">
                                            {formatPrice(
                                                (parseFloat(quantities[item.id] || '0') || 0) *
                                                (parseFloat(item.price_per_unit) || 0)
                                            )}{' '}
                                            UZS
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals Row */}
                                <TableRow sx={{ backgroundColor: theme.vars.palette.action.hover }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                        {t('deductions.total')}
                                    </TableCell>
                                    <TableCell />
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {formatPrice(totals.totalPrice)} UZS
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || transferredItems.length === 0}
                >
                    {saving ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {t('common.saving')}
                        </>
                    ) : (
                        t('common.save')
                    )}
                </Button>
            </Box>
        </Box>
    );
}

export default DeductionsDetailsCalculation;
