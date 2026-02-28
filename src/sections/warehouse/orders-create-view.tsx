import type { CreateOrderPayload } from 'src/types/orders';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Tab,
  Grid,
  Tabs,
  Alert,
  Paper,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  TextField,
  InputLabel,
  Typography,
  FormControl,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetMeals } from 'src/hooks/use-meals';
import { useOrdersAPI } from 'src/hooks/use-orders-api';

import { useGetUsersByRole } from 'src/actions/users';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

type ScenarioType = 'dine_in_with_food' | 'table_only' | 'takeaway_with_food';

interface DraftItem {
  good_id: string;
  quantity: number;
}

const scenarioTabValue: ScenarioType[] = ['dine_in_with_food', 'table_only', 'takeaway_with_food'];

const toISOFromLocal = (value: string): string | undefined => {
  if (!value) return undefined;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return undefined;
  return parsed.toISOString();
};

export function OrdersCreateView() {
  const { t } = useTranslation('menu');
  const router = useRouter();

  const { meals, mealsLoading } = useGetMeals();
  const { tables, tablesLoading } = useGetCafeTables();
  const { users: waiters, usersLoading: waitersLoading } = useGetUsersByRole('waiter');
  const { users: cashiers, usersLoading: cashiersLoading } = useGetUsersByRole('cashier');

  const { createOrder } = useOrdersAPI();

  const [scenario, setScenario] = useState<ScenarioType>('dine_in_with_food');
  const [submitting, setSubmitting] = useState(false);
  const [tableId, setTableId] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [scheduledAt, setScheduledAt] = useState('');
  const [comment, setComment] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ good_id: '', quantity: 1 }]);

  const isTableOrder = scenario === 'dine_in_with_food' || scenario === 'table_only';
  const requiresItems = scenario !== 'table_only';

  const scenarioLabels = useMemo<Record<ScenarioType, string>>(
    () => ({
      dine_in_with_food: t('order.scenarios.dineInWithFood', 'Table + food order'),
      table_only: t('order.scenarios.tableOnly', 'Table-only reservation'),
      takeaway_with_food: t('order.scenarios.takeawayWithFood', 'Takeaway + food order'),
    }),
    [t]
  );

  const selectedScenarioHelpText = useMemo(() => {
    if (scenario === 'dine_in_with_food') {
      return t(
        'order.helpers.dineInWithFood',
        'Table, waiter, guest count, scheduled time and items are required'
      );
    }
    if (scenario === 'table_only') {
      return t(
        'order.helpers.tableOnly',
        'Table, guest count and scheduled time are required. Items are optional for now'
      );
    }
    return t(
      'order.helpers.takeawayWithFood',
      'Takeaway type, cashier, scheduled time and items are required'
    );
  }, [scenario, t]);

  const buildCreatePayload = useCallback((): CreateOrderPayload | null => {
    const normalizedItems = items
      .filter((item) => item.good_id && item.quantity > 0)
      .map((item) => ({ good_id: item.good_id, quantity: item.quantity }));

    const schedule = toISOFromLocal(scheduledAt);
    if (!schedule) return null;

    if (scenario === 'dine_in_with_food') {
      if (!tableId || !waiterId || normalizedItems.length === 0) return null;
      return {
        table_id: tableId,
        waiter_id: waiterId,
        guest_count: guestCount || 1,
        scheduled_at: schedule,
        comment: comment || undefined,
        items: normalizedItems,
      };
    }

    if (scenario === 'table_only') {
      if (!tableId) return null;
      return {
        table_id: tableId,
        guest_count: guestCount || 1,
        scheduled_at: schedule,
        comment: comment || undefined,
      };
    }

    if (!cashierId || normalizedItems.length === 0) return null;
    return {
      order_type: 'takeaway',
      cashier_id: cashierId,
      scheduled_at: schedule,
      comment: comment || undefined,
      items: normalizedItems,
    };
  }, [scenario, items, scheduledAt, tableId, waiterId, guestCount, comment, cashierId]);

  const handleCreateOrder = useCallback(async () => {
    const payload = buildCreatePayload();
    if (!payload) {
      toast.error(t('order.errors.requiredFields', 'Required fields are missing'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder(payload);
      if (created) {
        router.push(paths.warehouse.orders.root);
      }
    } finally {
      setSubmitting(false);
    }
  }, [buildCreatePayload, createOrder, router, t]);

  return (
    <DashboardContent
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        '--layout-dashboard-content-pt': { xs: '16px', md: '24px' },
        '--layout-dashboard-content-pb': { xs: '16px', md: '24px' },
      }}
    >
      <CustomBreadcrumbs
        heading={t('order.create', 'Create order')}
        links={[
          { name: t('app', 'App'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
          { name: t('overview.warehouse.orders', 'Order Management'), href: paths.warehouse.orders.root },
          { name: t('order.create', 'Create order') },
        ]}
        action={(
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:reply-bold" />}
            onClick={() => router.push(paths.warehouse.orders.root)}
          >
            {t('common.back', 'Back')}
          </Button>
        )}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Tabs
          value={scenarioTabValue.indexOf(scenario)}
          onChange={(_e, value) => setScenario(scenarioTabValue[value])}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {scenarioTabValue.map((key) => (
            <Tab key={key} label={scenarioLabels[key]} />
          ))}
        </Tabs>

        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedScenarioHelpText}
        </Alert>

        <Grid container spacing={2}>
          {isTableOrder && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t('order.table', 'Table')}</InputLabel>
                <Select
                  label={t('order.table', 'Table')}
                  value={tableId}
                  onChange={(event) => setTableId(event.target.value)}
                  disabled={tablesLoading}
                >
                  {tables.map((table) => (
                    <MenuItem key={table.id} value={table.id}>
                      {t('order.tableOption', 'Table #{{number}} (cap: {{capacity}})', {
                        number: table.number,
                        capacity: table.capacity,
                      })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {scenario === 'dine_in_with_food' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t('order.waiter', 'Waiter')}</InputLabel>
                <Select
                  label={t('order.waiter', 'Waiter')}
                  value={waiterId}
                  onChange={(event) => setWaiterId(event.target.value)}
                  disabled={waitersLoading}
                >
                  {waiters.map((waiter: any) => (
                    <MenuItem key={waiter.id} value={waiter.id}>
                      {waiter.full_name || waiter.fullName || waiter.username || waiter.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {scenario === 'takeaway_with_food' && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t('order.cashier', 'Cashier')}</InputLabel>
                <Select
                  label={t('order.cashier', 'Cashier')}
                  value={cashierId}
                  onChange={(event) => setCashierId(event.target.value)}
                  disabled={cashiersLoading}
                >
                  {cashiers.map((cashier: any) => (
                    <MenuItem key={cashier.id} value={cashier.id}>
                      {cashier.full_name || cashier.fullName || cashier.username || cashier.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {isTableOrder && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label={t('order.guestCount', 'Guest count')}
                type="number"
                value={guestCount}
                onChange={(event) => setGuestCount(Number(event.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label={t('order.scheduledAt', 'Scheduled at')}
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label={t('comment', 'Comment')}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </Grid>
        </Grid>

        {requiresItems && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              {t('order.items', 'Items')}
            </Typography>

            <Stack spacing={1.5}>
              {items.map((item, index) => (
                <Grid container spacing={2} key={`draft-item-${index}`}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <FormControl fullWidth>
                      <InputLabel>{t('order.good', 'Good')}</InputLabel>
                      <Select
                        label={t('order.good', 'Good')}
                        value={item.good_id}
                        onChange={(event) => {
                          const next = [...items];
                          next[index] = { ...next[index], good_id: event.target.value };
                          setItems(next);
                        }}
                        disabled={mealsLoading}
                      >
                        {meals.map((meal) => (
                          <MenuItem key={meal.id} value={meal.id}>
                            {meal.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={t('order.quantity', 'Qty')}
                      value={item.quantity}
                      onChange={(event) => {
                        const next = [...items];
                        next[index] = { ...next[index], quantity: Number(event.target.value) || 1 };
                        setItems(next);
                      }}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() => setItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                      disabled={items.length <= 1}
                      sx={{ height: 56 }}
                    >
                      {t('common.delete', 'Delete')}
                    </Button>
                  </Grid>
                </Grid>
              ))}

              <Box>
                <Button
                  variant="text"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => setItems((prev) => [...prev, { good_id: '', quantity: 1 }])}
                >
                  {t('order.addItem', 'Add item')}
                </Button>
              </Box>
            </Stack>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
          <Button variant="outlined" color="inherit" onClick={() => router.push(paths.warehouse.orders.root)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleCreateOrder} disabled={submitting}>
            {t('order.create', 'Create order')}
          </Button>
        </Stack>
      </Paper>
    </DashboardContent>
  );
}

export default OrdersCreateView;
