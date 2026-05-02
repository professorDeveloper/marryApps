import { Box, Typography, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import type { DishSales } from '../types';
import { formatCurrency, formatQuantity } from '../utils/formatters';

interface DishSalesLeaderboardProps {
  data: DishSales;
}

export function DishSalesLeaderboard({ data }: DishSalesLeaderboardProps) {
  const sortedItems = [...data.items].sort((a, b) => {
    if (data.metric === 'revenue') {
      return parseFloat(b.revenue) - parseFloat(a.revenue);
    }
    return parseFloat(b.quantity) - parseFloat(a.quantity);
  });

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'var(--color-surface-1)',
        borderRadius: 2,
        border: '1px solid var(--color-border)',
        height: '100%',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 0.5 }}>
            Top Dishes
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            High-density sales performance
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Rank
                </TableCell>
                <TableCell sx={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Dish Name
                </TableCell>
                <TableCell align="right" sx={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Revenue
                </TableCell>
                <TableCell align="right" sx={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Quantity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item, index) => (
                <TableRow 
                  key={item.good_id}
                  sx={{ 
                    '&:hover': {
                      bgcolor: 'var(--color-surface-2)',
                    },
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: index < 3 ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color: index < 3 ? 'white' : 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {item.good_name}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {formatCurrency(parseFloat(item.revenue))}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {formatQuantity(parseFloat(item.quantity))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}
