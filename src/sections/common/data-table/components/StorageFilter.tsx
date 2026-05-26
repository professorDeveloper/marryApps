import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { NoDataTooltip } from 'src/components/no-data-tooltip';

type StorageFilterProps = {
  storageId: string;
  storages: Array<{ id: string; name: string }>;
  onStorageChange: (storageId: string) => void;
  label?: string;
  disabled?: boolean;
};

export function StorageFilter({
  storageId,
  storages,
  onStorageChange,
  label = 'Storage',
  disabled,
}: StorageFilterProps) {
  return (
    <NoDataTooltip enabled={storages.length === 0} title="No storages available">
      <TextField
        select
        size="small"
        label={label}
        value={storageId}
        onChange={(e) => onStorageChange(e.target.value)}
        disabled={disabled || storages.length === 0}
        sx={{
          minWidth: 150,
          '& .MuiInputBase-root': {
            height: 36,
            fontSize: 13.5,
            backgroundColor: 'transparent',
            borderRadius: '6px',
            fontFamily: 'var(--font-sans)',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
          '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
          '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--brand)',
            boxShadow: '0 0 0 2px var(--accent-soft)',
          },
          '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
        }}
      >
        <MenuItem value="">All</MenuItem>
        {storages.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>
    </NoDataTooltip>
  );
}
