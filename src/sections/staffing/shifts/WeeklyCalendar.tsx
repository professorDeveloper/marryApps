import type { Dayjs } from 'dayjs';

import useSWR from 'swr';
import { mutate } from 'src/lib/swr';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Stack,
  alpha,
  Button,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  DialogTitle,
  ToggleButton,
  FormControl,
  DialogActions,
  DialogContent,
  useTheme,
  ToggleButtonGroup,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { fetcher, poster, endpoints } from 'src/lib/axios';

dayjs.extend(isoWeek);

// ----------------------------------------------------------------------
// Layout constants

const DAY_START   = 6;   // 06:00
const DAY_END     = 23;  // 23:00
const HOURS_PER_DAY = DAY_END - DAY_START;
// Only label these hours in the header (every 6h)
const TICK_HOURS  = [6, 12, 18];
// Gridlines every 3h inside rows
const GRID_HOURS  = [6, 9, 12, 15, 18, 21];

// ----------------------------------------------------------------------
// Types

interface IEmployee {
  id: string;
  full_name: string;
  role?: string;
}

interface IEmployeeShift {
  id: string;
  employee_id: string;
  employee?: IEmployee;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
}

interface IShiftTemplate {
  id: string;
  employee_id: string;
  recurrence_type: 'daily' | 'weekly' | 'custom_weekdays';
  weekdays?: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date?: string;
  is_active?: boolean;
}

interface ICalendarSlot {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: string;
  source: 'shift' | 'template';
}

interface EmployeeShiftListResponse { data?: IEmployeeShift[]; items?: IEmployeeShift[] }
interface EmployeeListResponse      { data?: IEmployee[] }
interface TemplateListResponse      { data?: IShiftTemplate[]; items?: IShiftTemplate[] }

// ----------------------------------------------------------------------
// Time helpers

/** Parse any time string (ISO datetime or "HH:MM") → { h, m } in local time */
function parseTime(s?: string): { h: number; m: number } | null {
  if (!s) return null;
  if (s.includes('T') || s.endsWith('Z')) {
    const d = dayjs(s);
    return { h: d.hour(), m: d.minute() };
  }
  const [h, m = 0] = s.split(':').map(Number);
  return { h, m };
}

function formatHM(s?: string): string {
  const t = parseTime(s);
  if (!t) return '';
  return `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------
// Template expansion

function expandTemplateForWeek(tpl: IShiftTemplate, days: Dayjs[]): ICalendarSlot[] {
  return days
    .filter((d) => {
      if (d.isBefore(dayjs(tpl.start_date), 'day')) return false;
      if (tpl.end_date && d.isAfter(dayjs(tpl.end_date), 'day')) return false;
      if (tpl.recurrence_type === 'daily') return true;
      return tpl.weekdays?.includes(d.isoWeekday()) ?? false;
    })
    .map((d) => ({
      id: `tpl-${tpl.id}-${d.format('YYYY-MM-DD')}`,
      employee_id: tpl.employee_id,
      date: d.format('YYYY-MM-DD'),
      start_time: tpl.start_time,
      end_time: tpl.end_time,
      source: 'template' as const,
    }));
}

// ----------------------------------------------------------------------
// Status colours

const STATUS_COLOR: Record<string, string> = {
  approved: 'var(--success)',
  active:   'var(--success)',
  pending:  'var(--warning)',
  rejected: 'var(--danger)',
  completed:'var(--text-3)',
};

// ----------------------------------------------------------------------
// Branch helper

function getBranchId(): string | null {
  const role = localStorage.getItem('user_role') ?? '';
  return role.toLowerCase() === 'superadmin'
    ? localStorage.getItem('selectedBranchId')
    : localStorage.getItem('branch_id');
}

// ----------------------------------------------------------------------
// Dialog defaults

const EMPTY_SHIFT_FORM    = { start_time: '09:00', end_time: '18:00' };
const EMPTY_TEMPLATE_FORM = {
  recurrence_type: 'weekly' as IShiftTemplate['recurrence_type'],
  weekdays: [1, 2, 3, 4, 5],
  start_time: '09:00',
  end_time: '18:00',
  start_date: dayjs().format('YYYY-MM-DD'),
  end_date: '',
};
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ----------------------------------------------------------------------

export function WeeklyCalendar() {
  const { t } = useTranslation('menu');
  const theme  = useTheme();

  const [weekStart, setWeekStart] = useState<Dayjs>(() => dayjs().startOf('isoWeek'));
  const weekEnd = weekStart.add(6, 'day');
  const days    = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekStart]
  );

  // ---- dialog state ----
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [dialogType,    setDialogType]    = useState<'shift' | 'template'>('shift');
  const [prefillEmp,    setPrefillEmp]    = useState('');
  const [prefillDate,   setPrefillDate]   = useState('');
  const [shiftForm,     setShiftForm]     = useState(EMPTY_SHIFT_FORM);
  const [templateForm,  setTemplateForm]  = useState(EMPTY_TEMPLATE_FORM);
  const [saving,        setSaving]        = useState(false);

  // ---- data ----
  const branchId   = useMemo(getBranchId, []);

  const { data: empData } = useSWR<EmployeeListResponse | IEmployee[]>(
    endpoints.users.list, fetcher
  );
  const employees: IEmployee[] = useMemo(() => {
    if (!empData) return [];
    if (Array.isArray(empData)) return empData;
    return (empData as EmployeeListResponse).data ?? [];
  }, [empData]);

  const dateFrom  = weekStart.toISOString();
  const dateTo    = weekEnd.endOf('day').toISOString();

  const shiftsUrl = useMemo(() => {
    if (!branchId) return null;
    return `${endpoints.staffing.branchShifts(branchId)}?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}&limit=200`;
  }, [branchId, dateFrom, dateTo]);

  const { data: shiftsData } = useSWR<EmployeeShiftListResponse | IEmployeeShift[]>(shiftsUrl, fetcher);
  const realShifts: IEmployeeShift[] = useMemo(() => {
    if (!shiftsData) return [];
    if (Array.isArray(shiftsData)) return shiftsData;
    return (shiftsData as EmployeeShiftListResponse).data
        ?? (shiftsData as EmployeeShiftListResponse).items
        ?? [];
  }, [shiftsData]);

  const templatesUrl = branchId
    ? `${endpoints.staffing.employeeShiftTemplates.list}?branch_id=${branchId}&limit=100`
    : null;
  const { data: templatesData } = useSWR<TemplateListResponse | IShiftTemplate[]>(templatesUrl, fetcher);
  const templates: IShiftTemplate[] = useMemo(() => {
    if (!templatesData) return [];
    if (Array.isArray(templatesData)) return templatesData;
    return (templatesData as TemplateListResponse).data
        ?? (templatesData as TemplateListResponse).items
        ?? [];
  }, [templatesData]);

  // slot index: empId → dayKey → slot[]  (real shifts override templates)
  const slotIndex = useMemo(() => {
    const idx: Record<string, Record<string, ICalendarSlot[]>> = {};

    for (const s of realShifts) {
      const dayKey = dayjs(s.date ?? s.start_time).format('YYYY-MM-DD');
      if (!idx[s.employee_id]) idx[s.employee_id] = {};
      if (!idx[s.employee_id][dayKey]) idx[s.employee_id][dayKey] = [];
      idx[s.employee_id][dayKey].push({
        id: s.id,
        employee_id: s.employee_id,
        date: dayKey,
        start_time: s.start_time ?? '',
        end_time:   s.end_time   ?? '',
        status:     s.status,
        source:     'shift',
      });
    }

    for (const tpl of templates) {
      for (const occ of expandTemplateForWeek(tpl, days)) {
        if (!idx[occ.employee_id]) idx[occ.employee_id] = {};
        if (!idx[occ.employee_id][occ.date]) idx[occ.employee_id][occ.date] = [occ];
      }
    }

    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realShifts, templates, weekStart.toString()]);

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees]
  );

  const isToday = (d: Dayjs) => d.isSame(dayjs(), 'day');

  // ---- click handler ----
  const openAddDialog = (empId: string, date: string, startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    const endH   = Math.min(h + 1, DAY_END - 1);
    const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setPrefillEmp(empId);
    setPrefillDate(date);
    setShiftForm({ start_time: startTime, end_time: endTime });
    setTemplateForm({ ...EMPTY_TEMPLATE_FORM, start_date: date, start_time: startTime, end_time: endTime });
    setDialogType('shift');
    setDialogOpen(true);
  };

  // ---- save ----
  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialogType === 'shift') {
        await poster(endpoints.staffing.employeeShifts, {
          employee_id: prefillEmp,
          date:        prefillDate,
          start_time:  shiftForm.start_time,
          end_time:    shiftForm.end_time,
        });
        mutate(shiftsUrl);
      } else {
        await poster(endpoints.staffing.employeeShiftTemplates.create, {
          employee_id:    prefillEmp,
          recurrence_type: templateForm.recurrence_type,
          weekdays:       templateForm.recurrence_type !== 'daily' ? templateForm.weekdays : undefined,
          start_time:     templateForm.start_time,
          end_time:       templateForm.end_time,
          start_date:     templateForm.start_date,
          end_date:       templateForm.end_date || undefined,
        });
        mutate(templatesUrl);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleWeekday = (day: number) =>
    setTemplateForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(day)
        ? f.weekdays.filter((d) => d !== day)
        : [...f.weekdays, day].sort(),
    }));

  const ROW_H = 52;   // px per employee row
  const EMP_W = 160;  // sticky employee label column (px)

  // Percentage helpers — positions within one day cell (0–100%)
  const toPct = (timeStr?: string): number => {
    const t = parseTime(timeStr);
    if (!t) return 0;
    const mins = t.h * 60 + t.m - DAY_START * 60;
    return Math.max(0, Math.min(100, (mins / (HOURS_PER_DAY * 60)) * 100));
  };

  const durPct = (start?: string, end?: string): number => {
    const s = parseTime(start);
    const e = parseTime(end);
    if (!s || !e) return 100 / HOURS_PER_DAY;
    const mins = (e.h * 60 + e.m) - (s.h * 60 + s.m);
    return Math.max(0.5, (mins / (HOURS_PER_DAY * 60)) * 100);
  };

  // Click on a day cell → snap to 15-min → open dialog
  const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, empId: string, dayKey: string) => {
    const rect    = e.currentTarget.getBoundingClientRect();
    const pct     = (e.clientX - rect.left) / rect.width;
    const totalMins = pct * HOURS_PER_DAY * 60;
    const snapped = Math.round(totalMins / 15) * 15;
    const h = DAY_START + Math.min(Math.floor(snapped / 60), HOURS_PER_DAY - 1);
    const m = snapped % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    openAddDialog(empId, dayKey, timeStr);
  };

  return (
    <Box sx={{ overflow: 'auto', position: 'relative' }}>

      {/* ── Week navigation ── */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => setWeekStart((w) => w.subtract(1, 'week'))}>
          <Iconify icon="eva:arrow-ios-back-fill" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ minWidth: 200, textAlign: 'center' }}>
          {weekStart.format('D MMM')} – {weekEnd.format('D MMM YYYY')}
        </Typography>
        <IconButton onClick={() => setWeekStart((w) => w.add(1, 'week'))}>
          <Iconify icon="eva:arrow-ios-forward-fill" />
        </IconButton>
        <Button size="small" variant="outlined" onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}>
          {t('staffing.shifts.today')}
        </Button>
      </Stack>

      {/* ── Legend ── */}
      <Stack direction="row" spacing={2} mb={1.5}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">{t('staffing.shifts.realShift')}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, border: '2px dashed', borderColor: 'text.disabled', opacity: 0.6 }} />
          <Typography variant="caption" color="text.secondary">{t('staffing.shifts.fromTemplate')}</Typography>
        </Stack>
      </Stack>

      {/* ── Gantt grid — fills available width, no horizontal scroll ── */}
      <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, overflow: 'hidden' }}>

        {/* ── Sticky header ── */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: `${EMP_W}px repeat(7, 1fr)`,
            bgcolor: 'background.neutral',
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          {/* corner */}
          <Box sx={{ borderRight: `1px solid ${theme.palette.divider}` }} />

          {/* One header cell per day — day label + 6h tick marks */}
          {days.map((d, di) => {
            const today = isToday(d);
            return (
              <Box
                key={d.toString()}
                sx={{
                  position: 'relative',
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  bgcolor: today ? alpha(theme.palette.primary.main, 0.07) : undefined,
                  py: 0.5,
                  px: 1,
                }}
              >
                {/* Day label */}
                <Typography
                  variant="caption"
                  fontWeight={today ? 700 : 500}
                  color={today ? 'primary.main' : 'text.primary'}
                  display="block"
                >
                  {d.format('ddd D MMM')}
                </Typography>

                {/* Hour tick labels — only every 6 h, skip the first (= day start) */}
                <Box sx={{ position: 'relative', height: 14 }}>
                  {TICK_HOURS.filter((h) => h > DAY_START).map((h) => (
                    <Typography
                      key={h}
                      sx={{
                        position: 'absolute',
                        left: `${((h - DAY_START) / HOURS_PER_DAY) * 100}%`,
                        top: 0,
                        fontSize: '0.58rem',
                        color: 'text.disabled',
                        lineHeight: 1,
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </Typography>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ── Employee rows ── */}
        {employees.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('noData')}</Typography>
          </Box>
        )}

        {employees.map((emp) => (
          <Box
            key={emp.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: `${EMP_W}px repeat(7, 1fr)`,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Employee label */}
            <Box
              sx={{
                height: ROW_H,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 1.5,
                bgcolor: 'background.neutral',
                borderRight: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2" noWrap fontWeight={600}>{emp.full_name}</Typography>
              {emp.role && (
                <Typography variant="caption" color="text.secondary" noWrap>{emp.role}</Typography>
              )}
            </Box>

            {/* One cell per day */}
            {days.map((d) => {
              const dayKey = d.format('YYYY-MM-DD');
              const slots  = slotIndex[emp.id]?.[dayKey] ?? [];
              const today  = isToday(d);

              return (
                <Box
                  key={dayKey}
                  onClick={(e) => handleDayClick(e, emp.id, dayKey)}
                  sx={{
                    position: 'relative',
                    height: ROW_H,
                    borderLeft: `1px solid ${theme.palette.divider}`,
                    bgcolor: today ? alpha(theme.palette.primary.main, 0.03) : undefined,
                    cursor: 'crosshair',
                    overflow: 'hidden',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  {/* Gridlines every 3 h */}
                  {GRID_HOURS.filter((h) => h > DAY_START).map((h) => (
                    <Box
                      key={h}
                      sx={{
                        position: 'absolute',
                        left: `${((h - DAY_START) / HOURS_PER_DAY) * 100}%`,
                        top: 0, bottom: 0,
                        borderLeft: `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}

                  {/* Shift blocks */}
                  {slots.map((slot) => {
                    const isTemplate = slot.source === 'template';
                    const color      = STATUS_COLOR[slot.status ?? ''] ?? theme.palette.primary.main;
                    const startLabel = formatHM(slot.start_time);
                    const endLabel   = formatHM(slot.end_time);

                    return (
                      <Tooltip
                        key={slot.id}
                        title={`${d.format('ddd D')} · ${startLabel}–${endLabel}${isTemplate ? ' (template)' : ` · ${slot.status ?? ''}`}`}
                        placement="top"
                      >
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            position: 'absolute',
                            left: `${toPct(slot.start_time)}%`,
                            width: `${durPct(slot.start_time, slot.end_time)}%`,
                            top: 6,
                            bottom: 6,
                            minWidth: 4,
                            bgcolor: isTemplate
                              ? alpha(theme.palette.text.secondary, 0.12)
                              : alpha(color, 0.85),
                            border: `1.5px ${isTemplate ? 'dashed' : 'solid'} ${isTemplate ? theme.palette.text.disabled : color}`,
                            borderRadius: 0.75,
                            overflow: 'hidden',
                            cursor: 'default',
                            px: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'opacity .15s',
                            '&:hover': { opacity: 0.8 },
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              lineHeight: 1,
                              color: isTemplate ? 'text.secondary' : 'white',
                            }}
                          >
                            {startLabel}–{endLabel}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* ── Add Shift / Template Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {t('staffing.shifts.addShift')}
          {prefillEmp && employeeMap[prefillEmp] && (
            <Typography variant="body2" color="text.secondary">
              {employeeMap[prefillEmp].full_name} · {prefillDate}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <ToggleButtonGroup
            exclusive
            value={dialogType}
            onChange={(_, v) => { if (v) setDialogType(v); }}
            size="small"
            fullWidth
          >
            <ToggleButton value="shift">{t('staffing.shifts.oneTime')}</ToggleButton>
            <ToggleButton value="template">{t('staffing.shifts.recurring')}</ToggleButton>
          </ToggleButtonGroup>

          {dialogType === 'shift' ? (
            <>
              <TextField
                label={t('staffing.shifts.startTime')}
                value={shiftForm.start_time}
                onChange={(e) => setShiftForm((f) => ({ ...f, start_time: e.target.value }))}
                placeholder="09:00"
                fullWidth
              />
              <TextField
                label={t('staffing.shifts.endTime')}
                value={shiftForm.end_time}
                onChange={(e) => setShiftForm((f) => ({ ...f, end_time: e.target.value }))}
                placeholder="18:00"
                fullWidth
              />
            </>
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel>{t('staffing.shifts.recurrenceType')}</InputLabel>
                <Select
                  value={templateForm.recurrence_type}
                  label={t('staffing.shifts.recurrenceType')}
                  onChange={(e) =>
                    setTemplateForm((f) => ({
                      ...f,
                      recurrence_type: e.target.value as IShiftTemplate['recurrence_type'],
                    }))
                  }
                >
                  <MenuItem value="daily">{t('staffing.shifts.daily')}</MenuItem>
                  <MenuItem value="weekly">{t('staffing.shifts.weekly')}</MenuItem>
                  <MenuItem value="custom_weekdays">{t('staffing.shifts.customWeekdays')}</MenuItem>
                </Select>
              </FormControl>

              {templateForm.recurrence_type !== 'daily' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                    {t('staffing.shifts.weekdays')}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {WEEKDAY_LABELS.map((label, i) => {
                      const dayNum  = i + 1;
                      const selected = templateForm.weekdays.includes(dayNum);
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
                value={templateForm.start_time}
                onChange={(e) => setTemplateForm((f) => ({ ...f, start_time: e.target.value }))}
                placeholder="09:00"
                fullWidth
              />
              <TextField
                label={t('staffing.shifts.endTime')}
                value={templateForm.end_time}
                onChange={(e) => setTemplateForm((f) => ({ ...f, end_time: e.target.value }))}
                placeholder="18:00"
                fullWidth
              />
              <TextField
                label={t('staffing.shifts.startDate')}
                type="date"
                value={templateForm.start_date}
                onChange={(e) => setTemplateForm((f) => ({ ...f, start_date: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('staffing.shifts.endDate')}
                type="date"
                value={templateForm.end_date}
                onChange={(e) => setTemplateForm((f) => ({ ...f, end_date: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
