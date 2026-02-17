import { useState, useMemo, useEffect } from 'react';
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
    CircularProgress,
    Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetcher, endpoints, deleter } from 'src/lib/axios';
import { toast } from 'sonner';
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
    onApplySuccess?: (items: IInventoryItem[]) => void;
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
    onApplySuccess,
    isNewInventory,
    persistedDetails,
}: InventoryDetailsCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const navigate = useNavigate();
    const { getInventoryItems, createInventoryItemsBatch, applyInventory } = useInventoryAPI();
    // Left panel (available ingredients)
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Middle: quantity inputs
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    // Right panel (transferred items)
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    // Inventory item IDs (from backend) - used for deletion
    const [inventoryItemIds, setInventoryItemIds] = useState<Record<string, string>>({});
    // Search for right panel
    const [rightSearchTerm, setRightSearchTerm] = useState('');
    // Save operation loading state
    const [isSaving, setIsSaving] = useState(false);
    // Results table (after saving)
    const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);

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
            const newQuantities: Record<string, string> = {};

            persistedDetails.forEach((detail) => {
                const ingredientId = detail.ingredient_id;
                newTransferredIds.push(ingredientId);
                newQuantities[ingredientId] = String(detail.counted_quantity);
            });

            setTransferredIds(newTransferredIds);
            setQuantities(newQuantities);

            // Also restore inventory items to show results table
            setInventoryItems(persistedDetails);
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
                    [id]: '0',
                }));
            }
        });
        setSelectedIds([]);
    };

    // Handle remove ingredient
    const handleRemoveIngredient = async (id: string) => {
        // If this item has a backend inventory_item_id, delete it from the backend
        const inventoryItemId = inventoryItemIds[id];
        if (inventoryItemId) {
            try {
                // Delete from backend using inventory_item_id
                await deleter(`/api/v1/inventory-items/${inventoryItemId}`);
                toast.success('Item deleted successfully');
            } catch (error) {
                console.error('Error deleting inventory item:', error);
                toast.error('Failed to delete item');
                return;
            }
        }

        // Remove from UI state
        setTransferredIds((prev) => prev.filter((i) => i !== id));
        setQuantities((prev) => {
            const newQty = { ...prev };
            delete newQty[id];
            return newQty;
        });
        setInventoryItemIds((prev) => {
            const newIds = { ...prev };
            delete newIds[id];
            return newIds;
        });
    };

    // Handle quantity change
    const handleQuantityChange = (id: string, value: string) => {
        setQuantities((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Build transfer data
    const buildTransferData = (): IInventoryItemInput[] => {
        return transferredIds.map((id) => ({
            ingredient_id: id,
            counted_quantity: String(quantities[id]),
        }));
    };

    const actionButtonSx = {
        minWidth: 100,
        height: 40,
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
                setInventoryItems(result);

                // Store inventory_item_ids for deletion later
                const newInventoryItemIds: Record<string, string> = {};
                result.forEach((item) => {
                    newInventoryItemIds[item.ingredient_id] = item.inventory_item_id || '';
                });
                setInventoryItemIds(newInventoryItemIds);

                if (onDetailsChange) {
                    onDetailsChange(itemsData);
                }

                // Apply inventory (call /api/v1/inventories/{id}/apply)
                const applyResult = await applyInventory(inventoryId);
                if (applyResult) {
                    toast.success(t('success.applied') || 'Inventory applied successfully');
                    // Pass POST response data to parent - don't fetch again via GET
                    if (onApplySuccess) {
                        onApplySuccess(result);
                    }
                }

                if (onSuccess) {
                    onSuccess();
                }
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
                            <Box sx={{ width: '50%' }}>{t('calculation.productName', 'Product Name')}</Box>
                            <Box sx={{ width: '20%' }}>{t('calculation.unit', 'Unit')}</Box>
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
                                        <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                        <Box sx={{ width: '20%' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {ingredient.measurement}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ width: '30%', textAlign: 'right' }}>
                                            <Typography variant="caption">{formatPrice(parseFloat(ingredient.price_per_unit))}</Typography>
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
                                                value={quantities[ingredient.id]}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        ingredient.id,
                                                        e.target.value
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


            {/* RESULTS TABLE - Shows after saving */}
            {inventoryItems.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {t('inventory.calculationResults', 'Calculation Results')}
                    </Typography> */}
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(9, 1fr)',
                                    p: 1.5,
                                    bgcolor: 'action.hover',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    color: 'text.primary',
                                    minWidth: 1200,
                                }}
                            >
                                <Box>{t('calculation.productName', 'Product')}</Box>
                                <Box sx={{ textAlign: 'center' }}>{t('calculation.unit', 'Unit')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.systemQty', 'System Qty')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.countedQty', 'Counted Qty')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.difference', 'Difference')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.pricePerUnit', 'Price/Unit')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.surplus', 'Surplus')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.shortage', 'Shortage')}</Box>
                                <Box sx={{ textAlign: 'right' }}>{t('calculation.remaining', 'Remaining')}</Box>
                                {/* <Box sx={{ textAlign: 'center' }}>Action</Box> */}
                            </Box>
                        </Box>
                        <Divider />
                        <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                            {inventoryItems.map((item) => (
                                <Box
                                    key={item.inventory_item_id}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(9, 1fr)',
                                        alignItems: 'center',
                                        p: 1.5,
                                        borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                        '&:hover': { bgcolor: 'action.hover' },
                                        minWidth: 1200,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {item.ingredient_name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.ingredient_measurement}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2">{item.system_quantity}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.counted_quantity}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color:
                                                    item.difference_quantity > 0
                                                        ? 'success.main'
                                                        : item.difference_quantity < 0
                                                            ? 'error.main'
                                                            : 'text.secondary',
                                            }}
                                        >
                                            {item.difference_quantity}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption">
                                            {formatPrice(parseFloat(item.price_per_unit))}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: 'success.main', fontWeight: 600 }}
                                        >
                                            {formatPrice(parseFloat(item.surplus_amount))}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: 'error.main', fontWeight: 600 }}
                                        >
                                            {formatPrice(parseFloat(item.shortage_amount))}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2">
                                            {formatPrice(parseFloat(item.remaining_amount))}
                                        </Typography>
                                    </Box>
                                    {/* <Box sx={{ textAlign: 'center' }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setInventoryItems([]);
                                                setTransferredIds([]);
                                                setQuantities({});
                                            }}
                                            sx={{ color: 'warning.main' }}
                                        >
                                            <Iconify icon="solar:pen-bold" width={18} />
                                        </IconButton>
                                    </Box> */}
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    {/* ACTION BUTTONS - Below results table */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setInventoryItems([]);
                                navigate(paths.menu.inventory.root);
                            }}
                            sx={actionButtonSx}
                        >
                            {t('common.back', 'Back')}
                        </Button>
                        <Button
                            // variant="contained"
                            onClick={handleSave}
                            disabled={transferredIds.length === 0 || isSaving}
                            sx={{
                                ...actionButtonSx,
                                position: 'relative',
                                backgroundColor: '#FB6633',
                                color: '#FFFFFF',
                                // boxShadow: theme.shadows[4],
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
            )}

            {/* ACTION BUTTONS - When no results table */}
            {inventoryItems.length === 0 && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={transferredIds.length === 0 || isSaving}
                        sx={{
                            ...actionButtonSx,
                            position: 'relative',
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

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setInventoryItems([]);
                            navigate(paths.menu.inventory.root);
                        }}
                        sx={actionButtonSx}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default InventoryDetailsCalculation;
