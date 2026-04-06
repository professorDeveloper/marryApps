import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Box,
    Paper,
    Table,
    Alert,
    Button,
    Dialog,
    Divider,
    Checkbox,
    TableRow,
    useTheme,
    TextField,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    DialogContent,
    TableContainer,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks/use-router';

import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';

// --- TYPES ---
interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
    quantity?: number;
}

interface InvoiceDetailItem {
    ingredient_id: string;
    ingredient_name?: string;
    quantity: number;
    price_per_unit: number;
    price: number;
    measurement?: string;
}

interface InvoiceDetailsCalculationProps {
    invoiceId: string;
    invoiceData?: Record<string, any>; // Invoice data for batch creation
    onSuccess?: () => void;
    onDetailsChange?: (details: any[]) => void; // Callback to pass details to parent
    isNewInvoice?: boolean; // Flag to indicate if we're creating new invoice
    persistedDetails?: any[]; // Details data from parent to restore
    formData?: Record<string, any>; // Invoice form data from Tab 1
    onSaveInvoice?: (formData: Record<string, any>, details?: any[]) => Promise<void>; // Callback to save invoice
}

const formatPrice = (price: number) => {
    const formatted = Math.round(price * 100) / 100;
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(formatted);
};

// Format number to 2 decimal places
const formatNumber = (num: number): number => Math.round(num * 100) / 100;

const parseInputNumber = (value: string): number | null => {
    if (value.trim() === '') {
        return null;
    }

    const parsedValue = parseFloat(value);
    if (!Number.isFinite(parsedValue)) {
        return null;
    }

    return formatNumber(parsedValue);
};

export function InvoiceDetailsCalculation({ invoiceId, onSuccess, onDetailsChange, isNewInvoice, persistedDetails, formData, onSaveInvoice }: InvoiceDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const { getIngredients } = useInvoiceDetailsAPI();
    const { updateInvoiceDetailsBatch } = useInvoiceAPI();
    const router = useRouter();

    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);

    // Left panel (available ingredients)
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Middle: quantity inputs
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Right panel (transferred items)
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [pricesPerUnit, setPricesPerUnit] = useState<Record<string, number>>({});
    const [showCalculation, setShowCalculation] = useState(false);

    // Search for right panel
    const [rightSearchTerm, setRightSearchTerm] = useState('');

    // Right panel - checkboxes for selection and bulk delete
    const [rightSelectedIds, setRightSelectedIds] = useState<string[]>([]);

    const prevCalculationsRef = useRef<string>('');
    const hydratedPersistedSnapshotRef = useRef<string>('');

    const localBatchData = useMemo(() => {
        if (transferredIds.length === 0) {
            return [];
        }

        return [...transferredIds]
            .sort()
            .map((id) => ({
                ingredient_id: id,
                quantity: quantities[id] ?? 0,
                price_per_unit: pricesPerUnit[id] ?? 0,
                price: prices[id] ?? 0,
            }));
    }, [transferredIds, quantities, pricesPerUnit, prices]);

    const localBatchSnapshot = useMemo(() => JSON.stringify(localBatchData), [localBatchData]);

    // Load ingredients
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getIngredients();
                setIngredients(data || []);
            } catch (error) {
                console.error('Error loading ingredients:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [getIngredients, t]);

    // Restore persisted details only when parent data actually changes.
    useEffect(() => {
        if (!persistedDetails) return;

        const incomingById = new Map<string, any>();
        persistedDetails.forEach((detail) => {
            const ingredientId = String(detail.ingredient_id || detail.id || '');
            if (!ingredientId || incomingById.has(ingredientId)) {
                return;
            }

            incomingById.set(ingredientId, {
                ingredient_id: ingredientId,
                quantity: Number(detail.quantity) || 0,
                price_per_unit: Number(detail.price_per_unit) || 0,
                price: Number(detail.price) || 0,
            });
        });

        const incomingSnapshot = JSON.stringify(
            [...incomingById.values()].sort((a, b) => a.ingredient_id.localeCompare(b.ingredient_id))
        );

        const localSnapshot = localBatchSnapshot;

        if (
            incomingSnapshot === hydratedPersistedSnapshotRef.current ||
            (isNewInvoice &&
                (incomingSnapshot === prevCalculationsRef.current ||
                    incomingSnapshot === localSnapshot))
        ) {
            return;
        }

        if (incomingById.size === 0) {
            hydratedPersistedSnapshotRef.current = incomingSnapshot;
            setTransferredIds([]);
            setQuantities({});
            setPricesPerUnit({});
            setPrices({});
            setShowCalculation(false);
            setSelectedIds([]);
            return;
        }

        const newTransferredIds: string[] = [];
        const newQuantities: Record<string, number> = {};
        const newPricesPerUnit: Record<string, number> = {};
        const newPrices: Record<string, number> = {};

        incomingById.forEach((detail, ingredientId) => {
            newTransferredIds.push(ingredientId);
            newQuantities[ingredientId] = detail.quantity;
            newPricesPerUnit[ingredientId] = detail.price_per_unit;
            newPrices[ingredientId] = detail.price;
        });

        hydratedPersistedSnapshotRef.current = incomingSnapshot;
        setTransferredIds(newTransferredIds);
        setQuantities(newQuantities);
        setPricesPerUnit(newPricesPerUnit);
        setPrices(newPrices);
        setShowCalculation(true);
        setSelectedIds([]);
    }, [persistedDetails, isNewInvoice, localBatchSnapshot]);

    // Update parent whenever details change (for persistence)
    useEffect(() => {
        if (!isNewInvoice || !onDetailsChange) {
            return;
        }

        // Only call if data actually changed (prevent infinite loops)
        const lastCall = prevCalculationsRef.current;
        if (lastCall !== localBatchSnapshot) {
            prevCalculationsRef.current = localBatchSnapshot;
            onDetailsChange(localBatchData);
        }
    }, [isNewInvoice, onDetailsChange, localBatchData, localBatchSnapshot]);

    // Handle toggle checkbox in left panel
    const handleToggle = (id: string) => {
        const currentIndex = selectedIds.indexOf(id);
        const newChecked = [...selectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
            setQuantities((prev) => ({ ...prev, [id]: 1 }));
        } else {
            newChecked.splice(currentIndex, 1);
            const newQuantities = { ...quantities };
            delete newQuantities[id];
            setQuantities(newQuantities);
        }

        setSelectedIds(newChecked);
    };

    // Handle quantity change
    const handleQuantityChange = (id: string, value: string) => {
        const qty = parseInputNumber(value);
        setQuantities((prev) => {
            const next = { ...prev };
            if (qty === null) {
                delete next[id];
            } else {
                next[id] = qty;
            }
            return next;
        });

        if (qty === null || qty <= 0) return;

        const pricePerUnit = pricesPerUnit[id];
        const totalPrice = prices[id];

        // If price_per_unit exists, auto-calculate price
        if (pricePerUnit > 0) {
            const calculatedPrice = formatNumber(qty * pricePerUnit);
            setPrices((prev) => ({
                ...prev,
                [id]: calculatedPrice,
            }));
        }
        // If price exists, auto-calculate price_per_unit
        else if (totalPrice > 0) {
            const calculatedPricePerUnit = formatNumber(totalPrice / qty);
            setPricesPerUnit((prev) => ({
                ...prev,
                [id]: calculatedPricePerUnit,
            }));
        }
    };

    // Handle price per unit change
    const handlePricePerUnitChange = (id: string, value: string) => {
        const pricePerUnit = parseInputNumber(value);
        setPricesPerUnit((prev) => {
            const next = { ...prev };
            if (pricePerUnit === null) {
                delete next[id];
            } else {
                next[id] = pricePerUnit;
            }
            return next;
        });

        if (pricePerUnit === null || pricePerUnit === 0) return;

        const qty = quantities[id] || 0;
        const totalPrice = prices[id] || 0;

        // If quantity exists, auto-calculate price
        if (qty > 0) {
            const calculatedPrice = formatNumber(qty * pricePerUnit);
            setPrices((prev) => ({
                ...prev,
                [id]: calculatedPrice,
            }));
        }
        // If price exists, auto-calculate quantity
        else if (totalPrice > 0) {
            const calculatedQty = formatNumber(totalPrice / pricePerUnit);
            setQuantities((prev) => ({
                ...prev,
                [id]: calculatedQty,
            }));
        }
    };

    // Handle total price change
    const handleTotalPriceChange = (id: string, value: string) => {
        const totalPrice = parseInputNumber(value);
        setPrices((prev) => {
            const next = { ...prev };
            if (totalPrice === null) {
                delete next[id];
            } else {
                next[id] = totalPrice;
            }
            return next;
        });

        if (totalPrice === null || totalPrice === 0) return;

        const qty = quantities[id] || 0;
        const pricePerUnit = pricesPerUnit[id] || 0;

        // If quantity exists, auto-calculate price_per_unit
        if (qty > 0) {
            const calculatedPricePerUnit = formatNumber(totalPrice / qty);
            setPricesPerUnit((prev) => ({
                ...prev,
                [id]: calculatedPricePerUnit,
            }));
        }
        // If price_per_unit exists, auto-calculate quantity
        else if (pricePerUnit > 0) {
            const calculatedQty = formatNumber(totalPrice / pricePerUnit);
            setQuantities((prev) => ({
                ...prev,
                [id]: calculatedQty,
            }));
        }
    };

    // Auto-calculate total price
    const calculateTotalPrice = (id: string): number => {
        const qty = quantities[id] || 0;
        const pricePerUnit = pricesPerUnit[id] || 0;
        if (pricePerUnit > 0) {
            return qty * pricePerUnit;
        }
        return prices[id] || 0;
    };

    // Auto-calculate price per unit
    const calculatePricePerUnit = (id: string): number => {
        const qty = quantities[id] || 0;
        const totalPrice = prices[id] || 0;
        if (qty > 0) {
            return totalPrice / qty;
        }
        return pricesPerUnit[id] || 0;
    };

    // Auto-calculate quantity
    const calculateQuantity = (id: string): number => {
        const totalPrice = prices[id] || 0;
        const pricePerUnit = pricesPerUnit[id] || 0;
        if (pricePerUnit > 0) {
            return totalPrice / pricePerUnit;
        }
        return quantities[id] || 0;
    };

    // Move right
    const handleMoveRight = async () => {
        if (selectedIds.length > 0) {
            const newIds = selectedIds.filter((id) => !transferredIds.includes(id));
            setTransferredIds([...transferredIds, ...newIds]);
            setSelectedIds([]);
            setShowCalculation(true);
        }
    };

    // Move left - delete selected items or all if none selected
    const handleMoveLeft = () => {
        if (rightSelectedIds.length > 0) {
            // Delete only selected items
            setTransferredIds((prev) =>
                prev.filter((item) => !rightSelectedIds.includes(item))
            );

            // Clear quantities, prices for deleted items
            const newQuantities = { ...quantities };
            const newPrices = { ...prices };
            const newPricesPerUnit = { ...pricesPerUnit };

            rightSelectedIds.forEach((id) => {
                delete newQuantities[id];
                delete newPrices[id];
                delete newPricesPerUnit[id];
            });

            setQuantities(newQuantities);
            setPrices(newPrices);
            setPricesPerUnit(newPricesPerUnit);
            setRightSelectedIds([]);

            // Hide calculation if no items left
            if (transferredIds.length === rightSelectedIds.length) {
                setShowCalculation(false);
            }

            toast.success(t('warehouse.invoiceDetails.itemsDeleted', 'Items deleted'));
        } else {
            // Delete all items if none selected
            setTransferredIds([]);
            setPrices({});
            setPricesPerUnit({});
            setQuantities({});
            setRightSelectedIds([]);
            setShowCalculation(false);
            toast.success(t('warehouse.invoiceDetails.allItemsRemoved', 'All items removed'));
        }
    };

    // Toggle checkbox in right panel
    const handleRightToggle = (id: string) => {
        const currentIndex = rightSelectedIds.indexOf(id);
        const newChecked = [...rightSelectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setRightSelectedIds(newChecked);
    };

    // Filtered ingredients for left panel
    const filteredLeftIngredients = useMemo(() => ingredients.filter(
            (ing) =>
                !transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [ingredients, transferredIds, searchTerm]);

    // Transferred items for right panel
    const transferredItems = useMemo(() => transferredIds
            .map((id) => {
                const ingredient = ingredients.find((ing) => ing.id === id);
                if (!ingredient) return null;

                const qty = quantities[id];
                const pricePerUnit = pricesPerUnit[id];
                const totalPrice = calculateTotalPrice(id);

                return {
                    id,
                    name: ingredient.name,
                    measurement: ingredient.measurement,
                    quantity: qty,
                    price_per_unit: pricePerUnit,
                    price: totalPrice,
                };
            })
            .filter((item) => item !== null)
            .filter((item) => item!.name.toLowerCase().includes(rightSearchTerm.toLowerCase())), [transferredIds, ingredients, quantities, pricesPerUnit, rightSearchTerm, prices]);

    // Calculate totals
    const totals = useMemo(() => ({
            quantity: transferredItems.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: transferredItems.reduce((acc, item) => acc + item.price, 0),
        }), [transferredItems]);

    // Handle submit batch
    const handleSubmitBatch = async () => {
        if (transferredIds.length === 0) {
            toast.error(t('warehouse.invoiceDetails.addAtLeastOneItem'));
            return;
        }

        try {
            setLoading(true);
            const batchData = transferredItems.map((item) => ({
                ingredient_id: item.id,
                quantity: String(item.quantity ?? 0),
                price_per_unit: String(item.price_per_unit ?? 0),
                price: String(item.price ?? 0),
            }));

            // If this is a new invoice, validate and save with invoice info
            if (isNewInvoice) {
                // If onSaveInvoice is provided, use it
                if (onSaveInvoice) {
                    // Check if form data is filled
                    if (!formData?.supplier_id) {
                        toast.error(t('warehouse.invoiceDetails.fillInvoiceInfoFirst', 'Please fill invoice information in Tab 1 first'));
                        setLoading(false);
                        return;
                    }

                    // Use calculated total price from details (not from user input)
                    const calculatedTotalAmount = totals.totalPrice;
                    const updatedFormData = {
                        ...formData,
                        total_amount: calculatedTotalAmount.toString(),
                    };

                    // Call parent function to save invoice + details together
                    await onSaveInvoice(updatedFormData, batchData);
                    return;
                }

                // If no onSaveInvoice, pass details to parent via callback
                if (onDetailsChange) {
                    onDetailsChange(batchData);
                    toast.success(t('warehouse.invoiceDetails.detailsReady', 'Details ready. Now save invoice info in Tab 1'));
                    return;
                }
            }

            // If this is an existing invoice, replace details via invoice batch update endpoint
            if (!isNewInvoice) {
                if (!invoiceId || invoiceId === 'new') {
                    toast.error(t('warehouse.invoiceDetails.fillInvoiceInfoFirst', 'Invoice ID is required'));
                    return;
                }

                await updateInvoiceDetailsBatch(invoiceId, batchData);
                setTransferredIds([]);
                setQuantities({});
                setPrices({});
                setPricesPerUnit({});
                setShowCalculation(false);
                toast.success(t('warehouse.invoiceDetails.batchCreatedSuccess'));
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error) {
            console.error('Error submitting batch:', error);
            toast.error(error instanceof Error ? error.message : t('error.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshIngredients = async () => {
        try {
            setLoading(true);
            const data = await getIngredients();
            setIngredients(data);
            toast.success(t('warehouse.ingredients.created'));
        } catch (error) {
            console.error('Error refreshing ingredients:', error);
            toast.error(t('warehouse.ingredients.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* Header actions (save/cancel handled here to match new UI) */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                <Button
                    variant="text"
                    onClick={() => router.push('/menu/warehouse/invoice-details')}
                    disabled={loading}
                >
                    {t('cancel')}
                </Button>
                <Button
                    sx={{
                        backgroundColor: '#FB6633',
                        color: 'white',
                        '&:hover': { backgroundColor: '#d9534f' },
                    }}
                    onClick={handleSubmitBatch}
                    disabled={loading || transferredItems.length === 0}
                >
                    {isNewInvoice ? t('save') : t('warehouse.invoiceDetails.submitBatch')}
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '9fr 3fr' },
                    gap: 2,
                    alignItems: 'start',
                }}
            >
                {/* Main column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* General Information */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="overline" sx={{ opacity: 0.7 }}>
                            {t('warehouse.invoiceDetails.generalInfo', 'General Information')}
                        </Typography>
                        <Box
                            sx={{
                                mt: 2,
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                                gap: 2,
                            }}
                        >
                            <TextField
                                label={t('warehouse.invoice.supplier', 'Supplier')}
                                value={formData?.supplier_id ?? ''}
                                size="small"
                                disabled
                            />
                            <TextField
                                label={t('warehouse.invoice.storage', 'Storage')}
                                value={formData?.storage_id ?? ''}
                                size="small"
                                disabled
                            />
                            <TextField
                                label={t('warehouse.invoice.date', 'Date')}
                                value={formData?.date ?? formData?.datetime ?? ''}
                                size="small"
                                disabled
                            />
                        </Box>
                    </Paper>

                    {/* Available + Added */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 2,
                        }}
                    >
                        {/* Available items */}
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {t('warehouse.invoiceDetails.availableIngredients', 'Available Items')}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => {
                                            const allIds = filteredLeftIngredients.map((ing) => ing.id);
                                            const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

                                            if (isAllSelected) {
                                                setSelectedIds([]);
                                                setQuantities({});
                                                return;
                                            }

                                            setSelectedIds(allIds);
                                            setQuantities((prev) => {
                                                const next = { ...prev };
                                                allIds.forEach((id) => {
                                                    if (!next[id]) next[id] = 1;
                                                });
                                                return next;
                                            });
                                        }}
                                        disabled={loading || filteredLeftIngredients.length === 0}
                                    >
                                        {t('warehouse.invoiceDetails.selectAll', 'Select All')}
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setIsIngredientDialogOpen(true)}
                                        disabled={loading}
                                    >
                                        {t('warehouse.add', 'Add')}
                                    </Button>
                                </Box>
                            </Box>

                            <TextField
                                size="small"
                                placeholder={t('search')}
                                fullWidth
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1.5 }}
                            />

                            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <CircularProgress size={26} />
                                    </Box>
                                ) : filteredLeftIngredients.length > 0 ? (
                                    filteredLeftIngredients.map((ing) => (
                                        <Box
                                            key={ing.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                px: 1,
                                                py: 0.75,
                                                borderRadius: 1,
                                                '&:hover': { backgroundColor: theme.vars.palette.action.hover },
                                            }}
                                        >
                                            <Checkbox
                                                size="small"
                                                checked={selectedIds.includes(ing.id)}
                                                onChange={() => handleToggle(ing.id)}
                                            />
                                            <Box sx={{ ml: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap>
                                                    {ing.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {ing.measurement}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        {t('noData')}
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    endIcon={<ChevronRightIcon />}
                                    onClick={handleMoveRight}
                                    disabled={selectedIds.length === 0 || loading}
                                >
                                    {t('warehouse.invoiceDetails.addSelected', 'Add Selected')}
                                </Button>
                            </Box>
                        </Paper>

                        {/* Added to invoice */}
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {t('warehouse.invoiceDetails.selectedItems', 'Added to Invoice')}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<ChevronLeftIcon />}
                                    onClick={handleMoveLeft}
                                    disabled={loading || transferredIds.length === 0}
                                >
                                    {rightSelectedIds.length > 0
                                        ? t('warehouse.invoiceDetails.removeSelected', 'Remove')
                                        : t('warehouse.invoiceDetails.discard', 'Discard')}
                                </Button>
                            </Box>

                            <TextField
                                size="small"
                                placeholder={t('search')}
                                fullWidth
                                value={rightSearchTerm}
                                onChange={(e) => setRightSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1.5 }}
                            />

                            <TableContainer sx={{ maxHeight: 420 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox" />
                                            <TableCell>#</TableCell>
                                            <TableCell>{t('warehouse.invoiceDetails.product')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.quantity')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.unitPrice')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.totalPrice')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transferredItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                                                    {t('warehouse.invoiceDetails.noItemsAdded', 'No items added')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transferredItems.map((item, index) => (
                                                <TableRow key={item.id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            checked={rightSelectedIds.includes(item.id)}
                                                            onChange={() => handleRightToggle(item.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {item.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.measurement}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ minWidth: 140 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={quantities[item.id] ?? ''}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            inputProps={{ step: '0.01', min: '0' }}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        {item.measurement}
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ minWidth: 120 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={pricesPerUnit[item.id] ?? ''}
                                                            onChange={(e) => handlePricePerUnitChange(item.id, e.target.value)}
                                                            inputProps={{ step: '0.01', min: '0' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ minWidth: 120 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={prices[item.id] ?? ''}
                                                            onChange={(e) => handleTotalPriceChange(item.id, e.target.value)}
                                                            inputProps={{ step: '0.01', min: '0' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>

                    {isNewInvoice && showCalculation && (
                        <Alert severity="info">
                            {t('warehouse.invoiceDetails.fillInvoiceInfoInTab1', 'Please fill invoice information (Supplier, Date, Amount) in Tab 1 before saving')}
                        </Alert>
                    )}
                </Box>

                {/* Sidebar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('warehouse.invoiceDetails.summary', 'Summary')}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('warehouse.invoiceDetails.products', 'Products')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {transferredItems.length}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('warehouse.invoiceDetails.totalQty', 'Total Qty')}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatPrice(totals.quantity)}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary">
                            {t('warehouse.invoiceDetails.totalAmount')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {formatPrice(totals.totalPrice)} UZS
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('warehouse.invoiceDetails.status', 'Status')}
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            SelectProps={{ native: true }}
                            defaultValue="pending"
                        >
                            <option value="pending">{t('pending', 'Pending')}</option>
                            <option value="completed">{t('completed', 'Completed')}</option>
                        </TextField>
                        <Box sx={{ mt: 1.5 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => {
                                    setTransferredIds([]);
                                    setPrices({});
                                    setPricesPerUnit({});
                                    setQuantities({});
                                    setRightSelectedIds([]);
                                    setShowCalculation(false);
                                }}
                                disabled={loading || transferredIds.length === 0}
                            >
                                {t('warehouse.invoiceDetails.discard', 'Discard')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            <Dialog
                open={isIngredientDialogOpen}
                onClose={() => setIsIngredientDialogOpen(false)}
                fullWidth
                maxWidth="lg"
            >
                <DialogContent>
                    <IngredientEditView
                        isNew
                        onSuccess={async () => {
                            await handleRefreshIngredients();
                            setIsIngredientDialogOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
