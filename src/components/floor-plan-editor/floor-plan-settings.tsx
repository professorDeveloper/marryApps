import { useState } from 'react';

import { useTheme } from '@mui/material/styles';
import {
    Stack,
    Button,
    Dialog,
    TextField,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';


interface FloorPlanSettingsProps {
    hallWidth?: number;
    hallHeight?: number;
    onHallDimensionsChange?: (width: number, height: number) => void;
}

export const FloorPlanSettings = ({
    hallWidth = 1000,
    hallHeight = 400,
    onHallDimensionsChange,
}: FloorPlanSettingsProps) => {
    const theme = useTheme();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [width, setWidth] = useState(hallWidth);
    const [height, setHeight] = useState(hallHeight);

    const handleOpen = () => {
        setWidth(hallWidth);
        setHeight(hallHeight);
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
    };

    const handleSave = () => {
        if (width > 0 && height > 0 && onHallDimensionsChange) {
            onHallDimensionsChange(width, height);
            handleClose();
        }
    };

    return (
        <>
            {/* <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    transition: theme.transitions.create(['background-color', 'border-color'], {
                        duration: theme.transitions.duration.shorter,
                    }),
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify icon="solar:settings-bold" width={18} />
                        Hall Dimensions
                    </Typography>
                    <Button size="small" variant="outlined" onClick={handleOpen} startIcon={<Iconify icon="solar:pen-bold" width={16} />}>
                        Edit
                    </Button>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Width
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                            {hallWidth} units
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Height
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                            {hallHeight} units
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 1 }}>
                        Total Area: {hallWidth * hallHeight} sq. units
                    </Typography>
                </Stack>
            </Paper> */}

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Hall Dimensions</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Width (units)"
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 100, step: 50 }}
                        />
                        <TextField
                            label="Height (units)"
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 100, step: 50 }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                            Note: Tables' relative positions will be maintained when dimensions change.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
