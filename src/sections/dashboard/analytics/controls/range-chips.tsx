import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const toLocalDateString = (d: Date) => dayjs(d).format('YYYY-MM-DD');
const parseLocalDate = (s: string) => dayjs(s).startOf('day').toDate();

export type PeriodId = 'day' | 'week' | 'month' | 'year';

interface Props {
  startDate: Date | null;
  endDate: Date | null;
  activePeriod: PeriodId;
  onStartDateChange: (d: Date | null) => void;
  onEndDateChange: (d: Date | null) => void;
  onPeriodChange: (p: PeriodId) => void;
  compareLabel?: string | null;
}

export function RangeChips({
  startDate,
  endDate,
  activePeriod,
  onStartDateChange,
  onEndDateChange,
  onPeriodChange,
  compareLabel,
}: Props) {
  return (
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 36,
          border: '1px solid var(--border)',
          borderRadius: '6px',
          backgroundColor: 'var(--bg2)',
          px: 1.25,
          gap: 0.75,
          '&:focus-within': { borderColor: 'var(--border2)' },
        }}
      >
        <Typography
          sx={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em', userSelect: 'none' }}
        >
          FROM
        </Typography>
        <Box
          component="input"
          type="date"
          value={startDate ? toLocalDateString(startDate) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const d = e.target.value ? parseLocalDate(e.target.value) : null;
            onStartDateChange(d);
          }}
          sx={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 12.5,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text)',
            cursor: 'pointer',
            width: 110,
            colorScheme: 'inherit',
          }}
        />
        <Typography sx={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>→</Typography>
        <Typography
          sx={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em', userSelect: 'none' }}
        >
          TO
        </Typography>
        <Box
          component="input"
          type="date"
          value={endDate ? toLocalDateString(endDate) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const d = e.target.value ? parseLocalDate(e.target.value) : null;
            onEndDateChange(d);
          }}
          sx={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 12.5,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text)',
            cursor: 'pointer',
            width: 110,
            colorScheme: 'inherit',
          }}
        />
      </Box>

      <Stack direction="row" alignItems="center" gap={0.5}>
        {(['day', 'week', 'month', 'year'] as const).map((period) => {
          const isActive = activePeriod === period;
          return (
            <Box
              key={period}
              component="button"
              onClick={() => onPeriodChange(period)}
              sx={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isActive ? '1px solid var(--border)' : 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                color: isActive ? 'var(--bg)' : 'var(--text-3)',
                backgroundColor: isActive ? 'var(--text)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
                '&:hover': { color: isActive ? 'var(--bg)' : 'var(--text)' },
              }}
            >
              {period.charAt(0).toUpperCase()}
            </Box>
          );
        })}
      </Stack>

      {compareLabel && (
        <div className="range-compare">
          <span className="range-compare-lbl">vs</span>
          <span className="range-compare-val">{compareLabel}</span>
        </div>
      )}
    </Stack>
  );
}
