import type { FC } from 'react';
import type { CardSection, FieldConfig } from './types';

import { memo, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { EditFormFieldWithController } from 'src/components/generic-edit-view';

interface EditFormSectionProps {
    section: CardSection;
}

interface FieldItemProps {
    field: FieldConfig;
}

const FieldItem = memo<FieldItemProps>(({ field }) => (
    <EditFormFieldWithController field={field} />
));
FieldItem.displayName = 'FieldItem';

const EditFormSection: FC<EditFormSectionProps> = memo(({ section }) => {
    // Memoize the grid columns calculation
    const gridColumns = useMemo(() => ({
        xs: '1fr',
        md: section.columns === 2 ? '1fr 1fr' : '1fr',
    }), [section.columns]);

    // Memoize the rendered fields to prevent recreation on every render
    const renderedFields = useMemo(() => section.fields.map((field) => (
        <FieldItem key={field.key} field={field} />
    )), [section.fields]);

    return (
        <Card sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
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