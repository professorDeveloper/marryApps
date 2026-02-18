import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';
import { useGetHalls, useCreateHall, useDeleteHall, useUpdateHall } from 'src/actions/halls';
import { useGetBranches } from 'src/actions/branches';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import type { IHallItem } from 'src/types/halls';
import { pxToMeters, pxToCentimeters, metersToPx, centimetersToPx, getDimensionDisplay } from 'src/utils/unit-converter';

const metadata = { title: `Halls Management | ${CONFIG.appName}` };

export default function HallsPage() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { halls, hallsLoading, hallsError } = useGetHalls();
    const { branches, branchesLoading } = useGetBranches();
    const { createHall } = useCreateHall();
    const { updateHall } = useUpdateHall();
    const { deleteHall } = useDeleteHall();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [unitType, setUnitType] = useState<'m' | 'cm'>('m'); // 'm' for meters, 'cm' for centimeters
    const [formData, setFormData] = useState({
        name: '',
        branch_id: '',
        width: 8, // Default 8 meters
        height: 6, // Default 6 meters
    });
    const [creating, setCreating] = useState(false);
    const [hallToEdit, setHallToEdit] = useState<IHallItem | null>(null);
    const [updating, setUpdating] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [hallToDelete, setHallToDelete] = useState<IHallItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleCreateDialogOpen = () => {
        setFormData({
            name: '',
            branch_id: '',
            width: 8, // 8 meters
            height: 6, // 6 meters
        });
        setUnitType('m');
        setCreateDialogOpen(true);
    };

    const handleCreateDialogClose = () => {
        setCreateDialogOpen(false);
    };

    const handleEditDialogOpen = (hall: IHallItem) => {
        setHallToEdit(hall);
        const metersWidth = pxToMeters(hall.width);
        const metersHeight = pxToMeters(hall.height);
        setFormData({
            name: hall.name,
            branch_id: hall.branch_id,
            width: metersWidth,
            height: metersHeight,
        });
        setUnitType('m');
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setHallToEdit(null);
        setFormData({
            name: '',
            branch_id: '',
            width: 8,
            height: 6,
        });
        setUnitType('m');
    };

    const handleCreateHall = async () => {
        if (!formData.name.trim()) {
            alert(t('halls.messages.nameRequired'));
            return;
        }

        if (!formData.branch_id) {
            alert(t('halls.messages.branchRequired'));
            return;
        }

        setCreating(true);
        try {
            // Convert meters/cm to pixels (using 100px = 1m)
            const widthInPx = unitType === 'cm' ? centimetersToPx(formData.width) : metersToPx(formData.width);
            const heightInPx = unitType === 'cm' ? centimetersToPx(formData.height) : metersToPx(formData.height);

            await createHall({
                name: formData.name,
                branch_id: formData.branch_id,
                width: widthInPx,
                height: heightInPx,
            });
            handleCreateDialogClose();
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateHall = async () => {
        if (!hallToEdit) return;

        if (!formData.name.trim()) {
            alert(t('halls.messages.nameRequired'));
            return;
        }

        setUpdating(true);
        try {
            // Convert meters/cm to pixels (using 100px = 1m)
            const widthInPx = unitType === 'cm' ? centimetersToPx(formData.width) : metersToPx(formData.width);
            const heightInPx = unitType === 'cm' ? centimetersToPx(formData.height) : metersToPx(formData.height);

            await updateHall(hallToEdit.id, {
                name: formData.name,
                width: widthInPx,
                height: heightInPx,
            });
            handleEditDialogClose();
        } finally {
            setUpdating(false);
        }
    };

    const handleHallClick = (hallId: string) => {
        router.push(`${paths.dashboard.floorPlan}?hallId=${hallId}`);
    };

    const handleDeleteConfirm = (hall: IHallItem) => {
        setHallToDelete(hall);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteHall = async () => {
        if (!hallToDelete) return;

        setDeleting(true);
        try {
            await deleteHall(hallToDelete.id);
            setDeleteConfirmOpen(false);
            setHallToDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <title>{metadata.title}</title>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ mb: 1 }}>
                            {t('halls.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('halls.description')}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="solar:add-circle-bold" />}
                        onClick={handleCreateDialogOpen}
                        size="large"
                    >
                        {t('halls.createNew')}
                    </Button>
                </Box>

                {hallsError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {t('halls.messages.failedLoad')}
                    </Alert>
                )}

                {hallsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : halls.length === 0 ? (
                    <Card sx={{ textAlign: 'center', py: 8 }}>
                        <Box sx={{ mb: 2 }}>
                            <Iconify
                                icon="solar:inbox-bold"
                                sx={{ width: 64, height: 64, color: 'text.secondary', mx: 'auto' }}
                            />
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            {t('halls.noHalls')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            {t('halls.createFirst')}
                        </Typography>
                        <Button variant="contained" onClick={handleCreateDialogOpen}>
                            {t('halls.createFirstBtn')}
                        </Button>
                    </Card>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(4, 1fr)',
                            },
                            gap: 3,
                        }}
                    >
                        {halls.map((hall) => (
                            <Card
                                key={hall.id}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    '.delete-btn': {
                                        opacity: 1,
                                    },
                                }}
                            >
                                <CardActionArea
                                    onClick={() => handleHallClick(hall.id)}
                                    sx={{ flex: 1 }}
                                >
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            height: 200,
                                            backgroundColor: 'action.hover',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                width: Math.min(120, (hall.width / hall.height) * 120),
                                                height: Math.min(120, (hall.height / hall.width) * 120),
                                                border: '2px dashed',
                                                borderColor: '#FB6633',
                                                borderRadius: 1,
                                                opacity: 0.5,
                                            }}
                                        />
                                        <Iconify
                                            icon="solar:copy-bold"
                                            sx={{ width: 40, height: 40, color: '#FB6633' }}
                                        />
                                    </Box>
                                </CardActionArea>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        {hall.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        {getDimensionDisplay(hall.width, 'm')} × {getDimensionDisplay(hall.height, 'm')}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                        <Button
                                            size="small"
                                            // variant="contained"
                                            sx={{ backgroundColor: '#FB6633', color: 'white', ":hover": { backgroundColor: '#FB6633', opacity: 0.8 } }}
                                            startIcon={<Iconify icon="solar:copy-bold" />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleHallClick(hall.id);
                                            }}
                                            fullWidth
                                        >
                                            {t('halls.buttons.open')}
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditDialogOpen(hall);
                                            }}
                                            className="edit-btn"
                                            sx={{ transition: 'opacity 0.2s', color: 'white' }}
                                        >
                                            <Iconify icon="solar:pen-bold" width={18} />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color='error'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConfirm(hall);
                                            }}
                                            className="delete-btn"
                                            sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                                        >
                                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                                        </IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Container>

            {/* Create Hall Dialog */}
            <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('halls.dialogCreate')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <ToggleButtonGroup
                                value={unitType}
                                exclusive
                                onChange={(e, newUnit) => {
                                    if (newUnit) {
                                        setUnitType(newUnit);
                                    }
                                }}
                                size="small"
                            >
                                <ToggleButton value="m">
                                    Meters (m)
                                </ToggleButton>
                                <ToggleButton value="cm">
                                    Centimeters (cm)
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>{t('halls.form.branch')}</InputLabel>
                            <Select
                                label={t('halls.form.branch')}
                                value={formData.branch_id}
                                onChange={(e) => setFormData((prev) => ({ ...prev, branch_id: e.target.value }))}
                            >
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('halls.form.name')}
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            fullWidth
                            placeholder={t('halls.form.namePlaceholder')}
                            autoFocus
                        />
                        <TextField
                            label={`${t('halls.form.width')} (${unitType === 'm' ? 'meters' : 'centimeters'})`}
                            type="number"
                            value={formData.width}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, width: parseFloat(e.target.value) }))
                            }
                            fullWidth
                            inputProps={{ min: 0.5, step: 0.5 }}
                        />
                        <TextField
                            label={`${t('halls.form.height')} (${unitType === 'm' ? 'meters' : 'centimeters'})`}
                            type="number"
                            value={formData.height}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, height: parseFloat(e.target.value) }))
                            }
                            fullWidth
                            inputProps={{ min: 0.5, step: 0.5 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateDialogClose}>{t('halls.buttons.cancel')}</Button>
                    <Button
                        onClick={handleCreateHall}
                        // variant="contained"
                        sx={{ backgroundColor: '#FB6633', '&:hover': { backgroundColor: '#FB6633', opacity: 0.8 } }}
                        disabled={creating || !formData.name.trim() || !formData.branch_id}
                    >
                        {creating ? t('halls.buttons.creating') : t('halls.buttons.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Hall Dialog */}
            <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('halls.dialogEdit')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <ToggleButtonGroup
                                value={unitType}
                                exclusive
                                onChange={(e, newUnit) => {
                                    if (newUnit) {
                                        setUnitType(newUnit);
                                    }
                                }}
                                size="small"
                            >
                                <ToggleButton value="m">
                                    Meters (m)
                                </ToggleButton>
                                <ToggleButton value="cm">
                                    Centimeters (cm)
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <FormControl fullWidth disabled>
                            <InputLabel>{t('halls.form.branch')}</InputLabel>
                            <Select
                                label={t('halls.form.branch')}
                                value={formData.branch_id}
                            >
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label={t('halls.form.name')}
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            fullWidth
                            placeholder={t('halls.form.namePlaceholder')}
                        />
                        <TextField
                            label={`${t('halls.form.width')} (${unitType === 'm' ? 'meters' : 'centimeters'})`}
                            type="number"
                            value={formData.width}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, width: parseFloat(e.target.value) }))
                            }
                            fullWidth
                            inputProps={{ min: 0.5, step: 0.5 }}
                        />
                        <TextField
                            label={`${t('halls.form.height')} (${unitType === 'm' ? 'meters' : 'centimeters'})`}
                            type="number"
                            value={formData.height}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, height: parseFloat(e.target.value) }))
                            }
                            fullWidth
                            inputProps={{ min: 0.5, step: 0.5 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditDialogClose}>{t('halls.buttons.cancel')}</Button>
                    <Button
                        onClick={handleUpdateHall}
                        // variant="contained"
                        sx={{ backgroundColor: '#FB6633', '&:hover': { backgroundColor: '#FB6633', opacity: 0.8 } }}
                        disabled={updating || !formData.name.trim()}
                    >
                        {updating ? t('halls.buttons.updating') : t('halls.buttons.update')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>{t('halls.dialogDelete')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('halls.messages.deleteConfirm')} <strong>{hallToDelete?.name}</strong>? {t('halls.messages.deleteCannotUndo')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>{t('halls.buttons.cancel')}</Button>
                    <Button
                        onClick={handleDeleteHall}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? t('halls.buttons.deleting') : t('halls.buttons.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
