// Bu fayl inventory-details-calculation bilan bir xil UI struktuasiga ega ProductCalculator komponentini saqlab turadi
// Fon har xil - product pricing va calculation logic

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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetcher, endpoints, putter } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import { useGetCompounds, useGetCompoundCalculations, useCreateCompoundCalculation, useDeleteCompoundCalculation, useGetCompoundWithCalculations } from 'src/hooks/use-compounds';
import { useGetMealCalculations, useCreateMealCalculation, useDeleteMealCalculation, useGetMealWithCalculations } from 'src/hooks/use-meals';

// --- TYPES ---
interface ICalculation {
    id: string;
    ingredient_id: string;
    component_compound_id?: string;
    quantity: string;
    measurement_unit: string;
    price_per_unit: string;
    total_cost: string;
    created_at: string;
    updated_at: string;
}

interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    brand_id: string;
    group_id: string;
    picture_url: string;
    price_per_unit?: string | number;
    name_i18n?: string;
    color_code?: string;
    created_at?: string;
    updated_at?: string;
}

interface IngredientGroup {
    id: string;
    name: string;
    picture_url: string;
    color_code: string;
    created_at: string;
    updated_at: string;
}

interface Product extends Ingredient {
    price_per_unit: number;
    group_name?: string;
}

interface CompoundProduct {
    id: string;
    name: string;
    price: string;
    measurement: string;
    quantity: number;
    department_id: string;
    department_name?: string;
    price_per_unit: number;
}

type SubTabType = 'ingredients' | 'semifinished';

interface ProductCalculatorProps {
    compoundId?: string;
    mealId?: string;
    onEntityCreated?: (entityId: string) => void;
    onCalculationsReady?: (calculations: {
        ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
        compound_calculations?: Array<{ compound_id: string; quantity: string }>;
    }) => void;
    onSaveWithGood?: (goodData: any) => Promise<void>;
    onUpdateWithGood?: (goodData: any) => Promise<void>;
    showTotalsSummary?: boolean;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
};

const ProductCalculator = ({
    compoundId,
    mealId,
    onEntityCreated,
    onCalculationsReady,
    onSaveWithGood,
    onUpdateWithGood,
    showTotalsSummary = true,
}: ProductCalculatorProps) => {
    const { t } = useTranslation('menu');
    const theme = useTheme();

    const entityType = compoundId ? 'compound' : mealId ? 'meal' : undefined;
    const entityId = compoundId || mealId;

    // Sub-tab state
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('ingredients');

    // --- INGREDIENTS TAB STATE ---
    const [ingredients, setIngredients] = useState<Product[]>([]);
    const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [rightSearchTerm, setRightSearchTerm] = useState('');
    const [showCalculation, setShowCalculation] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    // --- SEMIFINISHED TAB STATE ---
    const { compounds, compoundsLoading } = useGetCompounds();
    const [sfSelectedIds, setSfSelectedIds] = useState<string[]>([]);
    const [sfTransferredIds, setSfTransferredIds] = useState<string[]>([]);
    const [sfQuantities, setSfQuantities] = useState<Record<string, number>>({});
    const [sfSearchTerm, setSfSearchTerm] = useState('');
    const [sfShowCalculation, setSfShowCalculation] = useState(false);

    // --- API HOOKS ---
    const { compoundWithCalculations, loading: compoundWithCalculationsLoading, mutate: mutateCompoundWithCalculations } = useGetCompoundWithCalculations(compoundId);
    const { mealWithCalculations, loading: mealWithCalculationsLoading, mutate: mutateMealWithCalculations } = useGetMealWithCalculations(mealId);

    const { calculations: compoundCalculations, calculationsLoading: compoundCalculationsLoading, mutate: mutateCompoundCalculations } = useGetCompoundCalculations(compoundId);
    const { createCalculation: createCompoundCalculation } = useCreateCompoundCalculation();
    const { deleteCalculation: deleteCompoundCalculation } = useDeleteCompoundCalculation();

    const { calculations: mealCalculations, calculationsLoading: mealCalculationsLoading, mutate: mutateMealCalculations } = useGetMealCalculations(mealId);
    const { createCalculation: createMealCalculation } = useCreateMealCalculation();
    const { deleteCalculation: deleteMealCalculation } = useDeleteMealCalculation();

    const calculations: ICalculation[] = useMemo(() => {
        if (entityType === 'compound' && compoundWithCalculations) {
            return compoundWithCalculations.calculations as ICalculation[];
        } else if (entityType === 'meal' && mealWithCalculations) {
            return mealWithCalculations.calculations as ICalculation[];
        } else if (entityType === 'compound') {
            return compoundCalculations as ICalculation[];
        } else {
            return mealCalculations as ICalculation[];
        }
    }, [entityType, compoundWithCalculations, mealWithCalculations, compoundCalculations, mealCalculations]);

    const ingredientCalculations = useMemo(() => {
        return calculations?.filter(calc => calc.ingredient_id && !calc.component_compound_id) || [];
    }, [calculations]);

    const compoundCalculationsList = useMemo(() => {
        return calculations?.filter(calc => calc.component_compound_id) || [];
    }, [calculations]);

    const calculationsLoading = entityType === 'compound'
        ? (compoundWithCalculationsLoading || compoundCalculationsLoading)
        : (mealWithCalculationsLoading || mealCalculationsLoading);

    const mutateCalculations = entityType === 'compound'
        ? mutateCompoundWithCalculations
        : mutateMealWithCalculations;

    const backendTotalCost = entityType === 'compound'
        ? compoundWithCalculations?.total_cost
        : mealWithCalculations?.total_cost;
    const backendProfit = entityType === 'compound'
        ? compoundWithCalculations?.profit
        : mealWithCalculations?.profit;
    const backendProfitMargin = entityType === 'compound'
        ? compoundWithCalculations?.profit_margin
        : mealWithCalculations?.profit_margin;

    const goodPrice = entityType === 'compound'
        ? parseFloat(compoundWithCalculations?.price || '0')
        : parseFloat(mealWithCalculations?.price || '0');

    // Load ingredients
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const [ingredientsResponse, ingredientGroupsResponse] = await Promise.all([
                    fetcher<any>(endpoints.ingredient.list),
                    fetcher<any>(endpoints.ingredientGroups.list),
                ]);

                let ingredientsData: Ingredient[] = [];
                if (Array.isArray(ingredientsResponse)) {
                    ingredientsData = ingredientsResponse;
                } else if (ingredientsResponse?.data && Array.isArray(ingredientsResponse.data)) {
                    ingredientsData = ingredientsResponse.data;
                }

                let ingredientGroupsData: IngredientGroup[] = [];
                if (Array.isArray(ingredientGroupsResponse)) {
                    ingredientGroupsData = ingredientGroupsResponse;
                } else if (ingredientGroupsResponse?.data && Array.isArray(ingredientGroupsResponse.data)) {
                    ingredientGroupsData = ingredientGroupsResponse.data;
                }

                const groupNameMap = new Map<string, string>();
                ingredientGroupsData.forEach(group => {
                    groupNameMap.set(group.id, group.name);
                });

                const enrichedIngredients = (Array.isArray(ingredientsData) ? ingredientsData : [])
                    .map(ingredient => ({
                        ...ingredient,
                        price_per_unit: parseFloat(ingredient.price_per_unit?.toString() || '0'),
                        group_name: groupNameMap.get(ingredient.group_id) || '',
                    }));

                setIngredients(enrichedIngredients);
                setIngredientGroups(ingredientGroupsData);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [t]);

    // Load existing ingredient calculations
    useEffect(() => {
        if (!entityId || calculationsLoading) return;

        if (ingredientCalculations && ingredientCalculations.length > 0) {
            const calcMap = new Map<string, { id: string; quantity: number; updated_at: string }>();
            ingredientCalculations.forEach(calc => {
                const existing = calcMap.get(calc.ingredient_id);
                if (!existing || (calc.updated_at && existing.updated_at && calc.updated_at > existing.updated_at)) {
                    calcMap.set(calc.ingredient_id, {
                        id: calc.id,
                        quantity: parseFloat(calc.quantity),
                        updated_at: calc.updated_at || ''
                    });
                }
            });

            const calcIngredientIds = Array.from(calcMap.keys());
            const calcQuantities: Record<string, number> = {};

            calcMap.forEach((value, key) => {
                calcQuantities[key] = value.quantity;
            });

            const uniqueIds = Array.from(new Set(calcIngredientIds));
            setTransferredIds(uniqueIds);
            setQuantities(calcQuantities);
            setShowCalculation(true);
        } else if (ingredientCalculations && ingredientCalculations.length === 0 && transferredIds.length > 0) {
            setTransferredIds([]);
            setQuantities({});
            setShowCalculation(false);
        }
    }, [entityId, ingredientCalculations, calculationsLoading]);

    // Load existing compound calculations
    useEffect(() => {
        if (!entityId || calculationsLoading) return;

        if (compoundCalculationsList && compoundCalculationsList.length > 0) {
            const calcMap = new Map<string, { id: string; quantity: number; updated_at: string }>();
            compoundCalculationsList.forEach(calc => {
                if (calc.component_compound_id) {
                    const existing = calcMap.get(calc.component_compound_id);
                    if (!existing || (calc.updated_at && existing.updated_at && calc.updated_at > existing.updated_at)) {
                        calcMap.set(calc.component_compound_id, {
                            id: calc.id,
                            quantity: parseFloat(calc.quantity),
                            updated_at: calc.updated_at || ''
                        });
                    }
                }
            });

            const calcCompoundIds = Array.from(calcMap.keys());
            const calcQuantities: Record<string, number> = {};

            calcMap.forEach((value, key) => {
                calcQuantities[key] = value.quantity;
            });

            const uniqueIds = Array.from(new Set(calcCompoundIds));
            setSfTransferredIds(uniqueIds);
            setSfQuantities(calcQuantities);
            setSfShowCalculation(true);
        } else if (compoundCalculationsList && compoundCalculationsList.length === 0 && sfTransferredIds.length > 0) {
            setSfTransferredIds([]);
            setSfQuantities({});
            setSfShowCalculation(false);
        }
    }, [entityId, compoundCalculationsList, calculationsLoading]);

    // Create calculation
    const createCalculation = async (payload: {
        compound_id?: string;
        good_id?: string;
        ingredient_id?: string;
        compound_to_add_id?: string;
        quantity: string
    }) => {
        if (entityType === 'compound' && compoundId) {
            return await createCompoundCalculation({
                compound_id: compoundId,
                ingredient_id: payload.ingredient_id,
                compound_to_add_id: payload.compound_to_add_id,
                quantity: payload.quantity,
            });
        } else if (entityType === 'meal' && mealId) {
            return await createMealCalculation({
                good_id: mealId,
                ingredient_id: payload.ingredient_id,
                compound_to_add_id: payload.compound_to_add_id,
                quantity: payload.quantity,
            });
        }
        throw new Error('No entity ID provided');
    };

    const deleteCalculation = async (calculationId: string) => {
        if (entityType === 'compound' && compoundId) {
            return await deleteCompoundCalculation(calculationId, compoundId);
        } else if (entityType === 'meal' && mealId) {
            return await deleteMealCalculation(calculationId, mealId);
        }
        throw new Error('No entity ID provided');
    };

    // --- INGREDIENTS HANDLERS ---
    const handleToggle = (id: string) => {
        const currentIndex = selectedIds.indexOf(id);
        const newChecked = [...selectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
            setQuantities(prev => ({ ...prev, [id]: 1 }));
        } else {
            newChecked.splice(currentIndex, 1);
            const newQuantities = { ...quantities };
            delete newQuantities[id];
            setQuantities(newQuantities);
        }

        setSelectedIds(newChecked);
    };

    const handleQuantityChange = (id: string, value: string) => {
        const newQuantity = parseFloat(value) || 0;
        setQuantities(prev => ({
            ...prev,
            [id]: newQuantity
        }));
    };

    const handleMoveRight = async () => {
        if (selectedIds.length > 0) {
            const newQuantities = { ...quantities };
            for (const id of selectedIds) {
                if (!newQuantities[id]) {
                    newQuantities[id] = 1;
                }
            }
            setQuantities(newQuantities);

            if (entityId) {
                try {
                    for (const ingredientId of selectedIds) {
                        const existingCalculation = ingredientCalculations?.find(calc => calc.ingredient_id === ingredientId);

                        if (existingCalculation) {
                            await deleteCalculation(existingCalculation.id);
                        }

                        const quantity = newQuantities[ingredientId] || 1;
                        await createCalculation({
                            ingredient_id: ingredientId,
                            quantity: String(quantity),
                        });
                    }
                    await mutateCalculations();
                } catch (error) {
                    console.error('Error saving calculations:', error);
                }
            }

            const newIds = selectedIds.filter(id => !transferredIds.includes(id));
            setTransferredIds([...transferredIds, ...newIds]);
            setSelectedIds([]);
        }
    };

    const handleMoveLeft = async () => {
        if (entityId && ingredientCalculations && ingredientCalculations.length > 0) {
            try {
                await Promise.all(
                    ingredientCalculations.map(calc => deleteCalculation(calc.id))
                );
            } catch (error) {
                console.error('Error deleting calculations:', error);
                toast.error(t('error.deleteFailed', 'Failed to delete some calculations'));
            }
        }

        setTransferredIds([]);
        setQuantities({});
        setShowCalculation(false);
    };

    // --- SEMIFINISHED HANDLERS ---
    const handleSfToggle = (id: string) => {
        const currentIndex = sfSelectedIds.indexOf(id);
        const newChecked = [...sfSelectedIds];

        if (currentIndex === -1) {
            newChecked.push(id);
            setSfQuantities(prev => ({ ...prev, [id]: 1 }));
        } else {
            newChecked.splice(currentIndex, 1);
            const newQuantities = { ...sfQuantities };
            delete newQuantities[id];
            setSfQuantities(newQuantities);
        }

        setSfSelectedIds(newChecked);
    };

    const handleSfQuantityChange = (id: string, value: string) => {
        const newQuantity = parseFloat(value) || 0;
        setSfQuantities(prev => ({
            ...prev,
            [id]: newQuantity
        }));
    };

    const handleSfMoveRight = async () => {
        if (sfSelectedIds.length > 0) {
            if (entityId) {
                try {
                    for (const compoundToAddId of sfSelectedIds) {
                        const existingCalculation = compoundCalculationsList?.find(
                            calc => calc.component_compound_id === compoundToAddId
                        );

                        if (existingCalculation) {
                            await deleteCalculation(existingCalculation.id);
                        }

                        const quantity = sfQuantities[compoundToAddId] || 1;
                        await createCalculation({
                            compound_to_add_id: compoundToAddId,
                            quantity: String(quantity),
                        });
                    }
                    await mutateCalculations();
                } catch (error) {
                    console.error('Error saving calculations:', error);
                }
            }

            const newIds = sfSelectedIds.filter(id => !sfTransferredIds.includes(id));
            setSfTransferredIds([...sfTransferredIds, ...newIds]);
            setSfSelectedIds([]);
        }
    };

    const handleSfMoveLeft = async () => {
        if (entityId && compoundCalculationsList && compoundCalculationsList.length > 0) {
            try {
                await Promise.all(
                    compoundCalculationsList.map(calc => deleteCalculation(calc.id))
                );
            } catch (error) {
                console.error('Error deleting calculations:', error);
                toast.error(t('error.deleteFailed', 'Failed to delete some calculations'));
            }
        }

        setSfTransferredIds([]);
        setSfQuantities({});
        setSfShowCalculation(false);
    };

    // --- CALCULATED ROWS ---
    const calculatedRows = useMemo(() => {
        const uniqueIds = Array.from(new Set(transferredIds));

        return uniqueIds.map(id => {
            const ingredient = ingredients.find(p => p.id === id);
            if (!ingredient) return null;

            const calculation = ingredientCalculations?.find(calc => calc.ingredient_id === id);
            const pricePerUnit = calculation
                ? parseFloat(calculation.price_per_unit)
                : ingredient.price_per_unit;

            const qty = quantities[id] || 0;
            const total = calculation
                ? parseFloat(calculation.total_cost)
                : pricePerUnit * qty;

            return {
                ...ingredient,
                price_per_unit: pricePerUnit,
                qty,
                total,
                type: 'ingredient' as const
            };
        }).filter(row => row !== null) as Array<Product & { qty: number; total: number; type: 'ingredient' }>;
    }, [transferredIds, quantities, ingredients, ingredientCalculations]);

    const sfCalculatedRows = useMemo(() => {
        const uniqueIds = Array.from(new Set(sfTransferredIds));

        return uniqueIds.map(id => {
            const compound = compounds.find(p => p.id === id);
            if (!compound) return null;

            const calculation = compoundCalculationsList?.find(calc => calc.component_compound_id === id);
            const pricePerUnit = calculation
                ? parseFloat(calculation.price_per_unit)
                : parseFloat(String(compound.price || '0'));

            const qty = sfQuantities[id] || 0;
            const total = calculation
                ? parseFloat(calculation.total_cost)
                : pricePerUnit * qty;

            return {
                id: compound.id,
                name: compound.name,
                measurement: compound.measurement || 'kg',
                price_per_unit: pricePerUnit,
                qty,
                total,
                type: 'compound' as const
            };
        }).filter(row => row !== null) as Array<{ id: string; name: string; measurement: string; price_per_unit: number; qty: number; total: number; type: 'compound' }>;
    }, [sfTransferredIds, sfQuantities, compounds, compoundCalculationsList]);

    const allCalculatedRows = useMemo(() => {
        return [...calculatedRows, ...sfCalculatedRows];
    }, [calculatedRows, sfCalculatedRows]);

    const shouldUseBackendValues = allCalculatedRows.length === 0;
    const frontendGrandTotal = allCalculatedRows.length > 0
        ? allCalculatedRows.reduce((acc, row) => acc + row.total, 0)
        : 0;

    const grandTotal = frontendGrandTotal > 0
        ? frontendGrandTotal
        : (backendTotalCost ? parseFloat(backendTotalCost) : 0);

    const calculatedProfit = goodPrice - grandTotal;
    const displayProfit = goodPrice > 0 && shouldUseBackendValues === false
        ? calculatedProfit
        : (backendProfit !== undefined ? parseFloat(backendProfit) : 0);

    let displayProfitMarginValue: number;
    if (goodPrice > 0 && shouldUseBackendValues === false) {
        displayProfitMarginValue = (calculatedProfit / goodPrice) * 100;
    } else if (backendProfitMargin) {
        displayProfitMarginValue = parseFloat(backendProfitMargin);
    } else {
        displayProfitMarginValue = 0;
    }

    const displayProfitMargin = displayProfitMarginValue >= 0
        ? `${displayProfitMarginValue.toFixed(2)}%`
        : `${displayProfitMarginValue.toFixed(2)}%`;

    // Filtered compounds
    const filteredCompounds = useMemo(() => {
        return compounds.filter(c => {
            if (compoundId && c.id === compoundId) return false;
            return c.name.toLowerCase().includes(sfSearchTerm.toLowerCase()) && !sfTransferredIds.includes(c.id);
        });
    }, [compounds, compoundId, sfSearchTerm, sfTransferredIds]);

    // Filtered available ingredients
    const availableIngredients = useMemo(() => {
        return ingredients.filter(
            (ing) =>
                !transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!selectedGroupId || ing.group_id === selectedGroupId)
        );
    }, [ingredients, transferredIds, searchTerm, selectedGroupId]);

    // Filtered transferred ingredients
    const transferredIngredients = useMemo(() => {
        return ingredients.filter(
            (ing) =>
                transferredIds.includes(ing.id) &&
                ing.name.toLowerCase().includes(rightSearchTerm.toLowerCase())
        );
    }, [ingredients, transferredIds, rightSearchTerm]);

    return (
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            {/* SUB-TABS */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                gap: 4,
                borderBottom: `1px solid ${theme.vars.palette.divider}`,
                pb: 1
            }}>
                <Typography
                    variant="subtitle1"
                    onClick={() => setActiveSubTab('ingredients')}
                    sx={{
                        fontWeight: activeSubTab === 'ingredients' ? 'bold' : 'normal',
                        borderBottom: activeSubTab === 'ingredients' ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        color: activeSubTab === 'ingredients' ? 'text.primary' : 'text.secondary',
                        cursor: 'pointer',
                        pb: 0.5,
                        '&:hover': { color: 'text.primary' }
                    }}
                >
                    {t('calculation.content', 'Content')}
                </Typography>
                <Typography
                    variant="subtitle1"
                    onClick={() => setActiveSubTab('semifinished')}
                    sx={{
                        fontWeight: activeSubTab === 'semifinished' ? 'bold' : 'normal',
                        borderBottom: activeSubTab === 'semifinished' ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        color: activeSubTab === 'semifinished' ? 'text.primary' : 'text.secondary',
                        cursor: 'pointer',
                        pb: 0.5,
                        '&:hover': { color: 'text.primary' }
                    }}
                >
                    {t('calculation.semifinishedProducts', 'Semifinished')}
                </Typography>
            </Box>

            {/* INGREDIENTS TAB */}
            {activeSubTab === 'ingredients' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>
                    {/* LEFT SIDE */}
                    <Box>
                        <Box sx={{ mb: 2 }}>
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

                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                            <Box sx={{ display: 'flex', p: 1.5, bgcolor: 'action.hover', fontWeight: 'bold', fontSize: '0.875rem', color: 'text.primary' }}>
                                <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product')}</Box>
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
                                        {t('calculation.noProducts', 'No products')}
                                    </Typography>
                                ) : (
                                    availableIngredients.map((ingredient) => (
                                        <Box key={ingredient.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: `1px solid ${theme.vars.palette.divider}`, '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedIds.includes(ingredient.id)}
                                                    onChange={() => handleToggle(ingredient.id)}
                                                    sx={{ color: theme.palette.success.main, '&.Mui-checked': { color: theme.palette.success.main } }}
                                                />
                                                <Typography variant="body2">{ingredient.name}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="caption" color="text.secondary">{ingredient.measurement}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%', textAlign: 'right' }}>
                                                <Typography variant="caption">{formatPrice(ingredient.price_per_unit)}</Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* MIDDLE */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', pt: 5 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                            <IconButton
                                onClick={handleMoveRight}
                                disabled={selectedIds.length === 0}
                                sx={{
                                    bgcolor: selectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.action.hover,
                                    color: selectedIds.length === 0 ? theme.palette.text.disabled : theme.palette.warning.main,
                                    '&:hover': { bgcolor: selectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.light },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleMoveLeft}
                                disabled={transferredIds.length === 0}
                                sx={{
                                    bgcolor: transferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.action.hover,
                                    color: transferredIds.length === 0 ? theme.palette.text.disabled : theme.palette.warning.main,
                                    '&:hover': { bgcolor: transferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.light },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* RIGHT SIDE */}
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
                            <Box sx={{ display: 'flex', p: 1.5, bgcolor: 'action.hover', fontWeight: 'bold', fontSize: '0.875rem', color: 'text.primary' }}>
                                <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product')}</Box>
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
                                        <Box key={ingredient.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: `1px solid ${theme.vars.palette.divider}`, '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box sx={{ width: '40%' }}>
                                                <Typography variant="body2">{ingredient.name}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="caption" color="text.secondary">{ingredient.measurement}</Typography>
                                            </Box>
                                            <Box sx={{ width: '20%', textAlign: 'center' }}>
                                                <TextField
                                                    type="number"
                                                    value={quantities[ingredient.id] || 0}
                                                    onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
                                                    size="small"
                                                    inputProps={{ min: 0, step: 0.1 }}
                                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
                                                />
                                            </Box>
                                            <Box sx={{ width: '10%', textAlign: 'center' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setTransferredIds((prev) => prev.filter((i) => i !== ingredient.id));
                                                        const newQty = { ...quantities };
                                                        delete newQty[ingredient.id];
                                                        setQuantities(newQty);
                                                    }}
                                                    sx={{ color: 'error.main' }}
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
            )}

            {/* SEMIFINISHED TAB */}
            {activeSubTab === 'semifinished' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>
                    {/* LEFT SIDE */}
                    <Box>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                placeholder={t('calculation.search', 'Search...')}
                                size="small"
                                value={sfSearchTerm}
                                onChange={(e) => setSfSearchTerm(e.target.value)}
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
                            <Box sx={{ display: 'flex', p: 1.5, bgcolor: 'action.hover', fontWeight: 'bold', fontSize: '0.875rem', color: 'text.primary' }}>
                                <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product')}</Box>
                                <Box sx={{ width: '30%' }}>{t('calculation.unit', 'Unit')}</Box>
                                <Box sx={{ width: '30%', textAlign: 'right' }}>{t('calculation.price', 'Price')}</Box>
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {compoundsLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : filteredCompounds.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProducts', 'No products')}
                                    </Typography>
                                ) : (
                                    filteredCompounds.map((compound) => (
                                        <Box key={compound.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: `1px solid ${theme.vars.palette.divider}`, '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={sfSelectedIds.includes(compound.id)}
                                                    onChange={() => handleSfToggle(compound.id)}
                                                    sx={{ color: theme.palette.success.main, '&.Mui-checked': { color: theme.palette.success.main } }}
                                                />
                                                <Typography variant="body2">{compound.name}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%' }}>
                                                <Typography variant="caption" color="text.secondary">{compound.measurement || 'kg'}</Typography>
                                            </Box>
                                            <Box sx={{ width: '30%', textAlign: 'right' }}>
                                                <Typography variant="caption">{formatPrice(parseFloat(String(compound.price || '0')))}</Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* MIDDLE */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', pt: 5 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                            <IconButton
                                onClick={handleSfMoveRight}
                                disabled={sfSelectedIds.length === 0}
                                sx={{
                                    bgcolor: sfSelectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.action.hover,
                                    color: sfSelectedIds.length === 0 ? theme.palette.text.disabled : theme.palette.warning.main,
                                    '&:hover': { bgcolor: sfSelectedIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.light },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleSfMoveLeft}
                                disabled={sfTransferredIds.length === 0}
                                sx={{
                                    bgcolor: sfTransferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.action.hover,
                                    color: sfTransferredIds.length === 0 ? theme.palette.text.disabled : theme.palette.warning.main,
                                    '&:hover': { bgcolor: sfTransferredIds.length === 0 ? theme.palette.action.disabled : theme.palette.warning.light },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* RIGHT SIDE */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <TextField
                                fullWidth
                                placeholder={t('calculation.search', 'Search...')}
                                size="small"
                                value={sfSearchTerm}
                                onChange={(e) => setSfSearchTerm(e.target.value)}
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
                            <Box sx={{ display: 'flex', p: 1.5, bgcolor: 'action.hover', fontWeight: 'bold', fontSize: '0.875rem', color: 'text.primary' }}>
                                <Box sx={{ width: '40%' }}>{t('calculation.productName', 'Product')}</Box>
                                <Box sx={{ width: '30%' }}>{t('calculation.unitOfMeasurement', 'Unit')}</Box>
                                <Box sx={{ width: '20%', textAlign: 'center' }}>{t('calculation.quantity', 'Qty')}</Box>
                                <Box sx={{ width: '10%' }} />
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto', minHeight: 200 }}>
                                {calculationsLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : sfTransferredIds.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProductsSelected', 'No products selected')}
                                    </Typography>
                                ) : (
                                    sfTransferredIds.map((id) => {
                                        const compound = compounds.find(p => p.id === id);
                                        if (!compound) return null;

                                        return (
                                            <Box key={id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderBottom: `1px solid ${theme.vars.palette.divider}`, '&:hover': { bgcolor: 'action.hover' } }}>
                                                <Box sx={{ width: '40%' }}>
                                                    <Typography variant="body2">{compound.name}</Typography>
                                                </Box>
                                                <Box sx={{ width: '30%' }}>
                                                    <Typography variant="caption" color="text.secondary">{compound.measurement || 'kg'}</Typography>
                                                </Box>
                                                <Box sx={{ width: '20%', textAlign: 'center' }}>
                                                    <TextField
                                                        type="number"
                                                        value={sfQuantities[id] || 0}
                                                        onChange={(e) => handleSfQuantityChange(id, e.target.value)}
                                                        size="small"
                                                        inputProps={{ min: 0, step: 0.1 }}
                                                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
                                                    />
                                                </Box>
                                                <Box sx={{ width: '10%', textAlign: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSfTransferredIds((prev) => prev.filter((i) => i !== id));
                                                            const newQty = { ...sfQuantities };
                                                            delete newQty[id];
                                                            setSfQuantities(newQty);
                                                        }}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* TOTALS */}
            {showTotalsSummary && (showCalculation || sfShowCalculation) && (
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end', pr: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                        <Typography color="text.secondary" fontWeight="bold">{t('calculation.total', 'Total')}</Typography>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">{formatPrice(grandTotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                        <Typography color="text.secondary" fontWeight="bold">{t('calculation.profit', 'Profit')}</Typography>
                        <Typography fontWeight="bold" color={displayProfit < 0 ? 'error.main' : 'text.primary'}>{formatPrice(displayProfit)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                        <Typography color="text.secondary" fontWeight="bold">{t('calculation.profitMargin', 'Margin')}</Typography>
                        <Typography fontWeight="bold" color={parseFloat(displayProfitMargin) < 0 ? 'error.main' : 'text.primary'}>{displayProfitMargin}</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default ProductCalculator;
