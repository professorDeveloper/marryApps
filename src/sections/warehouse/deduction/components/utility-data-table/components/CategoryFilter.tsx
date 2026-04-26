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
            height: 34,
            fontSize: 12.5,
            backgroundColor: 'var(--color-surface-0)',
            borderRadius: 1,
            fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border)' },
          '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-primary)',
            boxShadow: '0 0 0 3px var(--glow-md)',
          },
        }}
      >
        <MenuItem value="">
          {t('all', 'All')}
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
