import type { DataTableColumn } from 'src/sections/common/data-table/types/types';

import useSWR, { mutate } from 'swr';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Drawer,
  Select,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { WeeklyCalendar } from './WeeklyCalendar';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CELL_SX } from 'src/sections/common/data-table/utils/constants';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { fetcher, poster, putter, deleter, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

type RecurrenceType = 'daily' | 'weekly' | 'custom_weekdays';

interface IShiftTemplate {
  id: string;
  employee_id: string;
  employee?: { id: string; full_name: string };
  recurrence_type: RecurrenceType;
  weekdays?: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date?: string;
  branch_id?: string;
  is_active?: boolean;
}

interface TemplateFormState {
  employee_id: string;
  recurrence_type: RecurrenceType;
  weekdays: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
}

interface IEmployee {
  id: string;
  full_name: string;
  role?: string;
}

// ----------------------------------------------------------------------

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  employee_id: '',
  recurrence_type: 'weekly',
  weekdays: [1, 2, 3, 4, 5],
  start_time: '09:00',
  end_time: '18:00',
  start_date: '',
  end_date: '',
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  custom_weekdays: 'Custom weekdays',
};

// ----------------------------------------------------------------------

export function ShiftsListView() {
  const { t } = useTranslation('menu');

  const [drawerOpen, setDrawerOpen] = useState(false);

  const branchId = useMemo(() => {
    const role = localStorage.getItem('user_role') ?? '';
    return role.toLowerCase() === 'superadmin'
      ? localStorage.getItem('selectedBranchId')
      : localStorage.getItem('branch_id');
  }, []);

  const templatesKey = branchId
    ? `${endpoints.staffing.employeeShiftTemplates.list}?branch_id=${branchId}&limit=100`
    : null;

  const { data: templatesData } = useSWR<
    { data?: IShiftTemplate[]; items?: IShiftTemplate[] } | IShiftTemplate[]
  >(templatesKey, fetcher);

  const templates: IShiftTemplate[] = useMemo(() => {
    if (!templatesData) return [];
    if (Array.isArray(templatesData)) return templatesData;
    return templatesData.data ?? templatesData.items ?? [];
  }, [templatesData]);

  const { data: empData } = useSWR<{ data?: IEmployee[] } | IEmployee[]>(
    endpoints.users.list,
    fetcher
  );
  const employees: IEmployee[] = useMemo(() => {
    if (!empData) return [];
    if (Array.isArray(empData)) return empData;
    return (empData as { data?: IEmployee[] }).data ?? [];
  }, [empData]);

  const [tplDialogOpen, setTplDialogOpen] = useState(false);
  const [tplEditingId, setTplEditingId] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [tplDeleteId, setTplDeleteId] = useState<string | null>(null);
  const [tplDeleteOpen, setTplDeleteOpen] = useState(false);
  const [tplSaving, setTplSaving] = useState(false);

  const openTplCreate = useCallback(() => {
    setTplEditingId(null);
    setTplForm(EMPTY_TEMPLATE_FORM);
    setTplDialogOpen(true);
  }, []);

  const openTplEdit = useCallback((row: IShiftTemplate) => {
    setTplEditingId(row.id);
    setTplForm({
      employee_id: row.employee_id,
      recurrence_type: row.recurrence_type,
      weekdays: row.weekdays ?? [],
      start_time: row.start_time,
      end_time: row.end_time,
      start_date: row.start_date,
      end_date: row.end_date ?? '',
    });
    setTplDialogOpen(true);
  }, []);

  const handleTplSave = useCallback(async () => {
    setTplSaving(true);
    try {
      const payload = {
        employee_id: tplForm.employee_id,
        recurrence_type: tplForm.recurrence_type,
        weekdays: tplForm.recurrence_type !== 'daily' ? tplForm.weekdays : undefined,
        start_time: tplForm.start_time,
        end_time: tplForm.end_time,
        start_date: tplForm.start_date,
        end_date: tplForm.end_date || undefined,
      };
      if (tplEditingId) {
        await putter(endpoints.staffing.employeeShiftTemplates.update(tplEditingId), payload);
      } else {
        await poster(endpoints.staffing.employeeShiftTemplates.create, payload);
      }
      mutate(templatesKey);
      setTplDialogOpen(false);
    } finally {
      setTplSaving(false);
    }
  }, [tplEditingId, tplForm, templatesKey]);

  const handleTplDelete = useCallback(async () => {
    if (!tplDeleteId) return;
    await deleter(endpoints.staffing.employeeShiftTemplates.delete(tplDeleteId));
    mutate(templatesKey);
    setTplDeleteOpen(false);
    setTplDeleteId(null);
  }, [tplDeleteId, templatesKey]);

  const toggleWeekday = (day: number) => {
    setTplForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(day)
        ? f.weekdays.filter((d) => d !== day)
        : [...f.weekdays, day].sort(),
    }));
  };

  const templateColumns: DataTableColumn<IShiftTemplate>[] = useMemo(
    () => [
      {
        key: 'employee',
        label: t('staffing.shifts.employee'),
        sortable: false,
        filterable: true,
        width: '1.5fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.employee?.full_name ?? row.employee_id,
        renderCell: ({ row }: { row: IShiftTemplate }) => (
          <Box sx={CELL_SX}>{row.employee?.full_name ?? row.employee_id}</Box>
        ),
      },
      {
        key: 'recurrence_type',
        label: t('staffing.shifts.recurrenceType'),
        sortable: false,
        filterable: false,
        width: '1fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.recurrence_type,
        renderCell: ({ row }: { row: IShiftTemplate }) => (
          <Box sx={CELL_SX}>{RECURRENCE_LABELS[row.recurrence_type] ?? row.recurrence_type}</Box>
        ),
      },
      {
        key: 'weekdays',
        label: t('staffing.shifts.weekdays'),
        sortable: false,
        filterable: false,
        width: '1.5fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => (row.weekdays ?? []).join(','),
        renderCell: ({ row }: { row: IShiftTemplate }) => (
          <Box sx={{ ...CELL_SX, display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
            {row.recurrence_type === 'daily' ? (
              <Typography variant="caption">Every day</Typography>
            ) : (
              (row.weekdays ?? []).map((d) => (
                <Chip key={d} label={WEEKDAY_LABELS[d - 1]} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              ))
            )}
          </Box>
        ),
      },
      {
        key: 'start_time',
        label: t('staffing.shifts.startTime'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.start_time,
        renderCell: ({ row }: { row: IShiftTemplate }) => <Box sx={CELL_SX}>{row.start_time}</Box>,
      },
      {
        key: 'end_time',
        label: t('staffing.shifts.endTime'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.end_time,
        renderCell: ({ row }: { row: IShiftTemplate }) => <Box sx={CELL_SX}>{row.end_time}</Box>,
      },
      {
        key: 'start_date',
        label: t('staffing.shifts.startDate'),
        sortable: true,
        filterable: false,
        width: '0.9fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.start_date,
        renderCell: ({ row }: { row: IShiftTemplate }) => <Box sx={CELL_SX}>{row.start_date}</Box>,
      },
      {
        key: 'end_date',
        label: t('staffing.shifts.endDate'),
        sortable: false,
        filterable: false,
        width: '0.9fr',
        align: 'left',
        getValue: (row: IShiftTemplate) => row.end_date ?? '—',
        renderCell: ({ row }: { row: IShiftTemplate }) => <Box sx={CELL_SX}>{row.end_date ?? '—'}</Box>,
      },
      {
        key: 'actions',
        label: t('common.actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center',
        renderCell: ({ row }: { row: IShiftTemplate }) => (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', py: 1.5, px: 1 }}>
            <IconButton
              size="small"
              onClick={() => openTplEdit(row)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => { setTplDeleteId(row.id); setTplDeleteOpen(true); }}
              sx={{ color: 'error.main', '&:hover': { color: 'error.dark' } }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [t, openTplEdit]
  );

  return (
    <>
      <DashboardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
          '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
          '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
        }}
      >
        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:calendar-date-bold" />}
            onClick={() => setDrawerOpen(true)}
          >
            {t('staffing.shifts.recurringTemplates')}
          </Button>
        </Box>

        {/* Unified calendar — real shifts + template occurrences */}
        <WeeklyCalendar />
      </DashboardContent>

      {/* Recurring Templates side drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 700 }, p: 2, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {t('staffing.shifts.recurringTemplates')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openTplCreate}
            >
              {t('common.add')}
            </Button>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DeductionUtilityDataTable
            persistKey="staffing-shift-templates-table"
            data={templates}
            getRowId={(row: IShiftTemplate) => row.id}
            columns={templateColumns}
            defaultConfig={{
              order: ['employee', 'recurrence_type', 'weekdays', 'start_time', 'end_time', 'start_date', 'end_date', 'actions'],
              visibility: { employee: true, recurrence_type: true, weekdays: true, start_time: true, end_time: true, start_date: true, end_date: true, actions: true },
              widths: { employee: '1.5fr', recurrence_type: '1fr', weekdays: '1.5fr', start_time: '0.7fr', end_time: '0.7fr', start_date: '0.9fr', end_date: '0.9fr', actions: '0.7fr' },
            }}
            onReset={() => {}}
          />
        </Box>
      </Drawer>

      {/* Template — Create / Edit dialog */}
      <Dialog open={tplDialogOpen} onClose={() => setTplDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {tplEditingId
            ? t('staffing.shifts.editTemplate')
            : t('staffing.shifts.createTemplate')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('staffing.shifts.employee')}</InputLabel>
            <Select
              value={tplForm.employee_id}
              label={t('staffing.shifts.employee')}
              onChange={(e) => setTplForm((f) => ({ ...f, employee_id: e.target.value }))}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('staffing.shifts.recurrenceType')}</InputLabel>
            <Select
              value={tplForm.recurrence_type}
              label={t('staffing.shifts.recurrenceType')}
              onChange={(e) =>
                setTplForm((f) => ({ ...f, recurrence_type: e.target.value as RecurrenceType }))
              }
            >
              <MenuItem value="daily">{t('staffing.shifts.daily')}</MenuItem>
              <MenuItem value="weekly">{t('staffing.shifts.weekly')}</MenuItem>
              <MenuItem value="custom_weekdays">{t('staffing.shifts.customWeekdays')}</MenuItem>
            </Select>
          </FormControl>

          {tplForm.recurrence_type !== 'daily' && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                {t('staffing.shifts.weekdays')}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {WEEKDAY_LABELS.map((label, i) => {
                  const dayNum = i + 1;
                  const selected = tplForm.weekdays.includes(dayNum);
                  return (
                    <Chip
                      key={dayNum}
                      label={label}
                      size="small"
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      onClick={() => toggleWeekday(dayNum)}
                      sx={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          <TextField
            label={t('staffing.shifts.startTime')}
            value={tplForm.start_time}
            onChange={(e) => setTplForm((f) => ({ ...f, start_time: e.target.value }))}
            placeholder="09:00"
            fullWidth
          />
          <TextField
            label={t('staffing.shifts.endTime')}
            value={tplForm.end_time}
            onChange={(e) => setTplForm((f) => ({ ...f, end_time: e.target.value }))}
            placeholder="18:00"
            fullWidth
          />
          <TextField
            label={t('staffing.shifts.startDate')}
            type="date"
            value={tplForm.start_date}
            onChange={(e) => setTplForm((f) => ({ ...f, start_date: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t('staffing.shifts.endDate')}
            type="date"
            value={tplForm.end_date}
            onChange={(e) => setTplForm((f) => ({ ...f, end_date: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTplDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleTplSave}
            disabled={tplSaving || !tplForm.employee_id || !tplForm.start_date}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template — Delete confirmation */}
      <Dialog open={tplDeleteOpen} onClose={() => setTplDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.delete')}</DialogTitle>
        <DialogContent>
          {t('staffing.shifts.deleteTemplateConfirm')}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTplDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleTplDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
