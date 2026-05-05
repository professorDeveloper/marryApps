
import type { ModifierItem } from '../types';

import React from 'react';

import { Box, Chip, Checkbox, Typography } from '@mui/material';

import { compositeKey } from '../types';

interface AvailableRowProps {
    item: ModifierItem;
    isSelected: boolean;
    onSelect: (key: string, checked: boolean) => void;
    onAdd: (item: ModifierItem) => void;
}

const ROW_SX = {
    display: 'grid',
    gridTemplateColumns: '48px 1fr',
    alignItems: 'center',
    py: 0.75,
    m: 0,
    borderBottom: 1,
    borderColor: 'var(--color-border)',
    cursor: 'pointer',
    '&:hover': { bgcolor: 'var(--color-primary-soft)' },
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
} as const;

const CB_CELL_SX = { display: 'flex', justifyContent: 'center' } as const;
const CONTENT_CELL_SX = {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
} as const;
const TEXT_COL_SX = {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 0.5,
    flexDirection: 'column',
} as const;
const NAME_SX = { lineHeight: 1.2 } as const;
const CODE_SX = { lineHeight: 1 } as const;
const CHIP_SX = {
    fontSize: '0.65rem',
    height: 16,
    minWidth: 32,
    fontFamily: '"Inter", sans-serif',
    '& .MuiChip-label': { px: 0.5 },
} as const;
const ACTIVE_CHIP_SX = {
    ...CHIP_SX,
    bgcolor: 'success.main',
    color: 'success.contrastText',
} as const;
const INACTIVE_CHIP_SX = {
    ...CHIP_SX,
    bgcolor: 'text.disabled',
    color: 'background.paper',
} as const;

export const AvailableRow = React.memo(function AvailableRow({
    item,
    isSelected,
    onSelect,
    onAdd,
}: AvailableRowProps) {
    const key = compositeKey(item.id);

    const handleClick = React.useCallback(() => onAdd(item), [onAdd, item]);
    const handleCheckboxChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            onSelect(key, e.target.checked);
        },
        [onSelect, key]
    );
    const stopClick = React.useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

    return (
        <Box onClick={handleClick} sx={ROW_SX}>
            <Box sx={CB_CELL_SX}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={stopClick}
                    inputProps={{ 'aria-label': 'select available modifier' }}
                />
            </Box>
            <Box sx={CONTENT_CELL_SX}>
                <Box sx={TEXT_COL_SX}>
                    <Typography variant="body2" noWrap sx={NAME_SX} fontFamily='"Inter", sans-serif'>
                        {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={CODE_SX} fontFamily='"Inter", sans-serif'>
                        {item.code}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={item.is_active ? 'Active' : 'Inactive'}
                    sx={item.is_active ? ACTIVE_CHIP_SX : INACTIVE_CHIP_SX}
                />
            </Box>
        </Box>
    );
});
