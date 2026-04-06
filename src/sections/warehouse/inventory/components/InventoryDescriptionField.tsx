import React, { useState, useEffect } from 'react';

import { Box, Typography } from '@mui/material';

type Props = {
    value: string;
    onLiveChange: (next: string) => void;
    label: string;
    disabled?: boolean;
};

/**
 * Isolated from InventoryMetaFields so each keystroke only re-renders this node
 * (not DatePicker, selects, or GeneralInformation). Uses a native input to avoid
 * MuiOutlinedInput / FormControl work per key.
 */
export const InventoryDescriptionField = React.memo(function InventoryDescriptionField({
    value,
    onLiveChange,
    label,
    disabled = false,
}: Props) {
    const [draft, setDraft] = useState(value);
    useEffect(() => {
        setDraft(value);
    }, [value]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                gridColumn: { xs: '1 / -1', md: '1 / -1' },
            }}
        >
            <Typography
                component="label"
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
                {label}
            </Typography>
            <Box
                component="input"
                type="text"
                value={draft}
                disabled={disabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const v = e.target.value;
                    setDraft(v);
                    onLiveChange(v);
                }}
                sx={(theme) => ({
                    width: '100%',
                    boxSizing: 'border-box',
                    fontSize: '0.875rem',
                    lineHeight: 1.43,
                    py: 1,
                    px: 1.75,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontFamily: 'inherit',
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    outline: 'none',
                    transition: theme.transitions.create(['border-color', 'box-shadow'], {
                        duration: theme.transitions.duration.shorter,
                    }),
                    '&:hover:not(:disabled)': {
                        borderColor: 'text.secondary',
                    },
                    '&:focus': {
                        borderColor: 'primary.main',
                        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                    '&:disabled': {
                        opacity: 0.6,
                        cursor: 'not-allowed',
                    },
                })}
            />
        </Box>
    );
});
