import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

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

// --- TYPES (unchanged) ---
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
    invoiceData?: Record<string, any>;
    onSuccess?: () => void;
    onDetailsChange?: (details: any[]) => void;
    isNewInvoice?: boolean;
    persistedDetails?: any[];
    formData?: Record<string, any>;
    onSaveInvoice?: (formData: Record<string, any>, details?: any[]) => Promise<void>;
}

// --- UTILS (extracted for clarity) ---
const formatPrice = (price: number) => {
    const formatted = Math.round(price * 100) / 100;
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(formatted);
};

const formatNumber = (num: number): number => Math.round(num * 100) / 100;

const parseInputNumber = (value: string): number | null => {
    if (value.trim() === '') return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? formatNumber(parsed) : null;
};

// ─────────────────────────────────────────────────────────────
// HOOK 1: Ingredients fetching + refresh
// ─────────────────────────────────────────────────────────────
const useIngredients = () => {
    const { getIngredients } = useInvoiceDetailsAPI();
    const { t } = useTranslation('menu');

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    const loadIngredients = useCallback(async () => {
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
    }, [getIngredients, t]);

    // Initial load (no success toast)
    useEffect(() => {
        loadIngredients();
    }, [loadIngredients]);

    // Manual refresh (with success toast)
    const refreshIngredients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getIngredients();
            setIngredients(data || []);
            toast.success(t('warehouse.ingredients.created'));
        } catch (error) {
            console.error('Error refreshing ingredients:', error);
            toast.error(t('warehouse.ingredients.createFailed'));
        } finally {
            setLoading(false);
        }
    }, [getIngredients, t]);

    return {
        ingredients,
        loading,
        refreshIngredients,
    };
};

// ─────────────────────────────────────────────────────────────
// HOOK 2: All transferred items logic (state + calculations + actions)
// ─────────────────────────────────────────────────────────────
const useTransferredItems = () => {
    const { t } = useTranslation('menu');

    // Core state
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [pricesPerUnit, setPricesPerUnit] = useState<Record<string, number>>({});
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [rightSelectedIds, setRightSelectedIds] = useState<string[]>([]);
    const [showCalculation, setShowCalculation] = useState(false);

    // Derived batch data (used for persistence + API)
    const localBatchData = useMemo(() => {
        if (transferredIds.length === 0) return [];

        return [...transferredIds]
            .sort()
            .map((id) => ({
                ingredient_id: id,
                quantity: quantities[id] ?? 0,
                price_per_unit: pricesPerUnit[id] ?? 0,
                price: prices[id] ?? 0,
            }));
    }, [transferredIds, quantities, pricesPerUnit, prices]);

    // ── Field change handlers (auto-calculation logic) ──
    const handleQuantityChange = useCallback((id: string, value: string) => {
        const qty = parseInputNumber(value);

        setQuantities((prev) => {
            const next = { ...prev };
            if (qty === null) delete next[id];
            else next[id] = qty;
            return next;
        });

        if (qty === null || qty <= 0) return;

        const pricePerUnitVal = pricesPerUnit[id];
        const totalPriceVal = prices[id];

        if (pricePerUnitVal > 0) {
            setPrices((prev) => ({
                ...prev,
                [id]: formatNumber(qty * pricePerUnitVal),
            }));
        } else if (totalPriceVal > 0) {
            setPricesPerUnit((prev) => ({
                ...prev,
                [id]: formatNumber(totalPriceVal / qty),
            }));
        }
    }, [pricesPerUnit, prices]);

    const handlePricePerUnitChange = useCallback((id: string, value: string) => {
        const pricePerUnitVal = parseInputNumber(value);

        setPricesPerUnit((prev) => {
            const next = { ...prev };
            if (pricePerUnitVal === null) delete next[id];
            else next[id] = pricePerUnitVal;
            return next;
        });

        if (pricePerUnitVal === null || pricePerUnitVal === 0) return;

        const qtyVal = quantities[id] || 0;
        const totalPriceVal = prices[id] || 0;

        if (qtyVal > 0) {
            setPrices((prev) => ({
                ...prev,
                [id]: formatNumber(qtyVal * pricePerUnitVal),
            }));
        } else if (totalPriceVal > 0) {
            setQuantities((prev) => ({
                ...prev,
                [id]: formatNumber(totalPriceVal / pricePerUnitVal),
            }));
        }
    }, [quantities, prices]);

    const handleTotalPriceChange = useCallback((id: string, value: string) => {
        const totalPriceVal = parseInputNumber(value);

        setPrices((prev) => {
            const next = { ...prev };
            if (totalPriceVal === null) delete next[id];
            else next[id] = totalPriceVal;
            return next;
        });

        if (totalPriceVal === null || totalPriceVal === 0) return;

        const qtyVal = quantities[id] || 0;
        const pricePerUnitVal = pricesPerUnit[id] || 0;

        if (qtyVal > 0) {
            setPricesPerUnit((prev) => ({
                ...prev,
                [id]: formatNumber(totalPriceVal / qtyVal),
            }));
        } else if (pricePerUnitVal > 0) {
            setQuantities((prev) => ({
                ...prev,
                [id]: formatNumber(totalPriceVal / pricePerUnitVal),
            }));
        }
    }, [quantities, pricesPerUnit]);

    // ── Move actions ──
    const moveRight = useCallback((selectedIds: string[]) => {
        if (selectedIds.length === 0) return;

        const newIds = selectedIds.filter((id) => !transferredIds.includes(id));
        if (newIds.length === 0) return;

        setTransferredIds((prev) => [...prev, ...newIds]);
        setShowCalculation(true);
    }, [transferredIds]);

    const moveLeft = useCallback(() => {
        if (rightSelectedIds.length > 0) {
            // Remove only selected
            setTransferredIds((prev) =>
                prev.filter((id) => !rightSelectedIds.includes(id))
            );

            setQuantities((prev) => {
                const next = { ...prev };
                rightSelectedIds.forEach((id) => delete next[id]);
                return next;
            });
            setPrices((prev) => {
                const next = { ...prev };
                rightSelectedIds.forEach((id) => delete next[id]);
                return next;
            });
            setPricesPerUnit((prev) => {
                const next = { ...prev };
                rightSelectedIds.forEach((id) => delete next[id]);
                return next;
            });

            setRightSelectedIds([]);

            if (transferredIds.length === rightSelectedIds.length) {
                setShowCalculation(false);
            }

            toast.success(t('warehouse.invoiceDetails.itemsDeleted', 'Items deleted'));
        } else {
            // Clear everything
            setTransferredIds([]);
            setQuantities({});
            setPrices({});
            setPricesPerUnit({});
            setRightSelectedIds([]);
            setShowCalculation(false);

            toast.success(t('warehouse.invoiceDetails.allItemsRemoved', 'All items removed'));
        }
    }, [rightSelectedIds, transferredIds, t]);

    const handleRightToggle = useCallback((id: string) => {
        setRightSelectedIds((prev) => {
            const idx = prev.indexOf(id);
            if (idx === -1) return [...prev, id];
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
    }, []);

    // ── Restore from persisted data (used by parent sync) ──
    const restoreFromPersisted = useCallback((persistedDetails: any[] | undefined) => {
        if (!persistedDetails || persistedDetails.length === 0) {
            setTransferredIds([]);
            setQuantities({});
            setPricesPerUnit({});
            setPrices({});
            setShowCalculation(false);
            setRightSelectedIds([]);
            return;
        }

        const incomingById = new Map<string, any>();
        persistedDetails.forEach((detail) => {
            const ingredientId = String(detail.ingredient_id || detail.id || '');
            if (!ingredientId || incomingById.has(ingredientId)) return;

            incomingById.set(ingredientId, {
                quantity: Number(detail.quantity) || 0,
                price_per_unit: Number(detail.price_per_unit) || 0,
                price: Number(detail.price) || 0,
            });
        });

        const newTransferredIds: string[] = Array.from(incomingById.keys());
        const newQuantities: Record<string, number> = {};
        const newPricesPerUnit: Record<string, number> = {};
        const newPrices: Record<string, number> = {};

        incomingById.forEach((detail, id) => {
            newQuantities[id] = detail.quantity;
            newPricesPerUnit[id] = detail.price_per_unit;
            newPrices[id] = detail.price;
        });

        setTransferredIds(newTransferredIds);
        setQuantities(newQuantities);
        setPricesPerUnit(newPricesPerUnit);
        setPrices(newPrices);
        setShowCalculation(true);
        setRightSelectedIds([]);
    }, []);

    const clearAll = useCallback(() => {
        setTransferredIds([]);
        setQuantities({});
        setPrices({});
        setPricesPerUnit({});
        setRightSelectedIds([]);
        setShowCalculation(false);
    }, []);

    return {
        transferredIds,
        quantities,
        pricesPerUnit,
        prices,
        rightSelectedIds,
        showCalculation,
        localBatchData,
        moveRight,
        moveLeft,
        handleRightToggle,
        handleQuantityChange,
        handlePricePerUnitChange,
        handleTotalPriceChange,
        restoreFromPersisted,
        clearAll,
        setRightSelectedIds,
    };
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS (UI broken down for readability)
// ─────────────────────────────────────────────────────────────

interface AvailableIngredientsPanelProps {
    ingredients: Ingredient[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedIds: string[];
    onToggle: (id: string) => void;
    onMoveRight: (selectedIds: string[]) => void;
    onSelectAll: () => void;
    onAddNewIngredient: () => void;
}

const AvailableIngredientsPanel: React.FC<AvailableIngredientsPanelProps> = ({
    ingredients,
    loading,
    searchTerm,
    onSearchChange,
    selectedIds,
    onToggle,
    onMoveRight,
    onSelectAll,
    onAddNewIngredient,
}) => {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    const filtered = useMemo(
        () =>
            ingredients.filter((ing) =>
                ing.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [ingredients, searchTerm]
    );

    const allIds = filtered.map((ing) => ing.id);
    const isAllSelected =
        allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.availableIngredients', 'Available Items')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="text"
                        onClick={onSelectAll}
                        disabled={loading || filtered.length === 0}
                    >
                        {isAllSelected
                            ? t('warehouse.invoiceDetails.deselectAll', 'Deselect All')
                            : t('warehouse.invoiceDetails.selectAll', 'Select All')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onAddNewIngredient}
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
                onChange={(e) => onSearchChange(e.target.value)}
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
                ) : filtered.length > 0 ? (
                    filtered.map((ing) => (
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
                                onChange={() => onToggle(ing.id)}
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

            <Button
                fullWidth
                variant="contained"
                endIcon={<ChevronRightIcon />}
                onClick={() => onMoveRight(selectedIds)}
                disabled={selectedIds.length === 0}
                sx={{ mt: 1.5 }}
            >
                {t('warehouse.invoiceDetails.addSelected', 'Add Selected')}
            </Button>
        </Paper>
    );
};

interface AddedItemsPanelProps {
    transferredItems: any[];
    rightSelectedIds: string[];
    quantities: Record<string, number>;
    pricesPerUnit: Record<string, number>;
    prices: Record<string, number>;
    onRightToggle: (id: string) => void;
    onQuantityChange: (id: string, value: string) => void;
    onPricePerUnitChange: (id: string, value: string) => void;
    onTotalPriceChange: (id: string, value: string) => void;
    onMoveLeft: () => void;
}

const AddedItemsPanel: React.FC<AddedItemsPanelProps> = ({
    transferredItems,
    rightSelectedIds,
    quantities,
    pricesPerUnit,
    prices,
    onRightToggle,
    onQuantityChange,
    onPricePerUnitChange,
    onTotalPriceChange,
    onMoveLeft,
}) => {
    const { t } = useTranslation('menu');

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.selectedItems', 'Added to Invoice')}
                </Typography>
                <Button
                    size="small"
                    variant="text"
                    startIcon={<ChevronLeftIcon />}
                    onClick={onMoveLeft}
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
                value="" /* right search is still in parent for now */
                /* We can pass rightSearchTerm if you want to move it here */
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
                                            onChange={() => onRightToggle(item.id)}
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
                                            onChange={(e) => onQuantityChange(item.id, e.target.value)}
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
                                            onChange={(e) => onPricePerUnitChange(item.id, e.target.value)}
                                            inputProps={{ step: '0.01', min: '0' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ minWidth: 120 }}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={prices[item.id] ?? ''}
                                            onChange={(e) => onTotalPriceChange(item.id, e.target.value)}
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
    );
};

interface SummaryPanelProps {
    transferredItemsCount: number;
    totalQuantity: number;
    totalAmount: number;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({
    transferredItemsCount,
    totalQuantity,
    totalAmount,
}) => {
    const { t } = useTranslation('menu');

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('warehouse.invoiceDetails.summary', 'Summary')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('warehouse.invoiceDetails.products', 'Products')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {transferredItemsCount}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('warehouse.invoiceDetails.totalQty', 'Total Qty')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(totalQuantity)}
                </Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
                {t('warehouse.invoiceDetails.totalAmount')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                {formatPrice(totalAmount)} UZS
            </Typography>
        </Paper>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT (now much cleaner)
// ─────────────────────────────────────────────────────────────
export function InvoiceDetailsCalculation({
    invoiceId,
    onSuccess,
    onDetailsChange,
    isNewInvoice = false,
    persistedDetails,
    formData,
    onSaveInvoice,
}: InvoiceDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const { updateInvoiceDetailsBatch } = useInvoiceAPI();
    const router = useRouter();

    // Hooks
    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();
    const transferred = useTransferredItems();

    // Local UI state (left panel only)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [rightSearchTerm, setRightSearchTerm] = useState('');

    // Refs for data-flow safety (prevents infinite loops between parent ↔ child)
    const prevCalculationsRef = useRef<string>('');
    const hydratedPersistedSnapshotRef = useRef<string>('');

    // Build displayed transferred items (join with ingredient metadata)
    const transferredItems = useMemo(() => transferred.transferredIds
            .map((id) => {
                const ingredient = ingredients.find((ing) => ing.id === id);
                if (!ingredient) return null;

                const qty = transferred.quantities[id] ?? 0;
                const totalPrice = transferred.prices[id] ?? 0;

                return {
                    id,
                    name: ingredient.name,
                    measurement: ingredient.measurement,
                    quantity: qty,
                    price_per_unit: transferred.pricesPerUnit[id] ?? 0,
                    price: totalPrice,
                };
            })
            .filter(Boolean)
            .filter((item) =>
                item!.name.toLowerCase().includes(rightSearchTerm.toLowerCase())
            ) as any[], [
        transferred.transferredIds,
        transferred.quantities,
        transferred.pricesPerUnit,
        transferred.prices,
        ingredients,
        rightSearchTerm,
    ]);

    const totals = useMemo(
        () => ({
            quantity: transferredItems.reduce((acc, item) => acc + (item.quantity || 0), 0),
            totalPrice: transferredItems.reduce((acc, item) => acc + (item.price || 0), 0),
        }),
        [transferredItems]
    );

    // ── Persisted data sync (only when parent actually changes) ──
    useEffect(() => {
        if (!persistedDetails) return;

        const incomingSnapshot = JSON.stringify(
            [...persistedDetails]
                .map((d) => ({
                    ingredient_id: String(d.ingredient_id || d.id || ''),
                    quantity: Number(d.quantity) || 0,
                    price_per_unit: Number(d.price_per_unit) || 0,
                    price: Number(d.price) || 0,
                }))
                .sort((a, b) => a.ingredient_id.localeCompare(b.ingredient_id))
        );

        const currentSnapshot = JSON.stringify(transferred.localBatchData);

        if (
            incomingSnapshot === hydratedPersistedSnapshotRef.current ||
            (isNewInvoice &&
                (incomingSnapshot === prevCalculationsRef.current ||
                    incomingSnapshot === currentSnapshot))
        ) {
            return;
        }

        transferred.restoreFromPersisted(persistedDetails);
        hydratedPersistedSnapshotRef.current = incomingSnapshot;
    }, [persistedDetails, isNewInvoice, transferred]);

    // ── Push changes to parent (new invoice mode) ──
    useEffect(() => {
        if (!isNewInvoice || !onDetailsChange) return;

        const snapshot = JSON.stringify(transferred.localBatchData);
        if (snapshot !== prevCalculationsRef.current) {
            prevCalculationsRef.current = snapshot;
            onDetailsChange(transferred.localBatchData);
        }
    }, [isNewInvoice, onDetailsChange, transferred.localBatchData]);

    // Left panel helpers
    const handleLeftToggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const idx = prev.indexOf(id);
            if (idx === -1) {
                const next = [...prev, id];
                // Default quantity = 1 when first selected
                transferred.handleQuantityChange(id, '1'); // will set inside the hook
                return next;
            }
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
    }, [transferred]);

    const handleSelectAllLeft = useCallback(() => {
        const visibleIds = ingredients
            .filter((ing) => !transferred.transferredIds.includes(ing.id))
            .map((ing) => ing.id);

        const isAllSelected = visibleIds.every((id) => selectedIds.includes(id));

        if (isAllSelected) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(visibleIds);
        // Pre-fill quantity = 1 for new ones
        visibleIds.forEach((id) => {
            if (!transferred.quantities[id]) {
                transferred.handleQuantityChange(id, '1');
            }
        });
    }, [ingredients, transferred, selectedIds]);

    // Submit handler (cleaned)
    const handleSubmitBatch = async () => {
        if (transferred.transferredIds.length === 0) {
            toast.error(t('warehouse.invoiceDetails.addAtLeastOneItem'));
            return;
        }

        try {
            const batchData = transferredItems.map((item) => ({
                ingredient_id: item.id,
                quantity: String(item.quantity ?? 0),
                price_per_unit: String(item.price_per_unit ?? 0),
                price: String(item.price ?? 0),
            }));

            if (isNewInvoice && onSaveInvoice) {
                if (!formData?.supplier_id) {
                    toast.error(t('warehouse.invoiceDetails.fillInvoiceInfoFirst'));
                    return;
                }

                const updatedFormData = {
                    ...formData,
                    total_amount: totals.totalPrice.toString(),
                };

                await onSaveInvoice(updatedFormData, batchData);
                return;
            }

            if (!isNewInvoice) {
                if (!invoiceId || invoiceId === 'new') {
                    toast.error(t('warehouse.invoiceDetails.fillInvoiceInfoFirst'));
                    return;
                }
                await updateInvoiceDetailsBatch(invoiceId, batchData);

                // Reset after successful update
                transferred.clearAll();
                toast.success(t('warehouse.invoiceDetails.batchCreatedSuccess'));
                onSuccess?.();
            }
        } catch (error) {
            console.error('Error submitting batch:', error);
            toast.error(error instanceof Error ? error.message : t('error.loadFailed'));
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                <Button
                    variant="text"
                    onClick={() => router.push('/menu/warehouse/invoice-details')}
                    disabled={ingredientsLoading}
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
                    disabled={ingredientsLoading || transferredItems.length === 0}
                >
                    {isNewInvoice ? t('save') : t('warehouse.invoiceDetails.submitBatch')}
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '9fr 3fr' },
                    gap: 2,
                }}
            >
                {/* Main content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* General info (read-only from Tab 1) */}
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
                                label={t('warehouse.invoice.supplier')}
                                value={formData?.supplier_id ?? ''}
                                size="small"
                                disabled
                            />
                            <TextField
                                label={t('warehouse.invoice.storage')}
                                value={formData?.storage_id ?? ''}
                                size="small"
                                disabled
                            />
                            <TextField
                                label={t('warehouse.invoice.date')}
                                value={formData?.date ?? formData?.datetime ?? ''}
                                size="small"
                                disabled
                            />
                        </Box>
                    </Paper>

                    {/* Two-column editor */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 2,
                        }}
                    >
                        <AvailableIngredientsPanel
                            ingredients={ingredients}
                            loading={ingredientsLoading}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedIds={selectedIds}
                            onToggle={handleLeftToggle}
                            onMoveRight={transferred.moveRight}
                            onSelectAll={handleSelectAllLeft}
                            onAddNewIngredient={() => {/* dialog state is below */}}
                        />

                        <AddedItemsPanel
                            transferredItems={transferredItems}
                            rightSelectedIds={transferred.rightSelectedIds}
                            quantities={transferred.quantities}
                            pricesPerUnit={transferred.pricesPerUnit}
                            prices={transferred.prices}
                            onRightToggle={transferred.handleRightToggle}
                            onQuantityChange={transferred.handleQuantityChange}
                            onPricePerUnitChange={transferred.handlePricePerUnitChange}
                            onTotalPriceChange={transferred.handleTotalPriceChange}
                            onMoveLeft={transferred.moveLeft}
                        />
                    </Box>

                    {isNewInvoice && transferred.showCalculation && (
                        <Alert severity="info">
                            {t('warehouse.invoiceDetails.fillInvoiceInfoInTab1')}
                        </Alert>
                    )}
                </Box>

                {/* Sidebar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <SummaryPanel
                        transferredItemsCount={transferredItems.length}
                        totalQuantity={totals.quantity}
                        totalAmount={totals.totalPrice}
                    />

                    {/* Status panel (kept minimal) */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('warehouse.invoiceDetails.status')}
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            SelectProps={{ native: true }}
                            defaultValue="pending"
                        >
                            <option value="pending">{t('pending')}</option>
                            <option value="completed">{t('completed')}</option>
                        </TextField>

                        <Box sx={{ mt: 1.5 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={transferred.clearAll}
                                disabled={transferred.transferredIds.length === 0}
                            >
                                {t('warehouse.invoiceDetails.discard')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Add new ingredient dialog */}
            <Dialog
                open={false} /* You can add local state isIngredientDialogOpen if you want to keep the dialog here */
                fullWidth
                maxWidth="lg"
            >
                <DialogContent>
                    <IngredientEditView
                        isNew
                        onSuccess={refreshIngredients}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}