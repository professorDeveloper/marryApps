import type { SectionConfig } from './types';

import { memo, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FieldRenderer } from './FieldRenderer';

interface Props<T extends Record<string, any> = Record<string, any>> {
    section: SectionConfig<T>;
    data: T;
    onChange: (key: string, value: any) => void;
    disabled?: boolean;
}

function SectionRendererInner<T extends Record<string, any> = Record<string, any>>({
    section,
    data,
    onChange,
    disabled,
}: Props<T>) {
    const gridColumns = useMemo(() => ({
        xs: '1fr',
        md: section.columns === 2 ? '1fr 1fr' : '1fr',
    }), [section.columns]);

    return (
        <Card sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
                <Typography variant="h6">{section.title}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 2 }}>
                    {section.fields.map((field) => {
                        // Skip hidden fields
                        if (field.visible && !field.visible(data)) return null;
                        const isFieldDisabled =
                            disabled || (field.disabled ? field.disabled(data) : false);

                        return (
                            <FieldRenderer
                                key={field.key}
                                field={field}
                                value={data[field.key]}
                                onChange={onChange}
                                disabled={isFieldDisabled}
                            />
                        );
                    })}
                </Box>
            </Stack>
        </Card>
    );
}

function areSectionPropsEqual<T extends Record<string, any>>(
    prev: Props<T>,
    next: Props<T>
) {
    if (prev.section !== next.section) return false;
    if (prev.onChange !== next.onChange) return false;
    if (prev.disabled !== next.disabled) return false;

    // Skip re-render when none of this section's field-relevant values changed.
    for (const field of prev.section.fields) {
        const key = field.key;
        if (prev.data[key] !== next.data[key]) return false;

        if (field.visible) {
            const prevVisible = field.visible(prev.data);
            const nextVisible = field.visible(next.data);
            if (prevVisible !== nextVisible) return false;
        }

        if (field.disabled) {
            const prevDisabled = field.disabled(prev.data);
            const nextDisabled = field.disabled(next.data);
            if (prevDisabled !== nextDisabled) return false;
        }
    }

    return true;
}

export const SectionRenderer = memo(
    SectionRendererInner,
    areSectionPropsEqual
) as typeof SectionRendererInner;
