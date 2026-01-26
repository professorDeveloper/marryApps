import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Alert,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';

interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

interface BatchInvoiceDetail {
    ingredient_id: string;
    quantity: number;
    price_per_unit: number;
    price: number;
    ingredient_name?: string;
}

interface InvoiceDetailsBatchProps {
    invoiceId: string;
    onSuccess?: () => void;
}

const calculatePrice = (quantity: number, pricePerUnit: number): number => {
    return quantity * pricePerUnit;
};

export function InvoiceDetailsBatch({ invoiceId, onSuccess }: InvoiceDetailsBatchProps) {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const { getIngredients, createInvoiceDetailsBatch } = useInvoiceDetailsAPI();
    // Tab state
    const [currentTab, setCurrentTab] = useState(0);

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [batchItems, setBatchItems] = useState<BatchInvoiceDetail[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [pricePerUnit, setPricePerUnit] = useState<string>('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Load ingredients on mount
    useEffect(() => {
        const loadIngredients = async () => {
            try {
                setLoading(true);
                const data = await getIngredients();
                setIngredients(data || []);
            } catch (error) {
                console.error('Error loading ingredients:', error);
            } finally {
                setLoading(false);
            }
        };
        loadIngredients();
    }, [getIngredients]);

    // Reset form
    const resetForm = () => {
        setSelectedIngredient('');
        setQuantity('');
        setPricePerUnit('');
        setEditingIndex(null);
    };

    // Handle add/edit item
    const handleAddOrEditItem = useCallback(() => {
        if (!selectedIngredient || !quantity || !pricePerUnit) {
            toast.error(t('warehouse.invoiceDetails.fillAllFields'));
            return;
        }

        const ingredient = ingredients.find((ing) => ing.id === selectedIngredient);
        if (!ingredient) {
            toast.error(t('warehouse.invoiceDetails.selectProduct'));
            return;
        }

        const qty = parseFloat(quantity);
        const price = parseFloat(pricePerUnit);

        if (qty <= 0 || price <= 0) {
            toast.error(t('warehouse.invoiceDetails.positiveValues'));
            return;
        }

        const newItem: BatchInvoiceDetail = {
            ingredient_id: selectedIngredient,
            quantity: qty,
            price_per_unit: price,
            price: calculatePrice(qty, price),
            ingredient_name: ingredient.name,
        };

        if (editingIndex !== null) {
            const newItems = [...batchItems];
            newItems[editingIndex] = newItem;
            setBatchItems(newItems);
            toast.success(t('warehouse.invoiceDetails.updated'));
        } else {
            // Check if ingredient already exists
            const existingIndex = batchItems.findIndex((item) => item.ingredient_id === selectedIngredient);
            if (existingIndex !== -1) {
                toast.error(t('warehouse.invoiceDetails.ingredientAlreadyAdded'));
                return;
            }
            setBatchItems([...batchItems, newItem]);
            toast.success(t('warehouse.invoiceDetails.added'));
        }

        resetForm();
        setShowDialog(false);
    }, [selectedIngredient, quantity, pricePerUnit, ingredients, batchItems, editingIndex, t]);

    // Handle quantity change (auto-calculate price)
    const handleQuantityChange = (value: string) => {
        setQuantity(value);
    };

    // Handle price per unit change (auto-calculate price)
    const handlePricePerUnitChange = (value: string) => {
        setPricePerUnit(value);
    };

    // Handle remove item
    const handleRemoveItem = (index: number) => {
        setBatchItems(batchItems.filter((_, i) => i !== index));
        toast.success(t('warehouse.invoiceDetails.removed'));
    };

    // Handle edit item
    const handleEditItem = (index: number) => {
        const item = batchItems[index];
        setSelectedIngredient(item.ingredient_id);
        setQuantity(item.quantity.toString());
        setPricePerUnit(item.price_per_unit.toString());
        setEditingIndex(index);
        setShowDialog(true);
    };

    // Handle submit batch
    const handleSubmitBatch = async () => {
        if (batchItems.length === 0) {
            toast.error(t('warehouse.invoiceDetails.addAtLeastOneItem'));
            return;
        }

        try {
            setLoading(true);
            const batchData = batchItems.map((item) => ({
                ingredient_id: item.ingredient_id,
                invoice_id: invoiceId,
                quantity: item.quantity,
                price_per_unit: item.price_per_unit.toString(),
                price: item.price.toString(),
            }));

            await createInvoiceDetailsBatch(batchData);
            setBatchItems([]);
            resetForm();
            toast.success(t('warehouse.invoiceDetails.batchCreatedSuccess'));
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error submitting batch:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        return {
            quantity: batchItems.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: batchItems.reduce((acc, item) => acc + item.price, 0),
        };
    }, [batchItems]);

    const ingredientOptions = useMemo(() => {
        const usedIds = new Set(batchItems.map((item) => item.ingredient_id));
        if (editingIndex !== null) {
            usedIds.delete(batchItems[editingIndex].ingredient_id);
        }
        return ingredients.filter((ing) => !usedIds.has(ing.id));
    }, [ingredients, batchItems, editingIndex]);

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
        <Paper sx={{ minHeight: '100vh' }}>
            {/* Tabs Navigation */}
            <Tabs
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 3,
                }}
            >
                <Tab
                    label={t('warehouse.invoiceDetails.batchOperations')}
                    icon={<Iconify icon="solar:list-bold" />}
                    iconPosition="start"
                />
                <Tab
                    label={t('warehouse.ingredients.add')}
                    icon={<Iconify icon="solar:add-circle-bold" />}
                    iconPosition="start"
                />
            </Tabs>

            {/* Tab 1: Batch Operations */}
            {currentTab === 0 && (
                <Box sx={{ p: 3 }}>
                    {/* Add Item Card */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                    gap: 2,
                                    alignItems: 'flex-end',
                                }}
                            >
                                {/* Ingredient Select */}
                                <TextField
                                    select
                                    label={t('warehouse.invoiceDetails.product')}
                                    value={selectedIngredient}
                                    onChange={(e) => setSelectedIngredient(e.target.value)}
                                    SelectProps={{
                                        native: true,
                                    }}
                                    fullWidth
                                    disabled={loading || ingredientOptions.length === 0}
                                >
                                    <option value="">{t('warehouse.invoiceDetails.selectProduct')}</option>
                                    {ingredientOptions.map((ing) => (
                                        <option key={ing.id} value={ing.id}>
                                            {ing.name}
                                        </option>
                                    ))}
                                </TextField>

                                {/* Quantity Input */}
                                <TextField
                                    type="number"
                                    label={t('warehouse.invoiceDetails.quantity')}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    placeholder="0"
                                    fullWidth
                                    inputProps={{ step: '0.01', min: '0' }}
                                />

                                {/* Price Per Unit Input */}
                                <TextField
                                    type="number"
                                    label={t('warehouse.invoiceDetails.unitPrice')}
                                    value={pricePerUnit}
                                    onChange={(e) => handlePricePerUnitChange(e.target.value)}
                                    placeholder="0"
                                    fullWidth
                                    inputProps={{ step: '0.01', min: '0' }}
                                />
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleAddOrEditItem}
                                    disabled={loading || !selectedIngredient}
                                    startIcon={<Iconify icon={editingIndex !== null ? 'solar:pen-bold' : 'solar:add-circle-bold'} />}
                                >
                                    {editingIndex !== null ? t('warehouse.invoiceDetails.update') : t('warehouse.invoiceDetails.add')}
                                </Button>
                                {editingIndex !== null && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            resetForm();
                                        }}
                                    >
                                        {t('warehouse.invoiceDetails.cancel')}
                                    </Button>
                                )}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Batch Items Table */}
                    {batchItems.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: theme.vars.palette.background.paper }}>
                                            <TableCell>№</TableCell>
                                            <TableCell>{t('warehouse.invoiceDetails.product')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.quantity')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.unitPrice')}</TableCell>
                                            <TableCell align="right">{t('warehouse.invoiceDetails.totalPrice')}</TableCell>
                                            <TableCell align="center">{t('actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {batchItems.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{item.ingredient_name}</TableCell>
                                                <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
                                                <TableCell align="right">{item.price_per_unit.toLocaleString()} UZS</TableCell>
                                                <TableCell align="right">{item.price.toLocaleString()} UZS</TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditItem(index)}
                                                        color="primary"
                                                    >
                                                        <Iconify icon="solar:pen-bold" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveItem(index)}
                                                        color="error"
                                                    >
                                                        <Iconify icon="solar:trash-bin-trash-bold" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Totals Row */}
                                        <TableRow sx={{ backgroundColor: theme.vars.palette.action.hover }}>
                                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                                {t('warehouse.invoiceDetails.total')}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {totals.quantity.toLocaleString()}
                                            </TableCell>
                                            <TableCell />
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {totals.totalPrice.toLocaleString()} UZS
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Submit Button */}
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmitBatch}
                                    disabled={loading}
                                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                                >
                                    {t('warehouse.invoiceDetails.submitBatch')}
                                </Button>
                            </Box>
                        </Card>
                    )}

                    {batchItems.length === 0 && !loading && (
                        <Alert severity="warning">{t('warehouse.invoiceDetails.noItemsAdded')}</Alert>
                    )}
                </Box>
            )}

            {/* Tab 2: Add New Ingredient */}
            {currentTab === 1 && (
                <Box sx={{ p: 3 }}>
                    <IngredientEditView isNew={true} onSuccess={handleRefreshIngredients} />
                </Box>
            )}
        </Paper>
    );
}
