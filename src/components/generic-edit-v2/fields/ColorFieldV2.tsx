import { memo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

interface Props {
    value: string | null;
    onChange: (value: string) => void;
    label: string;
    colors?: string[];
    disabled?: boolean;
}

export const ColorFieldV2 = memo<Props>(({
    value,
    onChange,
    label,
    colors = [],
    disabled,
}) => {
    const selected = value ? String(value) : null;

    const handleClick = useCallback(
        (color: string) => { if (!disabled) onChange(color); },
        [onChange, disabled],
    );

    return (
        <Box>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.2 }}>
                {colors.map((color) => (
                    <Box
                        key={color}
                        component="button"
                        type="button"
                        onClick={() => handleClick(color)}
                        sx={{
                            width: '100%',
                            aspectRatio: '1/1',
                            bgcolor: color,
                            borderRadius: 1,
                            cursor: disabled ? 'default' : 'pointer',
                            border: 'none',
                            p: 0,
                            position: 'relative',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            boxShadow:
                                selected === color
                                    ? '0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-text-primary)'
                                    : '0 0 0 1px rgba(17,24,39,0.2)',
                            '&:hover': { transform: disabled ? 'none' : 'translateY(-1px)' },
                        }}
                    >
                        {selected === color && (
                            <CheckRoundedIcon
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: 18,
                                    color: 'var(--color-text-on-primary)',
                                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.45))',
                                }}
                            />
                        )}
                    </Box>
                ))}
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                {selected || '-'}
            </Typography>
        </Box>
    );
});

ColorFieldV2.displayName = 'ColorFieldV2';
