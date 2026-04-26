import React, { useState, useEffect } from 'react';

import { TextField } from '@mui/material';

type Props = {
    value: string;
    onLiveChange: (next: string) => void;
    label: string;
    disabled?: boolean;
};

/**
 * Isolated from InventoryMetaFields so each keystroke only re-renders this node
 * (not DatePicker, selects, or GeneralInformation).
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
        <TextField
            label={label}
            value={draft}
            disabled={disabled}
            onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                onLiveChange(v);
            }}
            multiline
            fullWidth
            size="small"
            sx={{
                height: '100%',
                '& .MuiInputBase-root': {
                    height: '100%',
                },
                '& textarea': {
                    height: '100% !important',
                    overflowY: 'auto',
                },
            }}
        />
    );
});
