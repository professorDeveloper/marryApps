import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Table,
  Button,
  Divider,
  Checkbox,
  useTheme,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  IconButton,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';

interface Ingredient {
  id: string;
  name: string;
  measurement: string;
  price_per_unit: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

interface ShipmentItemInput {
  ingredient_id: string;
  quantity: string;
}

interface ShipmentsDetailsCalculationProps {
  items?: ShipmentItemInput[];
  onItemsChange?: (items: ShipmentItemInput[]) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

export function ShipmentsDetailsCalculation({
  items = [],
  onItemsChange,
  onSave,
  saving = false,
}: ShipmentsDetailsCalculationProps) {
  const { t } = useTranslation('menu');
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Internal state — initialized once from props, then managed independently
  const [transferredIds, setTransferredIds] = useState<string[]>(() =>
    items.map((item) => item.ingredient_id)
  );
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => {
      map[item.ingredient_id] = item.quantity ?? '';
    });
    return map;
  });

  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');

  // Track if we've been initialized from external items already
  const initializedRef = useRef(false);

  // Sync from parent items ONLY on first non-empty load (e.g., edit mode loading data)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!items.length) return;

    initializedRef.current = true;
    const ids = items.map((item) => item.ingredient_id);
    const qtyMap: Record<string, string> = {};
    items.forEach((item) => {
      qtyMap[item.ingredient_id] = item.quantity ?? '';
    });
    setTransferredIds(ids);
    setQuantities(qtyMap);
  }, [items]);

  // Notify parent when internal state changes — use ref to avoid stale closure
  const onItemsChangeRef = useRef(onItemsChange);
  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
  });

  // isFirstRender guard so we don't call onItemsChange on mount
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const newItems = transferredIds.map((ingredientId) => ({
      ingredient_id: ingredientId,
      quantity: quantities[ingredientId] ?? '',
    }));
    onItemsChangeRef.current?.(newItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferredIds, quantities]);

  const loadIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list);
      setIngredients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error(t('error.loadFailed', 'Failed to load ingredients'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const availableIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          !transferredIds.includes(ingredient.id) &&
          ingredient.name.toLowerCase().includes(searchLeft.toLowerCase())
      ),
    [ingredients, transferredIds, searchLeft]
  );

  const ingredientsById = useMemo(
    () =>
      ingredients.reduce(
        (acc, ingredient) => ({ ...acc, [ingredient.id]: ingredient }),
        {} as Record<string, Ingredient>
      ),
    [ingredients]
  );

  const selectedIngredients = useMemo(() => {
    const query = searchRight.toLowerCase();
    return transferredIds
      .map((id) => ingredientsById[id])
      .filter((ingredient): ingredient is Ingredient => Boolean(ingredient))
      .filter((ingredient) => ingredient.name.toLowerCase().includes(query));
  }, [ingredientsById, transferredIds, searchRight]);

  const totalAmount = useMemo(
    () =>
      selectedIngredients.reduce((sum, ingredient) => {
        const quantity = parseFloat(quantities[ingredient.id] || '0') || 0;
        const unitPrice = parseFloat(ingredient.price_per_unit || '0') || 0;
        return sum + quantity * unitPrice;
      }, 0),
    [selectedIngredients, quantities]
  );

  const handleMoveRight = useCallback(() => {
    if (!selectedIds.length) return;
    setTransferredIds((prev) => [...new Set([...prev, ...selectedIds])]);
    setQuantities((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (!next[id]) next[id] = '1';
      });
      return next;
    });
    setSelectedIds([]);
  }, [selectedIds]);

  const handleMoveLeftAll = useCallback(() => {
    setTransferredIds([]);
    setQuantities({});
  }, []);

  const handleRemoveOne = useCallback((ingredientId: string) => {
    setTransferredIds((prev) => prev.filter((id) => id !== ingredientId));
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!transferredIds.length) {
      toast.error(t('deductions.itemsRequired', 'Please add at least one item'));
      return;
    }
    await onSave?.();
  }, [onSave, t, transferredIds.length]);

  const handleIngredientCreated = useCallback(async () => {
    await loadIngredients();
    setActiveTab(0);
    toast.success(t('warehouse.ingredients.created', 'Ingredient created successfully'));
  }, [loadIngredients, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, next) => setActiveTab(next)}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label={t('mealsProducts.calculate', 'Calculation')} />
        <Tab label={t('warehouse.ingredients.add', 'Add ingredient')} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 1fr 6fr' },
              gap: 2,
              alignItems: 'flex-start',
              mb: 3,
            }}
          >
            {/* LEFT: Available ingredients */}
            <Box>
              <TextField
                size="small"
                fullWidth
                value={searchLeft}
                onChange={(e) => setSearchLeft(e.target.value)}
                placeholder={t('calculation.search', 'Search...')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

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
                  <Box sx={{ width: '50%' }}>{t('calculation.productName', 'Product')}</Box>
                  <Box sx={{ width: '20%' }}>{t('calculation.unit', 'Unit')}</Box>
                  <Box sx={{ width: '30%', textAlign: 'right' }}>{t('calculation.price', 'Price')}</Box>
                </Box>
                <Divider />
                <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                  {!availableIngredients.length ? (
                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                      {t('calculation.noProducts', 'No products')}
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
                        }}
                      >
                        <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            size="small"
                            checked={selectedIds.includes(ingredient.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(ingredient.id)
                                  ? prev.filter((id) => id !== ingredient.id)
                                  : [...prev, ingredient.id]
                              )
                            }
                          />
                          <Typography variant="body2">{ingredient.name}</Typography>
                        </Box>
                        <Box sx={{ width: '20%' }}>
                          <Typography variant="caption" color="text.secondary">
                            {ingredient.measurement}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '30%', textAlign: 'right' }}>
                          <Typography variant="caption">
                            {formatPrice(Number(ingredient.price_per_unit))}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Box>

            {/* CENTER: Transfer buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, pt: 5 }}>
              <IconButton
                onClick={handleMoveRight}
                disabled={!selectedIds.length}
                sx={{ bgcolor: 'action.hover', borderRadius: '15%' }}
              >
                <ChevronRightIcon />
              </IconButton>
              <IconButton
                onClick={handleMoveLeftAll}
                disabled={!transferredIds.length}
                sx={{ bgcolor: 'action.hover', borderRadius: '15%' }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Box>

            {/* RIGHT: Selected ingredients */}
            <Box>
              <TextField
                size="small"
                fullWidth
                value={searchRight}
                onChange={(e) => setSearchRight(e.target.value)}
                placeholder={t('calculation.search', 'Search...')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

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
                  <Box sx={{ width: '35%' }}>{t('calculation.productName', 'Product')}</Box>
                  <Box sx={{ width: '20%' }}>{t('calculation.unitOfMeasurement', 'Unit')}</Box>
                  <Box sx={{ width: '15%', textAlign: 'center' }}>{t('calculation.quantity', 'Qty')}</Box>
                  <Box sx={{ width: '20%', textAlign: 'right' }}>{t('calculation.price', 'Price')}</Box>
                  <Box sx={{ width: '10%' }} />
                </Box>
                <Divider />
                <Box sx={{ maxHeight: 420, overflowY: 'auto', minHeight: 220 }}>
                  {!selectedIngredients.length ? (
                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                      {t('calculation.noProductsSelected', 'No selected products')}
                    </Typography>
                  ) : (
                    selectedIngredients.map((ingredient) => (
                      <Box
                        key={ingredient.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          borderBottom: `1px solid ${theme.vars.palette.divider}`,
                        }}
                      >
                        <Box sx={{ width: '35%' }}>
                          <Typography variant="body2">{ingredient.name}</Typography>
                        </Box>
                        <Box sx={{ width: '20%' }}>
                          <Typography variant="caption" color="text.secondary">
                            {ingredient.measurement}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '15%' }}>
                          <TextField
                            size="small"
                            type="number"
                            value={quantities[ingredient.id] ?? ''}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [ingredient.id]: e.target.value,
                              }))
                            }
                          />
                        </Box>
                        <Box sx={{ width: '20%', textAlign: 'right' }}>
                          <Typography variant="caption">
                            {formatPrice(Number(ingredient.price_per_unit))}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '10%', textAlign: 'center' }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveOne(ingredient.id)}
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

          {/* Summary table */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('calculation.productName', 'Product')}</TableCell>
                  <TableCell>{t('calculation.quantity', 'Qty')}</TableCell>
                  <TableCell>{t('calculation.price', 'Price')}</TableCell>
                  <TableCell align="right">{t('calculation.totalPrice', 'Total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedIngredients.map((ingredient) => {
                  const qty = parseFloat(quantities[ingredient.id] || '0') || 0;
                  const price = parseFloat(ingredient.price_per_unit || '0') || 0;
                  const total = qty * price;

                  return (
                    <TableRow key={`summary-${ingredient.id}`}>
                      <TableCell>{ingredient.name}</TableCell>
                      <TableCell>{qty}</TableCell>
                      <TableCell>{formatPrice(price)}</TableCell>
                      <TableCell align="right">{formatPrice(total)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    {t('calculation.total', 'Total')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatPrice(totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !transferredIds.length}
              sx={{ backgroundColor: '#FB6633', color: '#FFFFFF' }}
            >
              {saving ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('common.save', 'Save')
              )}
            </Button>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ p: 1 }}>
          <IngredientEditView isNew onSuccess={handleIngredientCreated} />
        </Box>
      )}
    </Box>
  );
}

export default ShipmentsDetailsCalculation;