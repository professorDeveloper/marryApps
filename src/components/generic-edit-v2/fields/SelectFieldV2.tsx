import type { FieldOption } from '../types';

import { memo, useRef, useState, useEffect, useCallback } from 'react';

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

interface Props {
    value: string | number;
    onChange: (value: string | number) => void;
    label: string;
    options?: FieldOption[];
    required?: boolean;
    placeholder?: string;
    fullWidth?: boolean;
    disabled?: boolean;
}

export const SelectFieldV2 = memo<Props>(({
    value,
    onChange,
    label,
    options = [],
    required,
    placeholder,
    fullWidth = true,
    disabled,
}) => {
    const [draftValue, setDraftValue] = useState<string | number>(value ?? '');
    const lastCommittedRef = useRef<string | number>(value ?? '');

    useEffect(() => {
        setDraftValue(value ?? '');
        lastCommittedRef.current = value ?? '';
    }, [value]);

    const handleChange = useCallback(
        (e: any) => {
            const nextValue = e.target.value as string | number;
            setDraftValue(nextValue);
        },
        [],
    );

    const commitIfChanged = useCallback(() => {
        if (lastCommittedRef.current !== draftValue) {
            onChange(draftValue);
            lastCommittedRef.current = draftValue;
        }
    }, [draftValue, onChange]);

    return (
        <FormControl
            fullWidth={fullWidth}
            size="small"
            required={required}
            disabled={disabled || options.length === 0}
        >
            <InputLabel>{label}</InputLabel>
            <Select
                value={draftValue ?? ''}
                label={label}
                onChange={handleChange}
                onClose={commitIfChanged}
                onBlur={commitIfChanged}
            >
                {placeholder && (
                    <MenuItem value="" disabled>
                        <em>{placeholder}</em>
                    </MenuItem>
                )}
                {options.map((opt) => (
                    <MenuItem key={String(opt.value)} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
});

SelectFieldV2.displayName = 'SelectFieldV2';
