import { useTranslation } from 'react-i18next';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

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
        <MenuItem value="">
          {t('all')}
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