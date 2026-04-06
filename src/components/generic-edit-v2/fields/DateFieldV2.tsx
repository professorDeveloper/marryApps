import dayjs from 'dayjs';
import { memo, useCallback } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface Props {
    value: string | null;
    onChange: (value: string) => void;
    label: string;
    required?: boolean;
    helperText?: string;
    fullWidth?: boolean;
    disabled?: boolean;
}

export const DateFieldV2 = memo<Props>(({
    value,
    onChange,
    label,
    required,
    helperText,
    fullWidth = true,
    disabled,
}) => {
    const dateValue = value ? dayjs(value) : null;

    const handleChange = useCallback(
        (newDate: dayjs.Dayjs | null) => {
            onChange(newDate ? newDate.format('YYYY-MM-DD') : '');
        },
        [onChange],
    );

    return (
        <DatePicker
            label={label}
            value={dateValue}
            onChange={handleChange}
            disabled={disabled}
            format="DD.MM.YYYY"
            slotProps={{
                textField: {
                    fullWidth,
                    size: 'small',
                    required,
                    helperText,
                    inputProps: { readOnly: true },
                },
            }}
        />
    );
});

DateFieldV2.displayName = 'DateFieldV2';
