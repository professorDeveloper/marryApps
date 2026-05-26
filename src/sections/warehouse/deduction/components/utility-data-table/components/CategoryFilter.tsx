import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { useTranslation } from 'react-i18next';

import { NoDataTooltip } from 'src/components/no-data-tooltip';

type CategoryFilterProps = {
  categoryId: string;
  categories: Array<{ id: string; name: string }>;
  onCategoryChange: (categoryId: string) => void;
  label?: string;
  disabled?: boolean;
};

export function CategoryFilter({
  categoryId,
  categories,
  onCategoryChange,
  label = 'Category',
  disabled,
}: CategoryFilterProps) {
  const { t } = useTranslation('common');
  return (
    <NoDataTooltip enabled={categories.length === 0} title="No categories available">
      <TextField
        select
        size="small"
        label={label}
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        disabled={disabled || categories.length === 0}
        sx={{
          minWidth: 150,
          '& .MuiInputBase-root': {
            height: 36,
            fontSize: 13.5,
            backgroundColor: 'var(--bg2)',
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
        <MenuItem value="">
          {t('all')}
        </MenuItem>
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
    </NoDataTooltip>
  );
}
