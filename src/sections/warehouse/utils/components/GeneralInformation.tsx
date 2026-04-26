import React from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Box,
    Accordion,
    Typography,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';

interface GeneralInformationProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    summaryValues?: string[];
    disabled?: boolean;
}

export const GeneralInformation = React.memo(function GeneralInformation({
    title,
    isOpen,
    onToggle,
    children,
    summaryValues = [],
    disabled = false,
}: GeneralInformationProps) {
    return (
        <Accordion
            expanded={isOpen}
            onChange={(_, expanded) => {
                if (expanded !== isOpen) onToggle();
            }}
            disabled={disabled}
            slotProps={{
                // No collapse animation = predictable, cheap expand/collapse on the main thread.
                transition: { unmountOnExit: true, timeout: 0 },
            }}
            sx={{
                '&.MuiAccordion-root': {
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'var(--color-border)',
                    borderRadius: 1,
                    bgcolor: 'var(--color-surface-2)',
                    '&:before': {
                        display: 'none',
                    },
                    '&:first-of-type': {
                        borderTopLeftRadius: (theme) => theme.shape.borderRadius,
                        borderTopRightRadius: (theme) => theme.shape.borderRadius,
                    },
                    '&:last-of-type': {
                        borderBottomLeftRadius: (theme) => theme.shape.borderRadius,
                        borderBottomRightRadius: (theme) => theme.shape.borderRadius,
                    },
                },
                '&.Mui-expanded': {
                    margin: 0,
                    borderRadius: 1,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    '& .MuiAccordionSummary-content': {
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                    },
                    p: 2,
                }}
            >
                <Typography variant="overline" sx={{ opacity: 0.7 }}>
                    {title}
                </Typography>

                {!isOpen && summaryValues.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            ml: 2,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                        }}
                    >
                        {summaryValues.map((value, index) => (
                            <Typography
                                key={index}
                                variant="caption"
                                sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 0.5,
                                    bgcolor: 'var(--glow-md)',
                                    color: 'var(--color-primary)',
                                    fontWeight: 'fontWeightSemiBold',
                                    whiteSpace: 'nowrap',
                                    border: '1px solid',
                                    borderColor: 'var(--color-border)',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {value}
                            </Typography>
                        ))}
                    </Box>
                )}
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, pt: 0 }}>
                {children}
            </AccordionDetails>
        </Accordion>
    );
});
