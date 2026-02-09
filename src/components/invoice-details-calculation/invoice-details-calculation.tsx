import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Checkbox,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    InputAdornment,
    useTheme,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';
import { useRouter } from 'src/routes/hooks/use-router';

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
const formatNumber = (num: number): number => {
    return Math.round(num * 100) / 100;
};

export function InvoiceDetailsCalculation({ invoiceId, invoiceData, onSuccess, onDetailsChange, isNewInvoice, persistedDetails, formData, onSaveInvoice }: InvoiceDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const { getIngredients, createInvoiceDetailsBatch } = useInvoiceDetailsAPI();
    const { createInvoiceBatch } = useInvoiceAPI();
    const router = useRouter();

    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

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

    const prevCalculationsRef = useRef<string>('');

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

    // Restore persisted details when component mounts or persistedDetails changes
    useEffect(() => {
        // Don't run if details are still being edited
        if (!persistedDetails) return;

        // Always clear state first to prevent duplicates
        setSelectedIds([]);

        if (persistedDetails.length > 0) {
            const newTransferredIds: string[] = [];
            const newQuantities: Record<string, number> = {};
            const newPricesPerUnit: Record<string, number> = {};
            const newPrices: Record<string, number> = {};

            persistedDetails.forEach((detail) => {
                const ingredientId = detail.ingredient_id || detail.id;

                // Prevent duplicates - only add if not already present
                if (!newTransferredIds.includes(ingredientId)) {
                    newTransferredIds.push(ingredientId);
                    newQuantities[ingredientId] = detail.quantity;
                    newPricesPerUnit[ingredientId] = detail.price_per_unit;
                    newPrices[ingredientId] = detail.price;
                }
            });

            setTransferredIds(newTransferredIds);
            setQuantities(newQuantities);
            setPricesPerUnit(newPricesPerUnit);
            setPrices(newPrices);
            setShowCalculation(true);
        } else if (persistedDetails.length === 0) {
            // Clear details if persistedDetails is empty (after successful batch submission)
            setTransferredIds([]);
            setQuantities({});
            setPricesPerUnit({});
            setPrices({});
            setShowCalculation(false);
        }
    }, [persistedDetails]);

    // Update parent whenever details change (for persistence)
    useEffect(() => {
        if (isNewInvoice && onDetailsChange && transferredIds.length > 0) {
            const batchData = transferredIds.map((id) => ({
                ingredient_id: id,
                quantity: quantities[id] || 0,
                price_per_unit: pricesPerUnit[id] || 0,
                price: prices[id] || 0,
            }));

            // Only call if data actually changed (prevent infinite loops)
            const lastCall = prevCalculationsRef.current;
            const currentCall = JSON.stringify(batchData);
            if (lastCall !== currentCall) {
                prevCalculationsRef.current = currentCall;
                onDetailsChange(batchData);
            }
        }
    }, [transferredIds, quantities, prices, pricesPerUnit, isNewInvoice, onDetailsChange]);

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
        const qty = formatNumber(parseFloat(value) || 0);
        setQuantities((prev) => ({
            ...prev,
            [id]: qty,
        }));

        if (qty === 0) return;

        const pricePerUnit = pricesPerUnit[id] || 0;
        const totalPrice = prices[id] || 0;

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
        const pricePerUnit = formatNumber(parseFloat(value) || 0);
        setPricesPerUnit((prev) => ({
            ...prev,
            [id]: pricePerUnit,
        }));

        if (pricePerUnit === 0) return;

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
        const totalPrice = formatNumber(parseFloat(value) || 0);
        setPrices((prev) => ({
            ...prev,
            [id]: totalPrice,
        }));

        if (totalPrice === 0) return;

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

    // Move left
    const handleMoveLeft = () => {
        setTransferredIds([]);
        setPrices({});
        setPricesPerUnit({});
        setQuantities({});
        setShowCalculation(false);
    };

    // Remove single item
    const handleRemoveItem = (id: string) => {
        setTransferredIds((prev) => prev.filter((item) => item !== id));
        if (transferredIds.length === 1) {
            setShowCalculation(false);
        }
    };

    // Filtered ingredients for left panel
    const filteredLeftIngredients = useMemo(() => {
        return ingredients.filter(
            (ing) =>
                !transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ingredients, transferredIds, searchTerm]);

    // Transferred items for right panel
    const transferredItems = useMemo(() => {
        return transferredIds
            .map((id) => {
                const ingredient = ingredients.find((ing) => ing.id === id);
                if (!ingredient) return null;

                const qty = quantities[id] || 0;
                const pricePerUnit = pricesPerUnit[id] || 0;
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
            .filter((item) => item!.name.toLowerCase().includes(rightSearchTerm.toLowerCase()));
    }, [transferredIds, ingredients, quantities, pricesPerUnit, rightSearchTerm, prices]);

    // Calculate totals
    const totals = useMemo(() => {
        return {
            quantity: transferredItems.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: transferredItems.reduce((acc, item) => acc + item.price, 0),
        };
    }, [transferredItems]);

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
                invoice_id: invoiceId !== 'new' ? invoiceId : undefined,
                quantity: item.quantity.toString(),
                price_per_unit: item.price_per_unit.toString(),
                price: item.price.toString(),
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

            // If this is an existing invoice, use the batch endpoint that creates details
            if (!isNewInvoice) {
                await createInvoiceDetailsBatch(batchData);
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
            // Switch back to Tab 1 after ingredient creation
            setCurrentTab(0);
            toast.success(t('warehouse.ingredients.created'));
        } catch (error) {
            console.error('Error refreshing ingredients:', error);
            toast.error(t('warehouse.ingredients.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Tabs Navigation */}
            <Tabs
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{
                    // borderBottom: 1,
                    borderColor: 'divider',
                    // px: 3,
                }}
            >
                <Tab
                    label={t('warehouse.invoiceDetails.batchOperations')}
                    icon={<Iconify icon="solar:list-bold" />}
                    iconPosition="start"
                />
                <Tab
                    label={t('warehouse.add')}
                    icon={<Iconify icon="solar:add-circle-bold" />}
                    iconPosition="start"
                />
            </Tabs>

            {/* Tab 1: Batch Operations */}
            {currentTab === 0 && (
                <Box sx={{ p: 3, minHeight: '100vh' }}>
                    {/* Info Alert */}
                    {/* <Alert severity="info" sx={{ mb: 3 }}>
                {t('warehouse.invoiceDetails.batchInfo')}
            </Alert> */}

                    {/* Main Grid: Left | Middle | Right */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' },
                            gap: 2,
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* LEFT PANEL: Available Ingredients */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                {t('warehouse.invoiceDetails.availableIngredients', 'Available Ingredients')}
                            </Typography>

                            {/* Search */}
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
                                sx={{ mb: 2 }}
                            />

                            {/* Ingredients List */}
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <CircularProgress size={30} />
                                    </Box>
                                ) : filteredLeftIngredients.length > 0 ? (
                                    filteredLeftIngredients.map((ing) => (
                                        <Box
                                            key={ing.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1,
                                                borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                                '&:hover': {
                                                    backgroundColor: theme.vars.palette.action.hover,
                                                },
                                            }}
                                        >
                                            <Checkbox
                                                checked={selectedIds.includes(ing.id)}
                                                onChange={() => handleToggle(ing.id)}
                                            />
                                            <Box sx={{ ml: 1 }}>
                                                <Typography variant="body2">{ing.name}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {ing.measurement}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        {t('noData')}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>

                        {/* MIDDLE: Action Buttons */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                endIcon={<ChevronRightIcon />}
                                onClick={handleMoveRight}
                                disabled={selectedIds.length === 0 || loading}
                            >
                                {t('add')}
                            </Button>

                            {transferredIds.length > 0 && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<ChevronLeftIcon />}
                                    onClick={handleMoveLeft}
                                    disabled={loading}
                                >
                                    {t('remove')}
                                </Button>
                            )}
                        </Box>

                        {/* RIGHT PANEL: Selected Items with Inputs */}
                        {showCalculation && (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    {t('warehouse.invoiceDetails.selectedItems', 'Selected Items')}
                                </Typography>

                                {/* Search */}
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
                                    sx={{ mb: 2 }}
                                />

                                {/* Items with Input Fields */}
                                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {transferredItems.map((item) => (
                                        <Paper key={item.id} sx={{ p: 2, mb: 2, backgroundColor: theme.vars.palette.background.default }}>
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
                                                    gridTemplateColumns: {
                                                        xs: '1fr',          // mobile
                                                        sm: '1fr 1fr 1fr',  // desktop
                                                    },
                                                    gap: 1,
                                                }}
                                            >
                                                {/* Quantity */}
                                                <TextField
                                                    size="small"
                                                    label={t('warehouse.invoiceDetails.quantity')}
                                                    type="number"
                                                    value={quantities[item.id] || ''}
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

                                                {/* Unit Price */}
                                                <TextField
                                                    size="small"
                                                    label={t('warehouse.invoiceDetails.unitPrice')}
                                                    type="number"
                                                    value={pricesPerUnit[item.id] || ''}
                                                    onChange={(e) => handlePricePerUnitChange(item.id, e.target.value)}
                                                    inputProps={{ step: '0.01', min: '0' }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">UZS</InputAdornment>
                                                        ),
                                                    }}
                                                />

                                                {/* Total Price */}
                                                <TextField
                                                    size="small"
                                                    label={t('warehouse.invoiceDetails.totalPrice')}
                                                    type="number"
                                                    value={prices[item.id] || ''}
                                                    onChange={(e) => handleTotalPriceChange(item.id, e.target.value)}
                                                    inputProps={{ step: '0.01', min: '0' }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">UZS</InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Box>

                                        </Paper>
                                    ))}
                                </Box>
                            </Paper>
                        )}
                    </Box>

                    {/* BOTTOM: Calculation Table */}
                    {showCalculation && transferredItems.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                {t('warehouse.invoiceDetails.summary', 'Invoice Summary')}
                            </Typography>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: theme.vars.palette.background.paper }}>
                                            <TableCell>№</TableCell>
                                            <TableCell>{t('warehouse.invoiceDetails.product')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.quantity')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.unitPrice')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.totalPrice')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transferredItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell align="right">
                                                    {formatPrice(item.quantity)} {item.measurement}
                                                </TableCell>
                                                <TableCell align="right">{formatPrice(item.price_per_unit)} UZS</TableCell>
                                                <TableCell align="right">{formatPrice(item.price)} UZS</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Totals Row */}
                                        <TableRow sx={{ backgroundColor: theme.vars.palette.action.hover }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                                {t('warehouse.invoiceDetails.total')}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {formatPrice(totals.quantity)}
                                            </TableCell>
                                            <TableCell />
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {formatPrice(totals.totalPrice)} UZS
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Submit Button */}
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push('/menu/warehouse/invoice-details')}
                                    disabled={loading}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    sx={{
                                        backgroundColor: '#FB6633',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: '#d9534f',
                                        },
                                    }}
                                    color="primary"
                                    onClick={handleSubmitBatch}
                                    disabled={loading || transferredItems.length === 0}
                                // startIcon={<Iconify icon="solar:check-circle-bold" />}
                                >
                                    {isNewInvoice ? t('save') : t('warehouse.invoiceDetails.submitBatch')}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {!showCalculation && transferredIds.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 3 }}>
                            {t('warehouse.invoiceDetails.selectIngredientsFirst', 'Select ingredients from left panel and click Add to continue')}
                        </Alert>
                    )}

                    {isNewInvoice && showCalculation && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            {t('warehouse.invoiceDetails.fillInvoiceInfoInTab1', 'Please fill invoice information (Supplier, Date, Amount) in Tab 1 before saving')}
                        </Alert>
                    )}
                </Box>
            )}

            {/* Tab 2: Add New Ingredient */}
            {currentTab === 1 && (
                <Box sx={{ p: 3 }}>
                    <IngredientEditView isNew={true} onSuccess={handleRefreshIngredients} />
                </Box>
            )}
        </div>
    );
}
