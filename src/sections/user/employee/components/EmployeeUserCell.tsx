import type { EmployeeCellRendererProps } from '../types';

import Box from '@mui/material/Box';

/**
 * Employee name renderer component
 */
export function EmployeeUserCell({ employee }: EmployeeCellRendererProps) {
    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: 1.5, 
            px: 1,
            color: 'text.primary',
            fontSize: '0.875rem',
            fontWeight: 400
        }}>
            {employee.full_name || '-'}
        </Box>
    );
}
