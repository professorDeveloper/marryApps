import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
} from '@mui/material';

import { GenericViewModal } from 'src/components/generic-view-view';

interface DeductionIngredientMovement {
  id?: string;
  ingredient_id?: string;
  quantity?: string;
  stock_before?: string;
  stock_after?: string;
  price_per_unit?: string;
  amount?: string;
}

interface DeductionItemDetails {
  id?: string;
  ingredient_id: string;
  quantity?: string;
  ingredients?: DeductionIngredientMovement[];
}

export interface DeductionDetailsData {
  id: string;
  number: number;
  date: string;
  act_group_id: string;
  storage_id: string;
  description: string;
  status: string;
  balance: string;
  storage_name?: string;
  group_name?: string;
  items?: DeductionItemDetails[];
}

interface DeductionsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  data: DeductionDetailsData | null;
  storagesMap: Record<string, string>;
  groupsMap: Record<string, string>;
  ingredientsMap: Record<string, string>;
}

interface DeductionDetailRow {
  id: string;
  ingredientId: string;
  quantity: string;
  stockBefore: string;
  stockAfter: string;
  pricePerUnit: string;
  amount: string;
}

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatAmount = (value: string | number | null | undefined): string =>
  new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatDate = (value?: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

export function DeductionsDetailsModal({
  isOpen,
  onClose,
  loading,
  data,
  storagesMap,
  groupsMap,
  ingredientsMap,
}: DeductionsDetailsModalProps) {
  const { t } = useTranslation('menu');

  const detailRows = useMemo<DeductionDetailRow[]>(() => {
    if (!data?.items) return [];

    return data.items.flatMap((item, itemIndex) => {
      if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
        return item.ingredients.map((movement, movementIndex) => ({
          id: movement.id || `${item.id || item.ingredient_id || itemIndex}-${movementIndex}`,
          ingredientId: movement.ingredient_id || item.ingredient_id,
          quantity: movement.quantity || item.quantity || '0',
          stockBefore: movement.stock_before || '-',
          stockAfter: movement.stock_after || '-',
          pricePerUnit: movement.price_per_unit || '0',
          amount: movement.amount || '0',
        }));
      }

      return [
        {
          id: item.id || `${item.ingredient_id}-${itemIndex}`,
          ingredientId: item.ingredient_id,
          quantity: item.quantity || '0',
          stockBefore: '-',
          stockAfter: '-',
          pricePerUnit: '0',
          amount: '0',
        },
      ];
    });
  }, [data]);

  const totalAmount = useMemo(
    () => detailRows.reduce((sum, row) => sum + toNumber(row.amount), 0),
    [detailRows]
  );

  return (
    <GenericViewModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        data
          ? `${t('deductions.details', 'Deduction details')} #${data.number}`
          : t('deductions.details', 'Deduction details')
      }
      data={data}
      loading={loading}
      maxWidth="lg"
      position="right"
      slideDirection="left"
      renderContent={(deduction: DeductionDetailsData) => {
        const storageName =
          deduction.storage_name ||
          storagesMap[deduction.storage_id] ||
          deduction.storage_id ||
          '-';
        const groupName =
          deduction.group_name ||
          groupsMap[deduction.act_group_id] ||
          deduction.act_group_id ||
          '-';

        return (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {/* <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('deductions.number', 'Number')}</TableCell>
                    <TableCell>{t('deductions.date', 'Date')}</TableCell>
                    <TableCell>{t('deductions.status', 'Status')}</TableCell>
                    <TableCell>{t('deductions.storage', 'Storage')}</TableCell>
                    <TableCell>{t('deductions.group', 'Group')}</TableCell>
                    <TableCell>{t('deductions.description', 'Description')}</TableCell>
                    <TableCell>{t('deductions.balance', 'Balance')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{deduction.number}</TableCell>
                    <TableCell>{formatDate(deduction.date)}</TableCell>
                    <TableCell>{deduction.status || '-'}</TableCell>
                    <TableCell>{storageName}</TableCell>
                    <TableCell>{groupName}</TableCell>
                    <TableCell>{deduction.description || '-'}</TableCell>
                    <TableCell>{formatAmount(deduction.balance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer> */}

            <TableContainer
              sx={{
                backgroundColor: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      '& .MuiTableCell-head': {
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        borderBottom: '2px solid var(--color-border-strong)',
                        backgroundColor: 'var(--color-primary-soft)',
                        fontFamily: 'var(--font-mono)',
                      },
                    }}
                  >
                    <TableCell>#</TableCell>
                    <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                    <TableCell>{t('deductions.quantity', 'Quantity')}</TableCell>
                    <TableCell>{t('calculation.pricePerUnit', 'Price / Unit')}</TableCell>
                    <TableCell>{t('calculation.remaining', 'Amount')}</TableCell>
                    <TableCell>{t('shipments.stockBefore', 'Stock before')}</TableCell>
                    <TableCell>{t('shipments.stockAfter', 'Stock after')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'var(--font-mono)' }}>
                          {t('deductions.noItemsSelected', 'No items selected')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailRows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'var(--color-primary-soft)',
                          },
                          '& .MuiTableCell-root': {
                            fontFamily: 'var(--font-mono)',
                            borderBottom: '1px solid var(--color-border)',
                            color: 'text.primary',
                          },
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{ingredientsMap[row.ingredientId] || row.ingredientId}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{formatAmount(row.pricePerUnit)}</TableCell>
                        <TableCell>{formatAmount(row.amount)}</TableCell>
                        <TableCell>{row.stockBefore}</TableCell>
                        <TableCell>{row.stockAfter}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
              <Typography variant="body2">
                <strong>{t('calculation.remaining', 'Amount')}:</strong> {formatAmount(totalAmount)}
              </Typography>
              <Typography variant="body2">
                <strong>{t('deductions.balance', 'Balance')}:</strong> {formatAmount(deduction.balance)}
              </Typography>
            </Box> */}
          </Box>
        );
      }}
    />
  );
}

