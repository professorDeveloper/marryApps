import {
    alpha,
    Box,
    Typography,
} from '@mui/material';

type TotalCardProps = {
    totalLabel: string;
    totalValue: string;
    color: string;

};

export const TotalCard = ({
    totalLabel,
    totalValue,
    color,
}: TotalCardProps) => {
    return (
        <Box
            sx={{
                bgcolor: alpha(color, 0.2),
                p: 1.5,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flex: 1,
                minWidth: 'fit-content',
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    color: color,
                }}
            >
                {totalLabel || 'Total Amount'}:
            </Typography>

            <Typography
                variant="h5"    
                sx={{
                    fontWeight: 800,
                    color: color,
                }}
            >
                {totalValue}
            </Typography>
        </Box>
    );
};