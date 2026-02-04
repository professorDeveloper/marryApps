import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Divider,
    InputAdornment,
    useTheme,
    Alert,
    CircularProgress,
    Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { paths } from 'src/routes/paths';
import type { IInventoryItem, IInventoryItemInput } from 'src/types/inventory';

// --- TYPES ---
interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
    quantity?: number;
    brand_id?: string;
    picture_url?: string;
    color_code?: string;
}

interface InventoryDetailsCalculationProps {
    inventoryId: string;
    onSuccess?: () => void;
    onDetailsChange?: (details: any[]) => void;
    isNewInventory?: boolean;
    persistedDetails?: IInventoryItem[];
}

const formatPrice = (price: number) => {
    const formatted = Math.round(price * 100) / 100;
    return new Intl.NumberFormat('uz-UZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(formatted);
};

const formatNumber = (num: number): number => {
    return Math.round(num * 100) / 100;
};

export function InventoryDetailsCalculation({
    inventoryId,
    onSuccess,
    onDetailsChange,
    isNewInventory,
    persistedDetails,
}: InventoryDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const navigate = useNavigate();
    const { getInventoryItems, createInventoryItemsBatch } = useInventoryAPI();

    // Left panel (available ingredients)
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Middle: quantity inputs
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Right panel (transferred items)
    const [transferredIds, setTransferredIds] = useState<string[]>([]);

    // Search for right panel
    const [rightSearchTerm, setRightSearchTerm] = useState('');

    // Save operation loading state
    const [isSaving, setIsSaving] = useState(false);

    // Load ingredients
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetcher<any>(endpoints.ingredient.list);
                // Handle both array and object responses
                const ingredientsList = Array.isArray(data) ? data : (data?.data || data?.list || []);
                setIngredients(Array.isArray(ingredientsList) ? ingredientsList : []);
            } catch (error) {
                console.error('Error loading ingredients:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [t]);

    // Restore persisted details when component mounts
    useEffect(() => {
        if (persistedDetails && persistedDetails.length > 0) {
            const newTransferredIds: string[] = [];
            const newQuantities: Record<string, number> = {};

            persistedDetails.forEach((detail) => {
                const ingredientId = detail.ingredient_id;
                newTransferredIds.push(ingredientId);
                newQuantities[ingredientId] = detail.counted_quantity;
            });

            setTransferredIds(newTransferredIds);
            setQuantities(newQuantities);
        }
    }, [persistedDetails]);

    // Filter available ingredients (not selected and matches search)
    const availableIngredients = useMemo(() => {
        return ingredients.filter(
            (ing) =>
                !transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ingredients, transferredIds, searchTerm]);

    // Filter transferred ingredients (matches search)
    const transferredIngredients = useMemo(() => {
        return ingredients.filter(
            (ing) =>
                transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(rightSearchTerm.toLowerCase())
        );
    }, [ingredients, transferredIds, rightSearchTerm]);

    // Handle add selected ingredients
    const handleAddIngredients = () => {
        setTransferredIds((prev) => [...new Set([...prev, ...selectedIds])]);
        selectedIds.forEach((id) => {
            if (!quantities[id]) {
                setQuantities((prev) => ({
                    ...prev,
                    [id]: 0,
                }));
            }
        });
        setSelectedIds([]);
    };

    // Handle remove ingredient
    const handleRemoveIngredient = (id: string) => {
        setTransferredIds((prev) => prev.filter((i) => i !== id));
        setQuantities((prev) => {
            const newQty = { ...prev };
            delete newQty[id];
            return newQty;
        });
    };

    // Handle quantity change
    const handleQuantityChange = (id: string, value: number) => {
        setQuantities((prev) => ({
            ...prev,
            [id]: formatNumber(value),
        }));
    };

    // Build transfer data
    const buildTransferData = (): IInventoryItemInput[] => {
        return transferredIds.map((id) => ({
            ingredient_id: id,
            counted_quantity: String(quantities[id] || "0"),
        }));
    };

    // Handle save
    const handleSave = async () => {
        try {
            if (transferredIds.length === 0) {
                toast.error(t('inventory.selectIngredients') || 'Please select ingredients');
                return;
            }

            setIsSaving(true);
            const itemsData = buildTransferData();
            const result = await createInventoryItemsBatch(inventoryId, itemsData);

            if (result) {
                toast.success(t('success.created'));
                if (onDetailsChange) {
                    onDetailsChange(itemsData);
                }
                if (onSuccess) {
                    onSuccess();
                }
                // Navigate back to inventory list after successful save
                setTimeout(() => {
                    navigate(paths.menu.inventory.root);
                }, 500);
            }
        } catch (error) {
            console.error('Error saving inventory items:', error);
            toast.error(t('error.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, borderRadius: 1.5 }}>
            {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('inventory.itemsCalculation')}
            </Typography> */}

            {/* <Alert severity="info" sx={{ mb: 2 }}>
                {t('inventory.itemsCalculationHelp')}
            </Alert> */}

            {/* MAIN GRID - 3 COLUMNS: Left | Middle | Right */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' },
                    gap: 2,
                    alignItems: 'flex-start',
                    mb: 4,
                }}
            >
                {/* LEFT PANEL - Available Ingredients */}
                <Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ width: '100%', minWidth: '200px' }}>
                            <TextField
                                fullWidth
                                placeholder={t('calculation.search', 'Search...')}
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Box>

                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                        <Box
                            sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary',
                            }}
                        >
                            <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product Name')}</Box>
                            <Box sx={{ width: '30%' }}>{t('calculation.unit', 'Unit')}</Box>
                            <Box sx={{ width: '30%', textAlign: 'right' }}>{t('calculation.price', 'Price')}</Box>
                        </Box>
                        <Divider />
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {loading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : availableIngredients.length === 0 ? (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    {t('calculation.noProducts', 'No products found')}
                                </Typography>
                            ) : (
                                availableIngredients.map((ingredient) => (
                                    <Box
                                        key={ingredient.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Checkbox
                                                size="small"
                                                checked={selectedIds.includes(ingredient.id)}
                                                onChange={() => {
                                                    if (selectedIds.includes(ingredient.id)) {
                                                        setSelectedIds((prev) => prev.filter((i) => i !== ingredient.id));
                                                    } else {
                                                        setSelectedIds((prev) => [...prev, ingredient.id]);
                                                    }
                                                }}
                                                sx={{
                                                    color: theme.palette.success.main,
                                                    '&.Mui-checked': { color: theme.palette.success.main },
                                                }}
                                            />
                                            <Typography variant="body2">{ingredient.name}</Typography>
                                        </Box>
                                        <Box sx={{ width: '30%' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {ingredient.measurement}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ width: '30%', textAlign: 'right' }}>
                                            <Typography variant="caption">{formatPrice(parseFloat(ingredient.price_per_unit || '0'))}</Typography>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* MIDDLE PANEL - Arrows */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        height: '100%',
                        pt: 5,
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                        <IconButton
                            onClick={handleAddIngredients}
                            disabled={selectedIds.length === 0}
                            sx={{
                                bgcolor:
                                    selectedIds.length === 0
                                        ? theme.palette.action.disabled
                                        : theme.palette.action.hover,
                                color:
                                    selectedIds.length === 0
                                        ? theme.palette.text.disabled
                                        : theme.palette.warning.main,
                                '&:hover': {
                                    bgcolor:
                                        selectedIds.length === 0
                                            ? theme.palette.action.disabled
                                            : theme.palette.warning.light,
                                },
                                borderRadius: '15%',
                                padding: '10px',
                            }}
                            title={t('calculation.selectedProductsTransfer', 'Transfer selected')}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                setTransferredIds([]);
                                setQuantities({});
                            }}
                            disabled={transferredIds.length === 0}
                            sx={{
                                bgcolor:
                                    transferredIds.length === 0
                                        ? theme.palette.action.disabled
                                        : theme.palette.action.hover,
                                color:
                                    transferredIds.length === 0
                                        ? theme.palette.text.disabled
                                        : theme.palette.warning.main,
                                '&:hover': {
                                    bgcolor:
                                        transferredIds.length === 0
                                            ? theme.palette.action.disabled
                                            : theme.palette.warning.light,
                                },
                                borderRadius: '15%',
                                padding: '10px',
                            }}
                            title={t('calculation.returnAllProducts', 'Return all')}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* RIGHT PANEL - Selected Ingredients */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={t('calculation.search', 'Search...')}
                            size="small"
                            value={rightSearchTerm}
                            onChange={(e) => setRightSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                        <Box
                            sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary',
                            }}
                        >
                            <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product Name')}</Box>
                            <Box sx={{ width: '30%' }}>{t('calculation.unitOfMeasurement', 'Unit')}</Box>
                            <Box sx={{ width: '20%', textAlign: 'center' }}>{t('calculation.quantity', 'Qty')}</Box>
                            <Box sx={{ width: '10%' }} />
                        </Box>
                        <Divider />
                        <Box sx={{ maxHeight: 400, overflowY: 'auto', minHeight: 200 }}>
                            {loading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : transferredIngredients.length === 0 ? (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    {t('calculation.noProductsSelected', 'No products selected')}
                                </Typography>
                            ) : (
                                transferredIngredients.map((ingredient) => (
                                    <Box
                                        key={ingredient.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Box sx={{ width: '40%' }}>
                                            <Typography variant="body2">{ingredient.name}</Typography>
                                        </Box>
                                        <Box sx={{ width: '30%' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {ingredient.measurement}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ width: '20%', textAlign: 'center' }}>
                                            <TextField
                                                type="number"
                                                // value={}
                                                defaultValue={1}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        ingredient.id,
                                                        parseFloat(e.target.value)
                                                    )
                                                }
                                                size="small"
                                                inputProps={{ min: 0, step: 0.1 }}
                                                sx={{
                                                    width: '100%',
                                                    '& .MuiOutlinedInput-root': {
                                                        fontSize: '0.875rem',
                                                    },
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ width: '10%', textAlign: 'center' }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                                sx={{
                                                    color: 'error.main',
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* ACTION BUTTONS */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={transferredIds.length === 0 || isSaving}
                    sx={{
                        position: 'relative',
                        minWidth: 120,
                        boxShadow: theme.shadows[4],
                        transition: 'all 0.3s ease',
                        '&:hover:not(:disabled)': {
                            boxShadow: theme.shadows[8],
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    {isSaving ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {t('common.saving') || 'Saving...'}
                        </>
                    ) : (
                        t('common.save')
                    )}
                </Button>
            </Box>
        </Box>
    );
}

export default InventoryDetailsCalculation;
