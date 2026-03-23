import { Box, Table, Paper, TableRow, useTheme, TableBody, TableCell, TableHead, Typography, TableContainer } from '@mui/material';
import type { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SpecificationRow {
    label: string;
    value: string | ReactNode;
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
                <Typography variant="body2">Ma&apos;lumot topilmadi</Typography>
            </Box>
        );
    }

    return (
        <TableContainer
            component={Paper}
            sx={{
                backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(4px)',
            }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow
                        sx={{
                            backgroundColor: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(0, 0, 0, 0.02)',
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
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.02)',
                                },
                                '&:hover': {
                                    backgroundColor: (theme) =>
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.02)',
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
                                    color: theme.palette.text.secondary,
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
