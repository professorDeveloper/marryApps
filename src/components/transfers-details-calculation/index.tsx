import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Paper,
  Button,
  Divider,
  Checkbox,
  useTheme,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

interface Ingredient {
  id: string;
  name: string;
  measurement: string;
  price_per_unit: string;
}

interface IngredientStock {
  id: string;
  ingredient_id: string;
  quantity: string;
  branch_id?: string;
  storage_id?: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

interface TransferItemInput {
  ingredient_id: string;
  quantity: string;
}

interface TransfersDetailsCalculationProps {
  items?: TransferItemInput[];
  onItemsChange?: (items: TransferItemInput[]) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
  sourceBranchId?: string;
  sourceStorageId?: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

const objEqual = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]) && keysB.every((key) => a[key] === b[key]);
};

const arraysEqualObjects = (
  a: TransferItemInput[],
  b: TransferItemInput[]
): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item.ingredient_id === b[idx]?.ingredient_id && item.quantity === b[idx]?.quantity);
};

export function TransfersDetailsCalculation({
  items = [],
  onItemsChange,
  onSave,
  saving = false,
  sourceBranchId,
  sourceStorageId,
}: TransfersDetailsCalculationProps) {
  const { t } = useTranslation('menu');
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stockByIngredient, setStockByIngredient] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transferredIds, setTransferredIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setLoading(true);
        const response = await fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list);
        setIngredients(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(error);
        toast.error(t('error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadIngredients();
  }, [t]);

  useEffect(() => {
    const loadIngredientStock = async () => {
      try {
        setStockLoading(true);
        const response = await fetcher<BackendResponse<IngredientStock[]> | IngredientStock[]>(
          endpoints.ingredientStock.list
        );
        const stockItems = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        const filtered = stockItems.filter((stock) => {
          const matchBranch = sourceBranchId ? stock.branch_id === sourceBranchId : true;
          const matchStorage = sourceStorageId ? stock.storage_id === sourceStorageId : true;
          return matchBranch && matchStorage;
        });

        const nextStockByIngredient = filtered.reduce((acc, stock) => {
          const prev = parseFloat(acc[stock.ingredient_id] || '0') || 0;
          const current = parseFloat(stock.quantity || '0') || 0;
          acc[stock.ingredient_id] = (prev + current).toString();
          return acc;
        }, {} as Record<string, string>);

        setStockByIngredient(nextStockByIngredient);
      } catch (error) {
        console.error(error);
        setStockByIngredient({});
      } finally {
        setStockLoading(false);
      }
    };

    loadIngredientStock();
  }, [sourceBranchId, sourceStorageId]);

  const itemsRef = useRef<TransferItemInput[]>([]);

  useEffect(() => {
    if (!items.length) return;
    // Only sync items from parent if there's a significant change
    const ids = items.map((item) => item.ingredient_id);
    const qtyMap: Record<string, string> = {};
    items.forEach((item) => {
      qtyMap[item.ingredient_id] = item.quantity;
    });

    // Check if the items actually changed before updating state
    const idsChanged = !arraysEqual(ids, transferredIds);
    const qtysChanged = !objEqual(qtyMap, quantities);

    if (idsChanged) {
      setTransferredIds(ids);
    }
    if (qtysChanged) {
      setQuantities(qtyMap);
    }
  }, [items]);

  useEffect(() => {
    const newItems = transferredIds.map((ingredientId) => ({
      ingredient_id: ingredientId,
      quantity: quantities[ingredientId],
    }));

    // Only call onItemsChange if items actually changed
    if (!arraysEqualObjects(newItems, itemsRef.current)) {
      onItemsChange?.(newItems);
      itemsRef.current = newItems;
    }
  }, [transferredIds, quantities]);

  const availableIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          !transferredIds.includes(ingredient.id) &&
          ingredient.name.toLowerCase().includes(searchLeft.toLowerCase())
      ),
    [ingredients, transferredIds, searchLeft]
  );

  const selectedIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          transferredIds.includes(ingredient.id) &&
          ingredient.name.toLowerCase().includes(searchRight.toLowerCase())
      ),
    [ingredients, transferredIds, searchRight]
  );

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
      toast.error(t('deductions.itemsRequired'));
      return;
    }
    await onSave?.();
  }, [transferredIds.length, onSave, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
        <Box>
          <TextField
            size="small"
            fullWidth
            value={searchLeft}
            onChange={(e) => setSearchLeft(e.target.value)}
            placeholder={t('calculation.search')}
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
              <Box sx={{ width: '50%' }}>{t('calculation.productName')}</Box>
              <Box sx={{ width: '20%' }}>{t('calculation.unit')}</Box>
              <Box sx={{ width: '15%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
              <Box sx={{ width: '15%', textAlign: 'right' }}>{t('calculation.price')}</Box>
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
              {!availableIngredients.length ? (
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
                    <Box sx={{ width: '15%', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {stockLoading ? '...' : stockByIngredient[ingredient.id] ?? '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '15%', textAlign: 'right' }}>
                      <Typography variant="caption">{formatPrice(Number(ingredient.price_per_unit))}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, pt: 5 }}>
          <IconButton
            onClick={handleMoveRight}
            disabled={!selectedIds.length}
            sx={{
              bgcolor: 'action.hover',
              borderRadius: '15%',
            }}
          >
            <ChevronRightIcon />
          </IconButton>
          <IconButton
            onClick={handleMoveLeftAll}
            disabled={!transferredIds.length}
            sx={{
              bgcolor: 'action.hover',
              borderRadius: '15%',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <Box>
          <TextField
            size="small"
            fullWidth
            value={searchRight}
            onChange={(e) => setSearchRight(e.target.value)}
            placeholder={t('calculation.search')}
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
              <Box sx={{ width: '40%' }}>{t('calculation.productName')}</Box>
              <Box sx={{ width: '20%' }}>{t('calculation.unitOfMeasurement')}</Box>
              <Box sx={{ width: '15%', textAlign: 'center' }}>{t('calculation.inStock')}</Box>
              <Box sx={{ width: '15%', textAlign: 'center' }}>{t('calculation.quantity')}</Box>
              <Box sx={{ width: '10%' }} />
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 420, overflowY: 'auto', minHeight: 220 }}>
              {!selectedIngredients.length ? (
                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                  {t('calculation.noProductsSelected')}
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
                    <Box sx={{ width: '40%' }}>
                      <Typography variant="body2">{ingredient.name}</Typography>
                    </Box>
                    <Box sx={{ width: '20%' }}>
                      <Typography variant="caption" color="text.secondary">
                        {ingredient.measurement}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '15%', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {stockLoading ? '...' : stockByIngredient[ingredient.id] ?? '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '15%' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={quantities[ingredient.id]}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [ingredient.id]: e.target.value,
                          }))
                        }
                      />
                    </Box>
                    <Box sx={{ width: '10%', textAlign: 'center' }}>
                      <IconButton size="small" color="error" onClick={() => handleRemoveOne(ingredient.id)}>
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2">
          {t('calculation.total')}: {formatPrice(totalAmount)} UZS
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving || !transferredIds.length}
        >
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t('common.saving')}
            </>
          ) : (
            t('common.save')
          )}
        </Button>
      </Box>
    </Box>
  );
}

export default TransfersDetailsCalculation;
