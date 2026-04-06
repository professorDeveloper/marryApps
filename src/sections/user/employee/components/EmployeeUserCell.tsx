import type { EmployeeCellRendererProps } from '../types';

import Box from '@mui/material/Box';

/**
 * Employee name renderer component
 */
export function EmployeeUserCell({ employee }: EmployeeCellRendererProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                paddingTop: '15px',
                paddingBottom: '15px',
            }}
        >
            <Box sx={{ fontWeight: 600 }}>{employee.full_name}</Box>
        </Box>
    );
}
