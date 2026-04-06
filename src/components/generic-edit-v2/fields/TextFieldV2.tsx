import { memo, useRef, useState, useEffect, useCallback } from 'react';

import MuiTextField from '@mui/material/TextField';

interface Props {
    value: string | number;
    onChange: (value: string | number) => void;
    label: string;
    type?: 'text' | 'email' | 'url' | 'number' | 'textarea';
    required?: boolean;
    placeholder?: string;
    helperText?: string;
    fullWidth?: boolean;
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    step?: string;
    min?: string;
}

export const TextFieldV2 = memo<Props>(({
    value,
    onChange,
    label,
    type = 'text',
    required,
    placeholder,
    helperText,
    fullWidth = true,
    multiline,
    rows,
    disabled,
    step,
    min,
}) => {
    const [draftValue, setDraftValue] = useState<string | number>(value ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setDraftValue(value ?? '');
    }, [value]);

    const emitChange = useCallback((rawValue: string) => {
        if (type === 'number') {
            onChange(rawValue === '' ? '' : Number(rawValue));
            return;
        }
        onChange(rawValue);
    }, [type, onChange]);

    const flushDebounce = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setDraftValue(raw);
            flushDebounce();
            debounceRef.current = setTimeout(() => {
                emitChange(raw);
                debounceRef.current = null;
            }, 120);
        },
        [emitChange, flushDebounce],
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            flushDebounce();
            emitChange(e.target.value);
        },
        [emitChange, flushDebounce],
    );

    return (
        <MuiTextField
            fullWidth={fullWidth}
            type={type === 'textarea' ? 'text' : type}
            label={label}
            value={draftValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            multiline={multiline || type === 'textarea'}
            rows={rows || (type === 'textarea' ? 4 : undefined)}
            required={required}
            helperText={helperText}
            disabled={disabled}
            inputProps={
                type === 'number'
                    ? { step: step ?? '0.01', min: min ?? '0' }
                    : undefined
            }
        />
    );
});

TextFieldV2.displayName = 'TextFieldV2';
