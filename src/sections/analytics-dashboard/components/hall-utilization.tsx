import { Box, Typography, Stack } from '@mui/material';

import { HALL_UTILIZATION_MOCK_DATA } from '../constants';
import { getUtilizationColor } from '../utils/formatters';

interface HallUtilizationProps {
  data?: typeof HALL_UTILIZATION_MOCK_DATA;
}

export function HallUtilization({ data = HALL_UTILIZATION_MOCK_DATA }: HallUtilizationProps) {
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'var(--color-surface-1)',
        borderRadius: 2,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 0.5 }}>
            {data.totalCapacity}T Capacity Mapping
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            7-Day Matrix
          </Typography>
        </Box>

        <Stack spacing={2}>
          {data.timeSlots.map((timeSlot) => (
            <Box key={timeSlot}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 1.5 }}>
                {timeSlot}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {data.days.map((day) => {
                  const slotData = data.data.find(
                    (d) => d.day === day && d.timeSlot === timeSlot
                  );
                  const utilization = slotData?.utilization || 0;
                  const bgColor = getUtilizationColor(utilization);
                  
                  return (
                    <Box
                      key={`${day}-${timeSlot}`}
                      flex="1"
                      minWidth={85}
                      sx={{
                        p: 1.5,
                        backgroundColor: bgColor,
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: 1,
                        minHeight: 70,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        opacity: 0.85,
                        transition: 'all 0.2s',
                        '&:hover': {
                          opacity: 1,
                          transform: 'translateY(-2px)',
                          boxShadow: 'var(--shadow-card-medium)',
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.9, mb: 0.5 }}>
                        {day}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
                        {utilization}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
