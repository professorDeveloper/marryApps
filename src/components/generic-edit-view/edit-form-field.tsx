// ============================================================================
// EDIT FORM FIELD - COMPONENT
// ============================================================================

import type { FC } from 'react';
import type { FieldConfig } from './types';

import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ImageUploadField } from './image-upload-field';

interface EditFormFieldProps {
    field: FieldConfig;
    value: any;
    onChange: (value: any) => void;
}

export const EditFormField: FC<EditFormFieldProps> = ({ field, value, onChange }) => {
    const handleChange = (e: any) => {
        const val = e.target.value;
        if (field.type === 'number') {
            // Convert to number, handle empty input
            const numValue = val === '' ? '' : Number(val);
            onChange(numValue === '' ? numValue : numValue);
        } else {
            onChange(val);
        }
    };

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
        return (
            <FormControl fullWidth={field.fullWidth !== false} size="small" required={field.required}>
                <InputLabel>{field.label}</InputLabel>
                <Select
                    value={value ?? ''}
                    label={field.label}
                    onChange={handleChange}
                    required={field.required}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {field.options?.map((opt) => (
                        <MenuItem key={`${opt.value}`} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
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
                <Box sx={{ mb: 1 }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {field.label}
                    </label>
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gap: 1,
                    }}
                >
                    {colors.map((color) => (
                        <Box
                            key={color}
                            onClick={() => {
                                onChange(color);
                            }}
                            sx={{
                                width: '70%',
                                aspectRatio: '1/1',
                                bgcolor: color,
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: selectedColor === color ? '3px solid #333' : '1px solid #ddd',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                },
                            }}
                            title={color}
                        />
                    ))}
                </Box>
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
