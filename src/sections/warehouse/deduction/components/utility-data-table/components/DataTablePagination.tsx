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
   
        backgroundColor: 'var(--color-surface-1)',
        borderTop: '1px solid var(--color-border)',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Rows per page */}
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography
          sx={{
            fontSize: 12.5,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
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
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            backgroundColor: 'var(--color-surface-0)',
            borderRadius: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-primary)' },
            '& .MuiSelect-icon': { color: 'var(--color-text-muted)' },
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
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
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
            color: 'var(--color-text-muted)',
            '&:hover': { color: 'var(--color-primary)', backgroundColor: 'var(--glow-sm)', boxShadow: 'var(--glow-shadow-md)' },
            '&.Mui-disabled': { color: 'var(--color-text-subtle)' },
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
                color: 'var(--color-text-subtle)',
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
                fontFamily: 'var(--font-sans)',
                color: p === page ? 'var(--color-text-on-primary)' : 'var(--color-text-muted)',
                backgroundColor: p === page ? 'var(--color-primary)' : 'transparent',
                '&:hover': {
                  backgroundColor: p === page ? 'var(--color-primary)' : 'var(--glow-sm)',
                  color: p === page ? 'var(--color-text-on-primary)' : 'var(--color-primary)',
                  boxShadow: 'var(--glow-shadow-md)',
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
            color: 'var(--color-text-muted)',
            '&:hover': { color: 'var(--color-primary)', backgroundColor: 'var(--glow-sm)', boxShadow: 'var(--glow-shadow-md)' },
            '&.Mui-disabled': { color: 'var(--color-text-subtle)' },
          }}
        >
          <Iconify icon="carbon:chevron-right" width={16} />
        </IconButton>
      </Stack>
    </Box>
  );
}
