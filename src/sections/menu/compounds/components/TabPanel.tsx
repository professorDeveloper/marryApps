import type { FC } from 'react';

import { Box } from '@mui/material';

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export const TabPanel: FC<TabPanelProps> = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`compound-tabpanel-${index}`}
            aria-labelledby={`compound-tab-${index}`}
            {...other}
        >
            <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
};
