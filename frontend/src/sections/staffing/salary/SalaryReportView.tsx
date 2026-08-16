import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

interface IEmployee {
  id: string;
  full_name: string;
  role?: string;
}

interface EmployeeListResponse {
  data: IEmployee[];
}

interface SalaryEntry {
  date?: string;
  hours_worked?: number;
  orders_count?: number;
  revenue?: number;
  salary?: number;
  bonus?: number;
  total?: number;
}

interface SalaryReport {
  employee_id: string;
  full_name?: string;
  date_from?: string;
  date_to?: string;
  entries?: SalaryEntry[];
  total_salary?: number;
  total_bonus?: number;
  total?: number;
}

interface SalaryReportResponse {
  data: SalaryReport;
}

// ----------------------------------------------------------------------

export function SalaryReportView() {
  const { t } = useTranslation('menu');

  const { data: employeesData } = useSWR<EmployeeListResponse | IEmployee[]>(
    endpoints.staffing.employees.list,
    fetcher
  );

  const employees: IEmployee[] = (() => {
    if (!employeesData) return [];
    if (Array.isArray(employeesData)) return employeesData;
    return (employeesData as EmployeeListResponse).data ?? [];
  })();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [employeeId, setEmployeeId] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [report, setReport] = useState<SalaryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const url = `${endpoints.staffing.employees.salaryReport(employeeId)}?date_from=${dateFrom}&date_to=${dateTo}`;
      const res = await fetcher<SalaryReportResponse | SalaryReport>(url);
      const reportData = (res as SalaryReportResponse)?.data ?? (res as SalaryReport);
      setReport(reportData);
    } catch {
      setError(t('staffing.salary.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [employeeId, dateFrom, dateTo, t]);

  return (
    <DashboardContent>
      <Stack spacing={3} maxWidth={800}>
        <Typography variant="h5">{t('nav.salary')}</Typography>

        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
              <TextField
                select
                label={t('staffing.salary.employee')}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                label={t('staffing.salary.dateFrom')}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                type="date"
                label={t('staffing.salary.dateTo')}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                variant="contained"
                onClick={handleFetch}
                disabled={!employeeId || loading}
                sx={{ height: 56 }}
              >
                {loading ? <CircularProgress size={20} /> : t('common.search')}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Typography color="error">{error}</Typography>
        )}

        {report && (
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">{report.full_name}</Typography>
                <Stack direction="row" spacing={3}>
                  {report.total_salary != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('staffing.salary.totalSalary')}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {report.total_salary.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {report.total_bonus != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('staffing.salary.totalBonus')}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {report.total_bonus.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {report.total != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('staffing.salary.total')}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        {report.total.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>

              {report.entries && report.entries.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('staffing.salary.date')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.hoursWorked')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.ordersCount')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.revenue')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.salary')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.bonus')}</TableCell>
                      <TableCell align="right">{t('staffing.salary.total')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.entries.map((entry, idx) => (
                       
                      <TableRow key={idx}>
                        <TableCell>{entry.date ?? '-'}</TableCell>
                        <TableCell align="right">{entry.hours_worked ?? '-'}</TableCell>
                        <TableCell align="right">{entry.orders_count ?? '-'}</TableCell>
                        <TableCell align="right">{entry.revenue?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell align="right">{entry.salary?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell align="right">{entry.bonus?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell align="right">{entry.total?.toLocaleString() ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>
    </DashboardContent>
  );
}
