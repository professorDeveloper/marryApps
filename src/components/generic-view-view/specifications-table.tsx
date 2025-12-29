import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, Typography } from '@mui/material';

// ============================================================================
// TYPES
// ============================================================================

export interface SpecificationRow {
    label: string;
    value: string;
}

export interface SpecificationsTableProps {
    rows: SpecificationRow[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Specifications Table Component
 * Har xil ma'lumotlarni table formatida ko'rsatadi
 */
export function SpecificationsTable({ rows }: SpecificationsTableProps) {
    const theme = useTheme();

    if (!rows || rows.length === 0) {
        return (
            <Box
                sx={{
                    p: 2,
                    textAlign: 'center',
                    color: theme.palette.text.secondary,
                }}
            >
                <Typography variant="body2">Ma'lumot topilmadi</Typography>
            </Box>
        );
    }

    return (
        <TableContainer
            component={Paper}
            sx={{
                backgroundColor:
                    theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(255, 255, 255, 0.3)',
                border: `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(4px)',
            }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow
                        sx={{
                            backgroundColor:
                                theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.4)',
                            borderBottom: `2px solid ${theme.palette.divider}`,
                        }}
                    >
                        <TableCell
                            sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                            }}
                        >
                            Parametr
                        </TableCell>
                        <TableCell
                            sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                            }}
                        >
                            Qiymat
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow
                            key={index}
                            sx={{
                                '&:nth-of-type(odd)': {
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.02)'
                                            : 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover': {
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(255, 255, 255, 0.5)',
                                },
                                transition: 'background-color 0.2s',
                            }}
                        >
                            <TableCell
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                    width: '40%',
                                }}
                            >
                                {row.label}
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: theme.palette.text.primary,
                                }}
                            >
                                {row.value}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
