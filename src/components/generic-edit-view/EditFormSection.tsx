import type { FC } from 'react';
import { memo, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { CardSection } from './types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EditFormField } from 'src/components/generic-edit-view';

interface EditFormSectionProps {
    section: CardSection;
}

const EditFormSection: FC<EditFormSectionProps> = memo(({ section }) => {
    const { control } = useFormContext();

    // Memoize the grid columns calculation
    const gridColumns = useMemo(() => ({
        xs: '1fr',
        md: section.columns === 2 ? '1fr 1fr' : '1fr',
    }), [section.columns]);

    // Memoize the rendered fields to prevent recreation on every render
    const renderedFields = useMemo(() => section.fields.map((field) => (
        <Controller
            key={field.key}
            name={field.key}
            control={control}
            defaultValue={field.defaultValue ?? null}
            render={({ field: { onChange, value } }) => (
                <EditFormField
                    field={field}
                    value={value ?? field.defaultValue ?? ''}
                    onChange={onChange}
                />
            )}
        />
    )), [section.fields, control]);

    return (
        <Card sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
                <Typography variant="h6">{section.title}</Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: gridColumns,
                        gap: 2,
                    }}
                >
                    {renderedFields}
                </Box>
            </Stack>
        </Card>
    );
});

EditFormSection.displayName = 'EditFormSection';

export default EditFormSection;