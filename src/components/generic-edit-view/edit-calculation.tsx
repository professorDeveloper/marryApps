import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Select,
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
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import { fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import { useGetCompounds, useGetCompoundCalculations, useCreateCompoundCalculation, useDeleteCompoundCalculation, useGetCompoundWithCalculations, type ICompoundCalculation } from 'src/hooks/use-compounds';
import { useGetMealCalculations, useCreateMealCalculation, useDeleteMealCalculation, useGetMealWithCalculations, type IMealCalculation } from 'src/hooks/use-meals';

// --- TYPES ---
interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

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
}

interface IngredientGroup {
    id: string;
    name: string;
    picture_url: string;
    color_code: string;
    created_at: string;
    updated_at: string;
}

interface InvoiceDetail {
    id: string;
    ingredient_id: string;
    quantity: number;
    price: string;
    price_per_unit: string;
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

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
};

interface ProductCalculatorProps {
    compoundId?: string;
    mealId?: string;
    // NEW: Allow parent to notify when entity is created
    onEntityCreated?: (entityId: string) => void;
}

// Sub-tab type
type SubTabType = 'ingredients' | 'semifinished';

const ProductCalculator = ({ compoundId, mealId, onEntityCreated }: ProductCalculatorProps) => {
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
    const [showCalculation, setShowCalculation] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    // --- SEMIFINISHED TAB STATE ---
    const { compounds, compoundsLoading } = useGetCompounds();
    const [sfSelectedIds, setSfSelectedIds] = useState<string[]>([]);
    const [sfTransferredIds, setSfTransferredIds] = useState<string[]>([]);
    const [sfQuantities, setSfQuantities] = useState<Record<string, number>>({});
    const [sfSearchTerm, setSfSearchTerm] = useState('');
    const [sfShowCalculation, setSfShowCalculation] = useState(false);

    // Track pending calculations when no entityId
    const [pendingCalculations, setPendingCalculations] = useState<Array<{
        ingredient_id?: string;
        compound_to_add_id?: string;
        quantity: number;
    }>>([]);

    const prevCalculationsRef = useRef<string>('');

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

    // Split calculations into ingredient and compound based
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

    // Create calculation - supports both ingredient and compound
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

    // Load ingredients data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const [ingredientsResponse, invoiceDetailsResponse, ingredientGroupsResponse] = await Promise.all([
                    fetcher<BackendResponse<Ingredient[]> | Ingredient[]>(endpoints.ingredient.list),
                    fetcher<BackendResponse<InvoiceDetail[]> | InvoiceDetail[]>(endpoints.invoice.details),
                    fetcher<BackendResponse<IngredientGroup[]> | IngredientGroup[]>(endpoints.ingredientGroups.list),
                ]);

                let ingredientsData: Ingredient[] = [];
                if (Array.isArray(ingredientsResponse)) {
                    ingredientsData = ingredientsResponse;
                } else if (ingredientsResponse?.data && Array.isArray(ingredientsResponse.data)) {
                    ingredientsData = ingredientsResponse.data;
                }

                let invoiceDetailsData: InvoiceDetail[] = [];
                if (Array.isArray(invoiceDetailsResponse)) {
                    invoiceDetailsData = invoiceDetailsResponse;
                } else if (invoiceDetailsResponse?.data && Array.isArray(invoiceDetailsResponse.data)) {
                    invoiceDetailsData = invoiceDetailsResponse.data;
                }

                const priceMap = new Map<string, number>();
                invoiceDetailsData.forEach(detail => {
                    priceMap.set(detail.ingredient_id, parseFloat(detail.price_per_unit));
                });

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
                        price_per_unit: priceMap.get(ingredient.id) || 0,
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
        if (!entityId) {
            if (transferredIds.length > 0) {
                setPendingCalculations(prev => [
                    ...prev.filter(p => p.compound_to_add_id),
                    ...transferredIds.map(id => ({
                        ingredient_id: id,
                        quantity: quantities[id] || 0
                    }))
                ]);
            }
            prevCalculationsRef.current = '';
            return;
        }

        if (calculationsLoading) return;

        const calculationsStr = JSON.stringify(ingredientCalculations?.map(calc => ({
            id: calc.id,
            ingredient_id: calc.ingredient_id,
            quantity: calc.quantity,
        })).sort((a, b) => a.ingredient_id.localeCompare(b.ingredient_id)));

        if (prevCalculationsRef.current === calculationsStr) {
            return;
        }

        prevCalculationsRef.current = calculationsStr;

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
            setPendingCalculations(prev => prev.filter(p => p.compound_to_add_id));
        } else if (ingredientCalculations && ingredientCalculations.length === 0 && transferredIds.length > 0) {
            setTransferredIds([]);
            setQuantities({});
            setShowCalculation(false);
            setPendingCalculations(prev => prev.filter(p => p.compound_to_add_id));
        }
    }, [entityId, ingredientCalculations, calculationsLoading]);

    // Load existing compound calculations
    useEffect(() => {
        if (!entityId) {
            return;
        }

        if (calculationsLoading) return;

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

    // Save pending calculations when entity is created
    useEffect(() => {
        const savePendingCalculations = async () => {
            if (!entityId || pendingCalculations.length === 0) return;

            try {
                console.log('Saving pending calculations:', pendingCalculations);

                for (const calc of pendingCalculations) {
                    if (calc.quantity > 0) {
                        await createCalculation({
                            ingredient_id: calc.ingredient_id,
                            compound_to_add_id: calc.compound_to_add_id,
                            quantity: String(calc.quantity),
                        });
                    }
                }

                await mutateCalculations();
                setPendingCalculations([]);
                toast.success(t('calculation.savedSuccessfully', 'Calculations saved successfully'));
            } catch (error) {
                console.error('Error saving pending calculations:', error);
                toast.error(t('error.saveFailed', 'Failed to save calculations'));
            }
        };

        savePendingCalculations();
    }, [entityId, pendingCalculations, createCalculation, mutateCalculations, t]);

    // --- INGREDIENT HANDLERS ---
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
            if (entityId) {
                try {
                    for (const ingredientId of selectedIds) {
                        const existingCalculation = ingredientCalculations?.find(calc => calc.ingredient_id === ingredientId);

                        if (existingCalculation) {
                            await deleteCalculation(existingCalculation.id);
                        }

                        const quantity = quantities[ingredientId] || 1;
                        await createCalculation({
                            ingredient_id: ingredientId,
                            quantity: String(quantity),
                        });
                    }
                    await mutateCalculations();
                } catch (error) {
                    console.error('Error saving calculations:', error);
                }
            } else {
                const newPending = selectedIds.map(id => ({
                    ingredient_id: id,
                    quantity: quantities[id] || 1
                }));
                setPendingCalculations(prev => [...prev, ...newPending]);
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
        setPendingCalculations(prev => prev.filter(p => p.compound_to_add_id));
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
            } else {
                const newPending = sfSelectedIds.map(id => ({
                    compound_to_add_id: id,
                    quantity: sfQuantities[id] || 1
                }));
                setPendingCalculations(prev => [...prev, ...newPending]);
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
        setPendingCalculations(prev => prev.filter(p => p.ingredient_id));
    };

    // --- CALCULATED ROWS FOR INGREDIENTS ---
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

    // --- CALCULATED ROWS FOR SEMIFINISHED ---
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

    // Combined calculated rows for the total display
    const allCalculatedRows = useMemo(() => {
        return [...calculatedRows, ...sfCalculatedRows];
    }, [calculatedRows, sfCalculatedRows]);

    // If there are no calculated rows, use backend values
    const shouldUseBackendValues = allCalculatedRows.length === 0;

    const grandTotal = allCalculatedRows.length > 0
        ? allCalculatedRows.reduce((acc, row) => acc + row.total, 0)
        : (backendTotalCost ? parseFloat(backendTotalCost) : 0);

    const displayProfit = shouldUseBackendValues
        ? (backendProfit !== undefined ? parseFloat(backendProfit) : 0)
        : backendProfit !== undefined ? parseFloat(backendProfit) : 0;

    const displayProfitMargin = shouldUseBackendValues
        ? (backendProfitMargin !== undefined ? backendProfitMargin : '0%')
        : (backendProfitMargin !== undefined ? backendProfitMargin : '0%');

    // Filtered compounds for semi-finished tab (exclude current compound if editing)
    const filteredCompounds = useMemo(() => {
        return compounds.filter(c => {
            if (compoundId && c.id === compoundId) return false;
            return c.name.toLowerCase().includes(sfSearchTerm.toLowerCase());
        });
    }, [compounds, compoundId, sfSearchTerm]);

    return (
        <Box sx={{
            p: 3,
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
        }}>
            {/* Show warning if no entityId */}
            {!entityId && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    {t('calculation.saveEntityFirst', 'Please save the item first to enable calculation saving. Your selections will be preserved.')}
                </Alert>
            )}

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
                        '&:hover': {
                            color: 'text.primary'
                        }
                    }}
                >
                    {t('calculation.content')}
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
                        '&:hover': {
                            color: 'text.primary'
                        }
                    }}
                >
                    {t('calculation.semifinishedProducts')}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">{t('calculation.import')}</Typography>
            </Box>

            {/* INGREDIENTS TAB CONTENT */}
            {activeSubTab === 'ingredients' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>
                    {/* LEFT SIDE - Ingredients */}
                    <Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ width: '100%', minWidth: '200px' }}>
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
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
                                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: '200px' }}>
                                    <Select
                                        fullWidth
                                        displayEmpty
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value as string)}
                                        size="small"
                                    >
                                        <MenuItem value=""><em>{t('calculation.selectGroup')}</em></MenuItem>
                                        {ingredientGroups.map((group) => (
                                            <MenuItem key={group.id} value={group.id}>
                                                {group.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: '150px' }}>
                                    <Select
                                        fullWidth
                                        displayEmpty
                                        defaultValue=""
                                        size="small"
                                    >
                                        <MenuItem value=""><em>{t('calculation.selectWarehouse')}</em></MenuItem>
                                        <MenuItem value="asosiy">{t('calculation.mainWarehouse')}</MenuItem>
                                    </Select>
                                </Box>
                            </Box>
                        </Box>
                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                            <Box sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary'
                            }}>
                                <Box sx={{ width: '40%' }}>{t('calculation.productName')}</Box>
                                <Box sx={{ width: '20%' }}>{t('calculation.unit')}</Box>
                                <Box sx={{ width: '20%' }}>{t('calculation.group')}</Box>
                                <Box sx={{ width: '20%', textAlign: 'center' }}>{t('calculation.price')}</Box>
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {loading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : ingredients.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProducts')}
                                    </Typography>
                                ) : (
                                    ingredients
                                        .filter(p =>
                                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            (!selectedGroupId || p.group_id === selectedGroupId)
                                        )
                                        .map((ingredient) => (
                                            <Box
                                                key={ingredient.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1.5,
                                                    borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={selectedIds.includes(ingredient.id)}
                                                        onChange={() => handleToggle(ingredient.id)}
                                                        sx={{ color: '#27ae60', '&.Mui-checked': { color: '#27ae60' } }}
                                                    />
                                                    <Typography variant="body2" color="text.primary">
                                                        {ingredient.name}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: '20%' }}>
                                                    <Typography variant="body2" color="text.secondary">{ingredient.measurement}</Typography>
                                                </Box>
                                                <Box sx={{ width: '20%' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {ingredient.group_name || '-'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: '20%', textAlign: 'right' }}>
                                                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                        {formatPrice(ingredient.price_per_unit)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* MIDDLE: ARROWS */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', height: '100%', pt: 5 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                            <IconButton
                                onClick={handleMoveRight}
                                disabled={selectedIds.length === 0}
                                sx={{
                                    bgcolor: selectedIds.length === 0 ? '#ccc' : '#ffe0b2',
                                    color: selectedIds.length === 0 ? '#999' : '#f57c00',
                                    '&:hover': {
                                        bgcolor: selectedIds.length === 0 ? '#ccc' : '#ffcc80'
                                    },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                                title={t('calculation.selectedProductsTransfer')}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleMoveLeft}
                                disabled={transferredIds.length === 0}
                                sx={{
                                    bgcolor: transferredIds.length === 0 ? '#ccc' : '#ffe0b2',
                                    color: transferredIds.length === 0 ? '#999' : '#f57c00',
                                    '&:hover': {
                                        bgcolor: transferredIds.length === 0 ? '#ccc' : '#ffcc80'
                                    },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                                title={t('calculation.returnAllProducts')}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* RIGHT SIDE - Selected Ingredients */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                {t('calculation.calculateProductPrice')}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    if (!entityId) {
                                        toast.warning(t('calculation.saveProductFirst', 'Avval mahsulotni saqlang!'));
                                        return;
                                    }

                                    setShowCalculation(true);

                                    if (transferredIds.length > 0) {
                                        try {
                                            for (const ingredientId of transferredIds) {
                                                const quantity = quantities[ingredientId] || 0;
                                                if (quantity > 0) {
                                                    const existingCalculation = ingredientCalculations?.find(calc => calc.ingredient_id === ingredientId);

                                                    if (existingCalculation) {
                                                        await deleteCalculation(existingCalculation.id);
                                                    }

                                                    await createCalculation({
                                                        ingredient_id: ingredientId,
                                                        quantity: String(quantity),
                                                    });
                                                }
                                            }
                                            await mutateCalculations();
                                            toast.success(t('calculation.calculatedSuccessfully', 'Calculated successfully'));
                                        } catch (error) {
                                            console.error('Error saving calculations:', error);
                                            toast.error(t('error.saveFailed', 'Failed to save calculations'));
                                        }
                                    }
                                }}
                                disabled={transferredIds.length === 0 || !entityId}
                                sx={{
                                    bgcolor: (transferredIds.length === 0 || !entityId) ? '#ccc' : '#ff9800',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: (transferredIds.length === 0 || !entityId) ? '#ccc' : '#f57c00'
                                    }
                                }}
                            >
                                {t('calculation.calculate')}
                            </Button>
                        </Box>

                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                            <Box sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary'
                            }}>
                                <Box sx={{ width: '35%' }}>{t('calculation.productName')}</Box>
                                <Box sx={{ width: '30%' }}>{t('calculation.unitOfMeasurement')}</Box>
                                <Box sx={{ width: '30%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto', minHeight: 200 }}>
                                {calculationsLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : transferredIds.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProductsSelected')}
                                    </Typography>
                                ) : (
                                    transferredIds.map(id => {
                                        const ingredient = ingredients.find(p => p.id === id);
                                        if (!ingredient) return null;

                                        const calculation = ingredientCalculations?.find(calc => calc.ingredient_id === id);
                                        const displayPrice = calculation
                                            ? parseFloat(calculation.price_per_unit)
                                            : ingredient.price_per_unit;

                                        return (
                                            <Box
                                                key={id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    borderBottom: `1px solid ${theme.vars.palette.divider}`
                                                }}
                                            >
                                                <Box sx={{ width: '5%', textAlign: 'center' }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={true}
                                                        onChange={async () => {
                                                            // Remove from transferred IDs first
                                                            setTransferredIds(prevIds => prevIds.filter(tid => tid !== id));
                                                            const newQuantities = { ...quantities };
                                                            delete newQuantities[id];
                                                            setQuantities(newQuantities);

                                                            if (entityId) {
                                                                const calculation = ingredientCalculations?.find(calc => calc.ingredient_id === id);
                                                                if (calculation) {
                                                                    try {
                                                                        await deleteCalculation(calculation.id);
                                                                    } catch (error) {
                                                                        console.error('Error deleting calculation:', error);
                                                                        // Restore if delete failed
                                                                        setTransferredIds(prevIds => [...prevIds, id]);
                                                                        setQuantities({ ...newQuantities, [id]: quantities[id] });
                                                                    }
                                                                } else {
                                                                    await mutateCalculations();
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ width: '35%' }}>
                                                    <Typography variant="body2" color="text.primary">
                                                        {ingredient.name}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: '30%' }}>
                                                    <Typography variant="body2" color="text.secondary">{ingredient.measurement}</Typography>
                                                </Box>
                                                <Box sx={{ width: '30%' }}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={quantities[id] || ''}
                                                        onChange={(e) => handleQuantityChange(id, e.target.value)}
                                                        fullWidth
                                                    />
                                                </Box>
                                            </Box>
                                        )
                                    })
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* SEMIFINISHED TAB CONTENT */}
            {activeSubTab === 'semifinished' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' }, gap: 2, alignItems: 'flex-start' }}>
                    {/* LEFT SIDE - Compounds */}
                    <Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ width: '100%', minWidth: '200px' }}>
                                <TextField
                                    fullWidth
                                    placeholder={t('calculation.search')}
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
                        </Box>
                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                            <Box sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary'
                            }}>
                                <Box sx={{ width: '50%' }}>{t('calculation.productName')}</Box>
                                <Box sx={{ width: '25%' }}>{t('calculation.unit')}</Box>
                                <Box sx={{ width: '25%', textAlign: 'center' }}>{t('calculation.price')}</Box>
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {compoundsLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : filteredCompounds.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProducts')}
                                    </Typography>
                                ) : (
                                    filteredCompounds.map((compound) => (
                                        <Box
                                            key={compound.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 1.5,
                                                borderBottom: `1px solid ${theme.vars.palette.divider}`,
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={sfSelectedIds.includes(compound.id)}
                                                    onChange={() => handleSfToggle(compound.id)}
                                                    sx={{ color: '#27ae60', '&.Mui-checked': { color: '#27ae60' } }}
                                                />
                                                <Typography variant="body2" color="text.primary">
                                                    {compound.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: '25%' }}>
                                                <Typography variant="body2" color="text.secondary">{compound.measurement || 'kg'}</Typography>
                                            </Box>
                                            <Box sx={{ width: '25%', textAlign: 'right' }}>
                                                <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                    {formatPrice(parseFloat(String(compound.price || '0')))}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* MIDDLE: ARROWS */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', height: '100%', pt: 5 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1 }}>
                            <IconButton
                                onClick={handleSfMoveRight}
                                disabled={sfSelectedIds.length === 0}
                                sx={{
                                    bgcolor: sfSelectedIds.length === 0 ? '#ccc' : '#ffe0b2',
                                    color: sfSelectedIds.length === 0 ? '#999' : '#f57c00',
                                    '&:hover': {
                                        bgcolor: sfSelectedIds.length === 0 ? '#ccc' : '#ffcc80'
                                    },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                                title={t('calculation.selectedProductsTransfer')}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleSfMoveLeft}
                                disabled={sfTransferredIds.length === 0}
                                sx={{
                                    bgcolor: sfTransferredIds.length === 0 ? '#ccc' : '#ffe0b2',
                                    color: sfTransferredIds.length === 0 ? '#999' : '#f57c00',
                                    '&:hover': {
                                        bgcolor: sfTransferredIds.length === 0 ? '#ccc' : '#ffcc80'
                                    },
                                    borderRadius: '15%',
                                    padding: '10px',
                                }}
                                title={t('calculation.returnAllProducts')}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* RIGHT SIDE - Selected Compounds */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                                {t('calculation.calculateProductPrice')}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    if (!entityId) {
                                        toast.warning(t('calculation.saveProductFirst', 'Avval mahsulotni saqlang!'));
                                        return;
                                    }

                                    setSfShowCalculation(true);

                                    if (sfTransferredIds.length > 0) {
                                        try {
                                            for (const compoundToAddId of sfTransferredIds) {
                                                const quantity = sfQuantities[compoundToAddId] || 0;
                                                if (quantity > 0) {
                                                    const existingCalculation = compoundCalculationsList?.find(
                                                        calc => calc.component_compound_id === compoundToAddId
                                                    );

                                                    if (existingCalculation) {
                                                        await deleteCalculation(existingCalculation.id);
                                                    }

                                                    await createCalculation({
                                                        compound_to_add_id: compoundToAddId,
                                                        quantity: String(quantity),
                                                    });
                                                }
                                            }
                                            await mutateCalculations();
                                            toast.success(t('calculation.calculatedSuccessfully', 'Calculated successfully'));
                                        } catch (error) {
                                            console.error('Error saving calculations:', error);
                                            toast.error(t('error.saveFailed', 'Failed to save calculations'));
                                        }
                                    }
                                }}
                                disabled={sfTransferredIds.length === 0 || !entityId}
                                sx={{
                                    bgcolor: (sfTransferredIds.length === 0 || !entityId) ? '#ccc' : '#ff9800',
                                    textTransform: 'none',
                                    '&:hover': {
                                        bgcolor: (sfTransferredIds.length === 0 || !entityId) ? '#ccc' : '#f57c00'
                                    }
                                }}
                            >
                                {t('calculation.calculate')}
                            </Button>
                        </Box>

                        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} elevation={1}>
                            <Box sx={{
                                display: 'flex',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                color: 'text.primary'
                            }}>
                                <Box sx={{ width: '35%' }}>{t('calculation.productName')}</Box>
                                <Box sx={{ width: '30%' }}>{t('calculation.unitOfMeasurement')}</Box>
                                <Box sx={{ width: '30%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
                            </Box>
                            <Divider />
                            <Box sx={{ maxHeight: 400, overflowY: 'auto', minHeight: 200 }}>
                                {calculationsLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <CircularProgress size={40} />
                                    </Box>
                                ) : sfTransferredIds.length === 0 ? (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        {t('calculation.noProductsSelected')}
                                    </Typography>
                                ) : (
                                    sfTransferredIds.map(id => {
                                        const compound = compounds.find(p => p.id === id);
                                        if (!compound) return null;

                                        return (
                                            <Box
                                                key={id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    borderBottom: `1px solid ${theme.vars.palette.divider}`
                                                }}
                                            >
                                                <Box sx={{ width: '5%', textAlign: 'center' }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={true}
                                                        onChange={async () => {
                                                            // Remove from transferred IDs first
                                                            setSfTransferredIds(prevIds => prevIds.filter(tid => tid !== id));
                                                            const newQuantities = { ...sfQuantities };
                                                            delete newQuantities[id];
                                                            setSfQuantities(newQuantities);

                                                            if (entityId) {
                                                                const calculation = compoundCalculationsList?.find(
                                                                    calc => calc.component_compound_id === id
                                                                );
                                                                if (calculation) {
                                                                    try {
                                                                        await deleteCalculation(calculation.id);
                                                                    } catch (error) {
                                                                        console.error('Error deleting calculation:', error);
                                                                        // Restore if delete failed
                                                                        setSfTransferredIds(prevIds => [...prevIds, id]);
                                                                        setSfQuantities({ ...newQuantities, [id]: sfQuantities[id] });
                                                                    }
                                                                } else {
                                                                    await mutateCalculations();
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ width: '35%' }}>
                                                    <Typography variant="body2" color="text.primary">
                                                        {compound.name}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: '30%' }}>
                                                    <Typography variant="body2" color="text.secondary">{compound.measurement || 'kg'}</Typography>
                                                </Box>
                                                <Box sx={{ width: '30%' }}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={sfQuantities[id] || ''}
                                                        onChange={(e) => handleSfQuantityChange(id, e.target.value)}
                                                        fullWidth
                                                    />
                                                </Box>
                                            </Box>
                                        )
                                    })
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            )}

            {/* --- BOTTOM CALCULATION TABLE --- */}
            {(showCalculation || sfShowCalculation) && (
                <Box sx={{ mt: 4 }}>
                    <TableContainer
                        component={Paper}
                        elevation={1}
                        sx={{
                            borderRadius: 2,
                        }}
                    >
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.number')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.productName')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.type', 'Turi')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.quantity')}</TableCell>
                                    <TableCell sx={{ color: 'text.primary' }}>{t('calculation.price')}</TableCell>
                                    <TableCell align="right" sx={{ color: 'text.primary' }}>{t('calculation.totalPrice')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allCalculatedRows.map((row, index) => (
                                    <TableRow key={row.id} sx={{ borderBottom: `1px solid ${theme.vars.palette.divider}` }}>
                                        <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{row.name}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>
                                            {row.type === 'ingredient'
                                                ? t('calculation.ingredientType', 'Ingredient')
                                                : t('calculation.compoundType', 'Yarim tayyor')}
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{row.qty}</TableCell>
                                        <TableCell sx={{ color: 'text.primary' }}>{formatPrice(row.price_per_unit)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                            {formatPrice(row.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {allCalculatedRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                            {t('calculation.selectProductsForCalculation')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* TOTALS FOOTER */}
                    <Box sx={{
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-end',
                        pr: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.total')}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                {formatPrice(grandTotal)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.profit', 'Profit')}
                            </Typography>
                            <Typography fontWeight="bold" color={displayProfit < 0 ? 'error.main' : 'text.primary'}>
                                {formatPrice(displayProfit)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                            <Typography color="text.secondary" fontWeight="bold">
                                {t('calculation.profitMargin', 'Profit Margin')}
                            </Typography>
                            <Typography fontWeight="bold" color={displayProfitMargin && parseFloat(displayProfitMargin) < 0 ? 'error.main' : 'text.primary'}>
                                {displayProfitMargin}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

        </Box>
    );
};

export default ProductCalculator;