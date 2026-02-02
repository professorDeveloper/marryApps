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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    InputAdornment,
    useTheme,
    Alert,
    CircularProgress,
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
            counted_quantity: quantities[id] || 0,
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
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('inventory.itemsCalculation')}
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
                {t('inventory.itemsCalculationHelp')}
            </Alert>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: 2,
                    mb: 3,
                }}
            >
                {/* LEFT PANEL - Available Ingredients */}
                <Paper
                    sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 500,
                        // background: theme.palette.mode === 'light' ? '#fafafa' : 'rgba(145, 158, 171, 0.12)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: theme.shadows[2],
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 4,
                                height: 24,
                                borderRadius: 1,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                            }}
                        />
                        {t('inventory.available')}
                    </Typography>

                    <TextField
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                        sx={{ mb: 2 }}
                    />

                    <TableContainer sx={{ flex: 1, mb: 2, overflow: 'auto', maxHeight: 400 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ width: 40 }}>
                                        <input
                                            ref={(el) => {
                                                if (el) {
                                                    (el as any).indeterminate =
                                                        selectedIds.length > 0 && selectedIds.length < availableIngredients.length;
                                                }
                                            }}
                                            type="checkbox"
                                            checked={
                                                availableIngredients.length > 0 &&
                                                selectedIds.length === availableIngredients.length
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(availableIngredients.map((i) => i.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        {t('name')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {availableIngredients.map((ing) => (
                                    <TableRow key={ing.id}>
                                        <TableCell padding="checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(ing.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds((prev) => [...prev, ing.id]);
                                                    } else {
                                                        setSelectedIds((prev) => prev.filter((i) => i !== ing.id));
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.875rem' }}>{ing.name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {availableIngredients.length === 0 && !loading && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            {t('inventory.noIngredients')}
                        </Typography>
                    )}
                </Paper>

                {/* MIDDLE PANEL - Arrows */}
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddIngredients}
                        disabled={selectedIds.length === 0}
                        endIcon={<ChevronRightIcon />}
                        sx={{
                            // background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            // boxShadow: theme.shadows[3],
                            transition: 'all 0.3s ease',
                            '&:hover:not(:disabled)': {
                                boxShadow: theme.shadows[6],
                                transform: 'translateX(2px)',
                            },
                            '&:disabled': {
                                opacity: 0.9,
                            },
                        }}
                    >
                        {t('add')}
                    </Button>
                </Box>

                {/* RIGHT PANEL - Transferred Items */}
                <Paper
                    sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 500,
                        // background: theme.palette.mode === 'light' ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : 'rgba(145, 158, 171, 0.08)',
                        border: `2px solid ${theme.palette.primary.main}20`,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: theme.shadows[3],
                            borderColor: theme.palette.primary.main,
                        },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 4,
                                height: 24,
                                borderRadius: 1,
                                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                            }}
                        />
                        {t('inventory.itemsToCount')}
                    </Typography>

                    <TextField
                        placeholder={t('search')}
                        value={rightSearchTerm}
                        onChange={(e) => setRightSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                        sx={{ mb: 2 }}
                    />

                    <TableContainer sx={{ flex: 1, mb: 2, overflow: 'auto', maxHeight: 400 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        {t('name')}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, width: 100 }}>
                                        {t('inventory.counted')}
                                    </TableCell>
                                    <TableCell sx={{ width: 40 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transferredIngredients.map((ing) => (
                                    <TableRow
                                        key={ing.id}
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'light' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.12)',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ fontSize: '0.875rem' }}>{ing.name}</TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={quantities[ing.id]}
                                                onChange={(e) => handleQuantityChange(ing.id, parseFloat(e.target.value))}
                                                size="small"
                                                inputProps={{ min: 1, step: 0.1 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        transition: 'all 0.2s ease',
                                                        '&:hover fieldset': {
                                                            borderColor: theme.palette.primary.main,
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: theme.palette.primary.main,
                                                            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                                                        },
                                                    },
                                                    width: 100,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveIngredient(ing.id)}
                                                color="error"
                                                sx={{
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                                        transform: 'scale(1.1)',
                                                    },
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {transferredIngredients.length === 0 && transferredIds.length > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            {t('inventory.noMatches')}
                        </Typography>
                    )}

                    {transferredIds.length === 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                            {t('inventory.noItemsSelected')}
                        </Typography>
                    )}
                </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Summary Section */}
            <Box
                sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    background: theme.palette.mode === 'light' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.08)',
                    border: `1px solid ${theme.palette.primary.main}30`,
                    transition: 'all 0.3s ease',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 3,
                            height: 20,
                            borderRadius: 0.5,
                            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                        }}
                    />
                    {t('inventory.summary')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('inventory.itemsCount')}: <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{transferredIds.length}</Box>
                </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
                {/* <Button
                    variant="outlined"
                    color="inherit"
                    disabled={isSaving}
                    sx={{
                        transition: 'all 0.2s ease',
                        '&:hover:not(:disabled)': {
                            borderColor: theme.palette.text.primary,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        },
                    }}
                >
                    {t('common.cancel')}
                </Button> */}
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={transferredIds.length === 0 || isSaving}
                    sx={{
                        position: 'relative',
                        minWidth: 120,
                        background: ``,
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
