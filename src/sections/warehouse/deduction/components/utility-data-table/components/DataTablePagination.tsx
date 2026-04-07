import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { ACCENT, BORDER } from '../utils';

export type DataTablePaginationProps = {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  rowsPerPageOptions: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
};

export function DataTablePagination({
  page,
  rowsPerPage,
  totalCount,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 2) pages.push('ellipsis');
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages - 1);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
   
        backgroundColor: 'grey.700',
        borderBottom: `2px solid ${ACCENT}`,
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Rows per page */}
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography
          sx={{
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.65)',
            fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          Rows per page:
        </Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={(e) => {
            const next = Number(e.target.value);
            onRowsPerPageChange?.(next);
            onPageChange(0);
          }}
          sx={{
            height: 30,
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.86)',
            fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            backgroundColor: 'rgba(9,9,11,0.7)',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
            '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.45)' },
          }}
        >
          {rowsPerPageOptions.map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: 12.5 }}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {/* Range display + total */}
      <Typography
        sx={{
          fontSize: 12.5,
          color: 'rgba(255,255,255,0.65)',
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {totalCount === 0
          ? '0 of 0'
          : `${page * rowsPerPage + 1}\u2013${Math.min((page + 1) * rowsPerPage, totalCount)} of ${totalCount}`}
      </Typography>

      {/* Page numbers */}
      <Stack direction="row" alignItems="center" gap={0.5}>
        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          sx={{
            width: 28,
            height: 28,
            color: 'rgba(255,255,255,0.65)',
            '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
          }}
        >
          <Iconify icon="carbon:chevron-left" width={16} />
        </IconButton>

        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <Typography
              key={`ellipsis-${idx}`}
              sx={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                px: 0.5,
                userSelect: 'none',
              }}
            >
              ...
            </Typography>
          ) : (
            <Button
              key={p}
              size="small"
              variant={p === page ? 'contained' : 'text'}
              onClick={() => onPageChange(p)}
              sx={{
                minWidth: 28,
                height: 28,
                px: 0,
                fontSize: 12,
                fontWeight: p === page ? 700 : 400,
                fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
                color: p === page ? '#000' : 'rgba(255,255,255,0.65)',
                backgroundColor: p === page ? ACCENT : 'transparent',
                '&:hover': {
                  backgroundColor: p === page ? ACCENT : 'rgba(245, 158, 11, 0.10)',
                  color: p === page ? '#000' : ACCENT,
                },
              }}
            >
              {p + 1}
            </Button>
          )
        )}

        <IconButton
          size="small"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          sx={{
            width: 28,
            height: 28,
            color: 'rgba(255,255,255,0.65)',
            '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
          }}
        >
          <Iconify icon="carbon:chevron-right" width={16} />
        </IconButton>
      </Stack>
    </Box>
  );
}
