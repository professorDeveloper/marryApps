import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { useTranslation } from 'react-i18next';

import { NoDataTooltip } from 'src/components/no-data-tooltip';

type DepartmentFilterProps = {
  departmentId: string;
  departments: Array<{ id: string; name: string }>;
  onDepartmentChange: (departmentId: string) => void;
  label?: string;
  disabled?: boolean;
};

export function DepartmentFilter({
  departmentId,
  departments,
  onDepartmentChange,
  label = 'Department',
  disabled,
}: DepartmentFilterProps) {
  const { t } = useTranslation('common');
  return (
    <NoDataTooltip enabled={departments.length === 0} title="No departments available">
      <TextField
        select
        size="small"
        label={label}
        value={departmentId}
        onChange={(e) => onDepartmentChange(e.target.value)}
        disabled={disabled || departments.length === 0}
        sx={{
          minWidth: 150,
          '& .MuiInputBase-root': {
            height: 34,
            fontSize: 12.5,
            backgroundColor: 'var(--color-surface-0)',
            borderRadius: 1,
            fontFamily: 'var(--font-sans)',
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
        {departments.map((d) => (
          <MenuItem key={d.id} value={d.id}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>
    </NoDataTooltip>
  );
}