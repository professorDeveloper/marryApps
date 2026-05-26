import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { NoDataTooltip } from 'src/components/no-data-tooltip';

type Option = { id: string; label: string };

type Props = {
  label: string;
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  noDataText?: string;
};

export function MultiSelectFilter({ label, options, value, onChange, disabled, noDataText }: Props) {
  const selected = options.filter((o) => value.includes(o.id));

  return (
    <NoDataTooltip enabled={options.length === 0} title={noDataText ?? 'No data available'}>
      <Autocomplete
        multiple
        size="small"
        disableCloseOnSelect
        options={options}
        value={selected}
        onChange={(_, next) => onChange(next.map((o) => o.id))}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        disabled={disabled || options.length === 0}
        sx={{ minWidth: 180, maxWidth: 320 }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return <Chip key={key} {...tagProps} size="small" label={option.label} />;
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={selected.length === 0 ? label : ''}
            sx={{
              '& .MuiInputBase-root': {
                minHeight: 36,
                fontSize: 13.5,
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        )}
      />
    </NoDataTooltip>
  );
}
