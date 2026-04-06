import type { FieldConfig } from './types';

import { memo, useCallback } from 'react';

import { TextFieldV2 } from './fields/TextFieldV2';
import { DateFieldV2 } from './fields/DateFieldV2';
import { ColorFieldV2 } from './fields/ColorFieldV2';
import { ImageFieldV2 } from './fields/ImageFieldV2';
import { SelectFieldV2 } from './fields/SelectFieldV2';
import { SwitchFieldV2 } from './fields/SwitchFieldV2';

interface Props<T extends Record<string, any> = Record<string, any>> {
    field: FieldConfig<T>;
    value: any;
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}

function FieldRendererInner<T extends Record<string, any> = Record<string, any>>({
    field,
    value,
    onChange,
    disabled,
}: Props<T>) {
    const isDisabled = disabled || false;

    // Stable per-field onChange — only recreates when key or outer onChange changes
    const handleChange = useCallback(
        (val: any) => onChange(field.key, val),
        [field.key, onChange],
    );

    switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'number':
        case 'textarea':
            return (
                <TextFieldV2
                    value={value ?? field.defaultValue ?? ''}
                    onChange={handleChange}
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    helperText={field.helperText}
                    fullWidth={field.fullWidth}
                    multiline={field.multiline}
                    rows={field.rows}
                    disabled={isDisabled}
                    step={field.step}
                    min={field.min}
                />
            );

        case 'select':
            return (
                <SelectFieldV2
                    value={value ?? field.defaultValue ?? ''}
                    onChange={handleChange}
                    label={field.label}
                    options={field.options}
                    required={field.required}
                    placeholder={field.placeholder}
                    fullWidth={field.fullWidth}
                    disabled={isDisabled}
                />
            );

        case 'switch':
        case 'checkbox':
            return (
                <SwitchFieldV2
                    value={value ?? field.defaultValue ?? false}
                    onChange={handleChange}
                    label={field.label}
                    disabled={isDisabled}
                />
            );

        case 'color':
            return (
                <ColorFieldV2
                    value={value ?? field.defaultValue ?? null}
                    onChange={handleChange}
                    label={field.label}
                    colors={field.colors}
                    disabled={isDisabled}
                />
            );

        case 'image':
            return (
                <ImageFieldV2
                    value={value ?? field.defaultValue ?? null}
                    onChange={handleChange}
                    label={field.label}
                    disabled={isDisabled}
                />
            );

        case 'date':
            return (
                <DateFieldV2
                    value={value ?? field.defaultValue ?? null}
                    onChange={handleChange}
                    label={field.label}
                    required={field.required}
                    helperText={field.helperText}
                    fullWidth={field.fullWidth}
                    disabled={isDisabled}
                />
            );

        default:
            return null;
    }
}

export const FieldRenderer = memo(FieldRendererInner) as typeof FieldRendererInner;
