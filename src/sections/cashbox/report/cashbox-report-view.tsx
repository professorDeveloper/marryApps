import type { SelectChangeEvent } from '@mui/material';
import type { TransactionReportGroupItem } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Card,
  Stack,
  Table,
  Select,
  Button,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

import { FALLBACK_REPORT, sectionActionsSx } from './constants';
import { buildCsv, normalizeReport, toNumber, toNumberText, toApiDateTime } from './utils/report-utils';
import type { MainTableRow } from './types';

export function CashboxReportView() {
  const { t } = useTranslation('menu');
  const { getCashRegisters, getTransactionsReport } = useTransactionsAPI();

  const [loading, setLoading] = useState(false);
  const [cashRegisters, setCashRegisters] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState(FALLBACK_REPORT);

  const [fromDate, setFromDate] = useState<dayjs.Dayjs>(dayjs().startOf('day').subtract(1, 'day'));
  const [toDate, setToDate] = useState<dayjs.Dayjs>(dayjs().endOf('day'));
  const [cashRegisterId, setCashRegisterId] = useState('');

  useEffect(() => {
    const loadCashRegisters = async () => {
      const data = await getCashRegisters();
      const safeData = Array.isArray(data) ? data : [];
      setCashRegisters(safeData.map((item) => ({ id: item.id, name: item.name })));
    };

    loadCashRegisters();
  }, [getCashRegisters]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactionsReport({
        from: toApiDateTime(fromDate),
        to: toApiDateTime(toDate),
        cash_register_id: cashRegisterId || undefined,
      });
      setReport(normalizeReport(data));
    } finally {
      setLoading(false);
    }
  }, [cashRegisterId, fromDate, getTransactionsReport, toDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const mainRows = useMemo<MainTableRow[]>(() => {
    const groupedRows: MainTableRow[] = [
      ...report.income_groups.map((item) => ({
        id: `income-${item.group_id}`,
        type: item.group_name || item.group_id,
        cash: item.cash_total,
        card: item.card_total,
        debt: '0',
        notPaid: '0',
        deposits: '0',
        total: item.total,
      })),
      ...report.expense_groups.map((item) => ({
        id: `expense-${item.group_id}`,
        type: item.group_name || item.group_id,
        cash: item.cash_total,
        card: item.card_total,
        debt: '0',
        notPaid: '0',
        deposits: '0',
        total: item.total,
      })),
    ];

    return [
      ...groupedRows,
      {
        id: 'balance',
        type: t('cashbox.report.balance'),
        cash: report.balance.cash_total,
        card: report.balance.card_total,
        debt: '0',
        notPaid: '0',
        deposits: '0',
        total: report.balance.total,
      },
    ];
  }, [report.balance, report.expense_groups, report.income_groups, t]);

  const exportMain = useCallback(() => {
    buildCsv(
      'cash-report-main.csv',
      [
        t('cashbox.report.columnNo'),
        t('cashbox.report.columnType'),
        t('cashbox.report.columnCash'),
        t('cashbox.report.columnBankAccount'),
        t('cashbox.report.columnDebt'),
        t('cashbox.report.columnNotPaid'),
        t('cashbox.report.columnDeposits'),
        t('cashbox.report.columnTotal'),
      ],
      mainRows.map((row, index) => [
        index + 1,
        row.type,
        toNumberText(row.cash),
        toNumberText(row.card),
        toNumberText(row.debt),
        toNumberText(row.notPaid),
        toNumberText(row.deposits),
        toNumberText(row.total),
      ])
    );
  }, [mainRows, t]);

  const exportGroups = useCallback(
    (filename: string, groups: TransactionReportGroupItem[]) => {
      buildCsv(
        filename,
        [
          t('cashbox.report.group'),
          t('cashbox.report.columnCash'),
          t('cashbox.report.card'),
          t('cashbox.report.columnTotal'),
        ],
        groups.map((group) => [
          group.group_name || group.group_id,
          toNumberText(group.cash_total),
          toNumberText(group.card_total),
          toNumberText(group.total),
        ])
      );
    },
    [t]
  );

  const exportSummary = useCallback(() => {
    buildCsv(
      'cash-report-summary.csv',
      [t('cashbox.report.metric'), t('cashbox.report.amount')],
      [
        [t('cashbox.report.atStartOfDay'), toNumberText(report.opening_balance)],
        [t('cashbox.report.incomeTitle'), toNumberText(report.total_income)],
        [t('cashbox.report.expensesTitle'), toNumberText(report.total_expense)],
        [t('cashbox.report.balanceOfDay'), toNumberText(report.day_balance)],
        [t('cashbox.report.atEndOfDay'), toNumberText(report.closing_balance)],
      ]
    );
  }, [report.closing_balance, report.day_balance, report.opening_balance, report.total_expense, report.total_income, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getSummaryByType = useCallback(
    (key: string) => report.summary.find((item) => item.type?.toLowerCase() === key.toLowerCase()),
    [report.summary]
  );

  const departmentRows = useMemo(() => {
    const map = new Map<string, number>();
    [...report.income_groups, ...report.expense_groups].forEach((group) => {
      const current = map.get(group.group_name || group.group_id) || 0;
      map.set(group.group_name || group.group_id, current + toNumber(group.total));
    });

    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [report.expense_groups, report.income_groups]);

  const accountsSummary = getSummaryByType('accounts');
  const depositsSummary = getSummaryByType('deposits');

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={t('ingredientReports.startDate')}
                  value={fromDate}
                  onChange={(date) => {
                    if (date) setFromDate(date.startOf('day'));
                  }}
                  format="DD.MM.YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: { xs: '100%', sm: 230 } },
                      inputProps: { readOnly: true },
                    },
                  }}
                />
              </LocalizationProvider>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={t('ingredientReports.endDate')}
                  value={toDate}
                  onChange={(date) => {
                    if (date) setToDate(date.endOf('day'));
                  }}
                  format="DD.MM.YYYY"
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { width: { xs: '100%', sm: 230 } },
                      inputProps: { readOnly: true },
                    },
                  }}
                />
              </LocalizationProvider>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="cash-register-filter-label" shrink>
                  {t('cashbox.report.filterCashier')}
                </InputLabel>
                <Select
                  labelId="cash-register-filter-label"
                  value={cashRegisterId}
                  label={t('cashbox.report.filterCashier')}
                  displayEmpty
                  renderValue={(selected) => {
                    const value = String(selected || '');
                    if (!value) return t('cashbox.report.all');
                    const selectedCashRegister = cashRegisters.find((item) => item.id === value);
                    return selectedCashRegister?.name || t('cashbox.report.all');
                  }}
                  onChange={(event: SelectChangeEvent<string>) => setCashRegisterId(event.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('cashbox.report.all')}</em>
                  </MenuItem>
                  {cashRegisters.map((cashRegister) => (
                    <MenuItem key={cashRegister.id} value={cashRegister.id}>
                      {cashRegister.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="contained" size="small" onClick={handlePrint} sx={sectionActionsSx}>
                {t('cashbox.report.print')}
              </Button>
              <Button variant="contained" size="small" onClick={exportMain} sx={sectionActionsSx}>
                {t('cashbox.report.export')}
              </Button>
            </Stack>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={52}>{t('cashbox.report.columnNo')}</TableCell>
                  <TableCell>{t('cashbox.report.columnType')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnCash')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnBankAccount')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnDebt')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnNotPaid')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnDeposits')}</TableCell>
                  <TableCell align="right">{t('cashbox.report.columnTotal')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mainRows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: row.id === 'balance' ? 700 : 500 }}>{row.type}</TableCell>
                    <TableCell align="right">{toNumberText(row.cash)}</TableCell>
                    <TableCell align="right">{toNumberText(row.card)}</TableCell>
                    <TableCell align="right">{toNumberText(row.debt)}</TableCell>
                    <TableCell align="right">{toNumberText(row.notPaid)}</TableCell>
                    <TableCell align="right">{toNumberText(row.deposits)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: row.id === 'balance' ? 700 : 500 }}>
                      {toNumberText(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <Card sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6">{t('cashbox.report.incomeTitle')}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handlePrint} sx={sectionActionsSx}>
                {t('cashbox.report.print')}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => exportGroups('cash-report-income.csv', report.income_groups)}
                sx={sectionActionsSx}
              >
                {t('cashbox.report.export')}
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('cashbox.report.accounts')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {toNumberText(accountsSummary?.total || '0')}
              </Typography>
            </Stack>
            {report.income_groups.map((group) => (
              <Box key={`income-list-${group.group_id}`}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {group.group_name}
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {t('cashbox.report.cashLabel')}
                  </Typography>
                  <Typography variant="body2">{toNumberText(group.cash_total)}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6">{t('cashbox.report.expensesTitle')}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handlePrint} sx={sectionActionsSx}>
                {t('cashbox.report.print')}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => exportGroups('cash-report-expenses.csv', report.expense_groups)}
                sx={sectionActionsSx}
              >
                {t('cashbox.report.export')}
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={1.25}>
            {report.expense_groups.map((group) => (
              <Box key={`expense-list-${group.group_id}`}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {group.group_name}
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {t('cashbox.report.cashLabel')}
                  </Typography>
                  <Typography variant="body2">{toNumberText(group.cash_total)}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Card sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6">{t('cashbox.report.summaryTitle')}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={handlePrint} sx={sectionActionsSx}>
                {t('cashbox.report.print')}
              </Button>
              <Button variant="contained" size="small" onClick={exportSummary} sx={sectionActionsSx}>
                {t('cashbox.report.export')}
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.atStartOfDay')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(report.opening_balance)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.incomeTitle')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(report.total_income)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.expensesTitle')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(report.total_expense)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.balanceOfDay')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(report.day_balance)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.atEndOfDay')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(report.closing_balance)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography>{t('cashbox.report.debtOrders')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>0</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{t('cashbox.report.debtOrdersPaid')}:</Typography>
              <Typography sx={{ fontWeight: 700 }}>{toNumberText(depositsSummary?.total || '0')}</Typography>
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            {t('cashbox.report.departmentsTitle')}
          </Typography>

          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ pl: 0 }}>{t('cashbox.report.allDepartments')}</TableCell>
                <TableCell align="right" sx={{ pr: 0, fontWeight: 700 }}>
                  {toNumberText(String(toNumber(report.total_income) + toNumber(report.total_expense)))}
                </TableCell>
              </TableRow>
              {departmentRows.map((row) => (
                <TableRow key={`department-${row.name}`}>
                  <TableCell sx={{ pl: 0 }}>{row.name}</TableCell>
                  <TableCell align="right" sx={{ pr: 0 }}>
                    {row.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </Box>
  );
}

export default CashboxReportView;
