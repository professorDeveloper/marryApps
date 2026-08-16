import { memo, useCallback } from 'react';

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

interface Props {
    value: boolean;
    onChange: (value: boolean) => void;
    label: string;
    disabled?: boolean;
}

export const SwitchFieldV2 = memo<Props>(({ value, onChange, label, disabled }) => {
    const handleChange = useCallback(
        (_: any, checked: boolean) => onChange(checked),
        [onChange],
    );

    return (
        <FormControlLabel
            control={<Switch checked={value ?? false} onChange={handleChange} disabled={disabled} />}
            label={label}
        />
    );
});

SwitchFieldV2.displayName = 'SwitchFieldV2';
