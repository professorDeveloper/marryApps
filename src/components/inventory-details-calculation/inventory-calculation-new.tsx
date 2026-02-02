import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
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
    Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'sonner';
import { useInventoryAPI } from 'src/hooks/use-inventory-api';
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

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

interface InventoryCalculationProps {
    inventoryId: string;
    onSuccess?: () => void;
    onDetailsChange?: (details: any[]) => void;
    isNewInventory?: boolean;
    persistedDetails?: IInventoryItem[];
}

export function InventoryDetailsCalculation({
    inventoryId,
    onSuccess,
    onDetailsChange,
    isNewInventory,
    persistedDetails,
}: InventoryCalculationProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();

    // LEFT PANEL (available ingredients)
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // MIDDLE: quantity inputs
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // RIGHT PANEL (transferred items)
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [rightSearchTerm, setRightSearchTerm] = useState('');

    // Calculation table display
    const [showCalculation, setShowCalculation] = useState(false);

    const prevCalculationsRef = useRef<string>('');

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
            setShowCalculation(true);
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
                    [id]: 1,
                }));
            }
        });
        setSelectedIds([]);
    };

    // Handle remove all ingredients
    const handleRemoveAll = () => {
        setTransferredIds([]);
        setQuantities({});
        setShowCalculation(false);
    };

    // Handle toggle checkbox
    const handleToggle = (id: string) => {
        const currentIndex = selectedIds.indexOf(id);
        const newChecked = [...selectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
            setQuantities((prev) => ({ ...prev, [id]: 1 }));
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setSelectedIds(newChecked);
    };

    // Handle quantity change
    const handleQuantityChange = (id: string, value: string) => {
        const newValue = parseFloat(value) || 0;
        setQuantities((prev) => ({
            ...prev,
            [id]: newValue,
        }));
    };

    // Handle calculate click
    const handleCalculate = async () => {
        if (transferredIds.length === 0) {
            toast.error(t('inventory.selectItems'));
            return;
        }

        try {
            setShowCalculation(true);

            // Prepare items data
            const items = transferredIds.map((id) => ({
                ingredient_id: id,
                counted_quantity: quantities[id] || 0,
            }));

            // Save items
            if (inventoryId) {
                await useInventoryAPI().createInventoryItemsBatch(inventoryId, items);
                toast.success(t('success.itemsAdded'));
                onDetailsChange?.(items);
                onSuccess?.();
            }
        } catch (error) {
            console.error('Error saving items:', error);
            toast.error(t('error.saveFailed'));
        }
    };

    // Handle delete item
    const handleDeleteItem = (id: string) => {
        setTransferredIds((prev) => prev.filter((item) => item !== id));
        const newQuantities = { ...quantities };
        delete newQuantities[id];
        setQuantities(newQuantities);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>
                {/* LEFT PANEL - Available Ingredients */}
                <Box>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={t('calculation.search')}
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

                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                        <Box
                            sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                            }}
                        >
                            <Box sx={{ width: '10%' }}>✓</Box>
                            <Box sx={{ width: '60%' }}>{t('calculation.productName')}</Box>
                            <Box sx={{ width: '30%', textAlign: 'right' }}>{t('calculation.price')}</Box>
                        </Box>
                        <Divider />

                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {loading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : availableIngredients.length === 0 ? (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    {t('calculation.noProducts')}
                                </Typography>
                            ) : (
                                availableIngredients.map((ingredient) => (
                                    <Box
                                        key={ingredient.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderBottom: `1px solid ${theme.palette.divider}`,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Box sx={{ width: '10%' }}>
                                            <Checkbox
                                                size="small"
                                                checked={selectedIds.includes(ingredient.id)}
                                                onChange={() => handleToggle(ingredient.id)}
                                            />
                                        </Box>
                                        <Box sx={{ width: '60%' }}>
                                            <Typography variant="body2">{ingredient.name}</Typography>
                                        </Box>
                                        <Box sx={{ width: '30%', textAlign: 'right' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {ingredient.price_per_unit || '0'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* MIDDLE - Transfer Buttons */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', pt: 5 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                        <IconButton
                            onClick={handleAddIngredients}
                            disabled={selectedIds.length === 0}
                            sx={{
                                bgcolor: selectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.main,
                                color: '#fff',
                                '&:hover': {
                                    bgcolor: selectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.dark,
                                },
                                borderRadius: '50%',
                                padding: '10px',
                            }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleRemoveAll}
                            disabled={transferredIds.length === 0}
                            sx={{
                                bgcolor: transferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.error.main,
                                color: '#fff',
                                '&:hover': {
                                    bgcolor: transferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.error.dark,
                                },
                                borderRadius: '50%',
                                padding: '10px',
                            }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* RIGHT PANEL - Selected Ingredients with Quantities */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            {t('inventory.items')}
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleCalculate}
                            disabled={transferredIds.length === 0}
                        >
                            {t('calculation.calculate')}
                        </Button>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={t('calculation.search')}
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
                            }}
                        >
                            <Box sx={{ width: '50%' }}>{t('calculation.productName')}</Box>
                            <Box sx={{ width: '30%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
                            <Box sx={{ width: '20%', textAlign: 'center' }}>Actions</Box>
                        </Box>
                        <Divider />

                        <Box sx={{ maxHeight: 400, overflowY: 'auto', minHeight: 150 }}>
                            {transferredIngredients.length === 0 ? (
                                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    {t('calculation.noProductsSelected')}
                                </Typography>
                            ) : (
                                transferredIngredients.map((ingredient) => (
                                    <Box
                                        key={ingredient.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderBottom: `1px solid ${theme.palette.divider}`,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Box sx={{ width: '50%' }}>
                                            <Typography variant="body2">{ingredient.name}</Typography>
                                        </Box>
                                        <Box sx={{ width: '30%' }}>
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={quantities[ingredient.id] || 0}
                                                onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                                                inputProps={{ step: '0.01', min: '0' }}
                                            />
                                        </Box>
                                        <Box sx={{ width: '20%', textAlign: 'center' }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteItem(ingredient.id)}
                                                color="error"
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

            {/* CALCULATION TABLE */}
            {showCalculation && transferredIds.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ingredient</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        Quantity
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        Unit
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transferredIngredients.map((ingredient) => (
                                    <TableRow key={ingredient.id} hover>
                                        <TableCell>{ingredient.name}</TableCell>
                                        <TableCell align="right">{quantities[ingredient.id] || 0}</TableCell>
                                        <TableCell align="right">{ingredient.measurement}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
}

export default InventoryDetailsCalculation;
