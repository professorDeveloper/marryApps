// ============================================================================
// EDIT FORM FIELD - COMPONENT
// ============================================================================

import type { FC } from 'react';
import type { FieldConfig } from './types';

import dayjs from 'dayjs';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import { NoDataTooltip } from 'src/components/no-data-tooltip';

import { ImageUploadField } from './image-upload-field';

interface EditFormFieldProps {
    field: FieldConfig;
    value: any;
    onChange: (value: any) => void;
}

const EditFormFieldComponent: FC<EditFormFieldProps> = ({ field, value, onChange }) => {
    const { t } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

    const handleChange = useCallback((e: any) => {
        const val = e.target.value;
        if (field.type === 'number') {
            // Convert to number, handle empty input
            const numValue = val === '' ? '' : Number(val);
            onChange(numValue === '' ? numValue : numValue);
        } else {
            onChange(val);
        }
    }, [field.type, onChange]);

    // Text fields (text, email, url, number, textarea)
    if (['text', 'email', 'url', 'number', 'textarea'].includes(field.type)) {
        return (
            <TextField
                fullWidth={field.fullWidth !== false}
                type={field.type === 'textarea' ? 'text' : field.type}
                label={field.label}
                value={value === undefined || value === null ? '' : value}
                onChange={handleChange}
                placeholder={field.placeholder}
                multiline={field.multiline || field.type === 'textarea'}
                rows={field.rows || (field.type === 'textarea' ? 4 : 1)}
                required={field.required}
                helperText={field.helperText}
                inputProps={field.type === 'number' ? { step: '0.01', min: '0' } : undefined}
            />
        );
    }

    // Select field
    if (field.type === 'select') {
        const isOptionsEmpty = (field.options?.length ?? 0) === 0;
        return (
            <NoDataTooltip enabled={isOptionsEmpty} title={noDataText}>
                <FormControl
                    fullWidth={field.fullWidth !== false}
                    size="small"
                    required={field.required}
                    disabled={isOptionsEmpty}
                >
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                        value={value ?? ''}
                        label={field.label}
                        onChange={handleChange}
                        required={field.required}
                    >
                        <MenuItem value="" disabled hidden>
                            <em>{field.placeholder || 'Select'}</em>
                        </MenuItem>
                        {field.options?.map((opt) => (
                            <MenuItem key={`${opt.value}`} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </NoDataTooltip>
        );
    }

    // Switch field
    if (field.type === 'switch') {
        return (
            <FormControlLabel
                control={
                    <Switch
                        checked={value ?? false}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                }
                label={field.label}
            />
        );
    }

    // Color picker field
    if (field.type === 'color') {
        const colors = field.colors || [];
        const selectedColor = value ? String(value) : null;

        return (
            <Box>
                <Box sx={{ mb: 1.5 }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {field.label}
                    </label>
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gap: 1.2,
                    }}
                >
                    {colors.map((color) => (
                        <Box
                            key={color}
                            component="button"
                            type="button"
                            aria-label={`${field.label}: ${color}`}
                            aria-pressed={selectedColor === color}
                            onClick={() => {
                                onChange(color);
                            }}
                            sx={{
                                width: '100%',
                                aspectRatio: '1/1',
                                bgcolor: color,
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: 'none',
                                p: 0,
                                m: 0,
                                position: 'relative',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                boxShadow:
                                    selectedColor === color
                                        ? '0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-text-primary)'
                                        : '0 0 0 1px var(--color-border-subtle)',
                                '&:hover': {
                                    transform: 'translateY(-1px)',
                                },
                                '&:focus-visible': {
                                    outline: '2px solid var(--color-text-primary)',
                                    outlineOffset: 2,
                                },
                            }}
                            title={color}
                        >
                            {selectedColor === color && (
                                <CheckRoundedIcon
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: 18,
                                        color: 'var(--color-text-on-primary)',
                                        filter: 'var(--filter-shadow-light)',
                                    }}
                                />
                            )}
                        </Box>
                    ))}
                </Box>
                <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
                    {selectedColor || '-'}
                </Typography>
            </Box>
        );
    }

    // Checkbox field
    if (field.type === 'checkbox') {
        return (
            <FormControlLabel
                control={
                    <input
                        type="checkbox"
                        checked={value ?? false}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                }
                label={field.label}
            />
        );
    }

    // Image field
    if (field.type === 'image') {
        return (
            <ImageUploadField
                label={field.label}
                value={value}
                onChange={onChange}
                height={field.height || 200}
            />
        );
    }

    // Date field
    if (field.type === 'date') {
        const dateValue = value ? dayjs(value) : null;
        return (
            <DatePicker
                label={field.label}
                value={dateValue}
                onChange={(newDate) => {
                    onChange(newDate ? newDate.format('YYYY-MM-DD') : '');
                }}
                format="DD.MM.YYYY"
                slotProps={{
                    textField: {
                        fullWidth: field.fullWidth !== false,
                        size: 'small',
                        required: field.required,
                        helperText: field.helperText,
                        inputProps: { readOnly: true },
                        sx: { cursor: 'pointer' },
                    },
                }}
            />
        );
    }

    return null;
};

export const EditFormField = memo(EditFormFieldComponent);
