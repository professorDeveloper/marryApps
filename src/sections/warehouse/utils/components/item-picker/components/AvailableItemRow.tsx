import type { AvailableItemRowProps } from '../types';

import { memo } from 'react';

import { Box, Checkbox, Typography } from '@mui/material';

function areEqual(prev: AvailableItemRowProps, next: AvailableItemRowProps) {
    return (
        prev.item === next.item &&
        prev.isSelected === next.isSelected &&
        prev.onToggleSelect === next.onToggleSelect &&
        prev.onRowActivate === next.onRowActivate
    );
}

export const AvailableItemRow = memo(function AvailableItemRow({
    item,
    isSelected,
    onToggleSelect,
    onRowActivate,
}: AvailableItemRowProps) {
    return (
        <Box
            onClick={() => onRowActivate?.(item.id)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                cursor: onRowActivate ? 'pointer' : 'default',
                '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                contentVisibility: 'auto',
            }}
        >

            <Checkbox
                checked={isSelected || false}
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(item.id);
                }}
                sx={{ ml: -1 }}
            />
            <Box sx={{ minWidth: 0, flex: 1, flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" noWrap>
                    {item.name}
                </Typography>
                {item.measurement && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {item.measurement}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}, areEqual);
