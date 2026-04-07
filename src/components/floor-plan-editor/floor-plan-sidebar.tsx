import type { Table } from './types';
import type { ICafeTableFormData } from 'src/types/cafe-tables';

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import {
    Box,
    Chip,
    List,
    Stack,
    Paper,
    Button,
    Dialog,
    Select,
    ListItem,
    MenuItem,
    TextField,
    Typography,
    IconButton,
    InputLabel,
    DialogTitle,
    FormControl,
    ListItemText,
    ToggleButton,
    DialogContent,
    DialogActions,
    ListItemButton,
    ToggleButtonGroup,
} from '@mui/material';

import { pxToMeters, metersToPx, centimetersToPx } from 'src/utils/unit-converter';

import { useCreateHall } from 'src/actions/halls';
import { useGetBranches } from 'src/actions/branches';
import { useCreateCafeTable, useUpdateCafeTable, useDeleteCafeTable } from 'src/actions/cafe-tables';

import { Iconify } from '../iconify';
import { findNearestEmptyPosition } from './utils';
import { HALL_WIDTH, HALL_HEIGHT, DEFAULT_TABLE_SEATS } from './types';

interface FloorPlanSidebarProps {
    tables: Table[];
    selectedTableId: string | null;
    onTableCreate: () => void;
    onTableSelect: (id: string) => void;
    onTableDelete: (id: string) => void;
    onTableUpdate: (id: string, updates: Partial<Table>) => void;
    showGrid: boolean;
    onGridToggle: () => void;
    snapToGrid: boolean;
    onSnapToggle: () => void;
    hallId?: string;
    hallWidth?: number;
    hallHeight?: number;
    changedTablesCount?: number;
    onGetChangedTables?: () => Array<{ id: string; pos_x: number; pos_y: number; width: number; height: number; rotation: number }>;
    onResetChanges?: () => void;
}

export const FloorPlanSidebar = ({
    tables,
    selectedTableId,
    onTableCreate,
    onTableSelect,
    onTableDelete,
    onTableUpdate,
    showGrid,
    onGridToggle,
    snapToGrid,
    onSnapToggle,
    hallId,
    hallWidth,
    hallHeight,
    changedTablesCount = 0,
    onGetChangedTables,
    onResetChanges,
}: FloorPlanSidebarProps) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation('menu');
    const { createHall } = useCreateHall();
    const { branches } = useGetBranches();
    const { createTable } = useCreateCafeTable();
    const { updateTable } = useUpdateCafeTable();
    const { deleteTable } = useDeleteCafeTable();

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTableId, setEditTableId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Table>>({});
    const [createTableDialogOpen, setCreateTableDialogOpen] = useState(false);
    const [unitType, setUnitType] = useState<'m' | 'cm'>('m');
    const [createTableFormData, setCreateTableFormData] = useState<{ number: number; capacity: number; pos_x: number; pos_y: number; width: number; height: number; rotation: number; table_type: 'simple' | 'time_based' }>({ number: 0, capacity: 4, pos_x: 0, pos_y: 0, width: 0.8, height: 0.6, rotation: 0, table_type: 'simple' });
    const [creatingTable, setCreatingTable] = useState(false);
    const [updatingTable, setUpdatingTable] = useState(false);
    const [deletingTable, setDeletingTable] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [tableIdToDelete, setTableIdToDelete] = useState<string | null>(null);
    const [hallDialogOpen, setHallDialogOpen] = useState(false);
    const [hallFormData, setHallFormData] = useState({ name: '', branch_id: '', width: 800, height: 600 });
    const [hallCreating, setHallCreating] = useState(false);
    const [savingChanges, setSavingChanges] = useState(false);

    const selectedTable = tables.find((t) => t.id === selectedTableId);

    // Handle saving all changed tables
    const handleSaveTableChanges = async () => {
        if (!onGetChangedTables || !onResetChanges || !hallId) {
            return;
        }

        setSavingChanges(true);
        try {
            const changedTables = onGetChangedTables();

            if (changedTables.length === 0) {
                return;
            }

            // Update each changed table
            const updatePromises = changedTables.map((tableData) =>
                updateTable(tableData.id, hallId, {
                    pos_x: tableData.pos_x,
                    pos_y: tableData.pos_y,
                    width: tableData.width,
                    height: tableData.height,
                    rotation: tableData.rotation,
                })
            );

            await Promise.all(updatePromises);
            onResetChanges();
        } finally {
            setSavingChanges(false);
        }
    };

    const handleEditOpen = (table: Table) => {
        setEditTableId(table.id);
        // Convert pixels to meters for display
        const widthInMeters = pxToMeters(table.width);
        const heightInMeters = pxToMeters(table.height);
        setEditFormData({
            number: table.number,
            seats: table.seats,
            width: widthInMeters,
            height: heightInMeters,
            rotation: table.rotation,
            table_type: table.table_type || 'simple',
        });
        setUnitType('m');
        setEditDialogOpen(true);
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setEditTableId(null);
        setEditFormData({});
    };

    const handleEditSave = async () => {
        if (!editTableId || !hallId) {
            return;
        }

        setUpdatingTable(true);
        try {
            // Convert meters/cm to pixels
            const widthInPx = unitType === 'cm' ? centimetersToPx(editFormData.width || 0) : metersToPx(editFormData.width || 0);
            const heightInPx = unitType === 'cm' ? centimetersToPx(editFormData.height || 0) : metersToPx(editFormData.height || 0);

            // Map table fields to café table API format
            const payload: Partial<ICafeTableFormData> = {
                number: editFormData.number,
                capacity: editFormData.seats,
                pos_x: editFormData.x,
                pos_y: editFormData.y,
                width: widthInPx,  // Send in pixels
                height: heightInPx,  // Send in pixels
                rotation: editFormData.rotation,
                table_type: editFormData.table_type,
            };

            await updateTable(editTableId, hallId, payload);
            // Don't call onTableUpdate() - SWR will auto-refresh via mutate
            handleEditClose();
        } finally {
            setUpdatingTable(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Table create/edit dialogs
    const handleCreateTableDialogOpen = () => {
        const nextNumber = Math.max(0, ...tables.map(t => t.number)) + 1;
        // Default form data in meters (0.8m x 0.6m)
        setCreateTableFormData({
            number: nextNumber,
            capacity: 4,
            pos_x: 0,  // Will be auto-set by server or ignored
            pos_y: 0,  // Will be auto-set by server or ignored
            width: 0.8,   // 0.8 meters
            height: 0.6,  // 0.6 meters
            rotation: 0,
            table_type: 'simple'
        });
        setUnitType('m');
        setCreateTableDialogOpen(true);
    };

    const handleCreateTableDialogClose = () => {
        setCreateTableDialogOpen(false);
    };

    const handleCreateTableSubmit = async () => {
        if (!hallId) {
            return;
        }

        setCreatingTable(true);
        try {
            // Use provided hall dimensions or defaults
            const effectiveHallWidth = hallWidth || HALL_WIDTH;
            const effectiveHallHeight = hallHeight || HALL_HEIGHT;

            // Convert meters/cm to pixels for calculations
            const tableWidthPx = unitType === 'cm' ? centimetersToPx(createTableFormData.width) : metersToPx(createTableFormData.width);
            const tableHeightPx = unitType === 'cm' ? centimetersToPx(createTableFormData.height) : metersToPx(createTableFormData.height);

            // Find nearest empty position for new table
            const position = findNearestEmptyPosition(
                tables,
                effectiveHallWidth,
                effectiveHallHeight,
                tableWidthPx,
                tableHeightPx
            );

            await createTable(hallId, {
                number: createTableFormData.number,
                capacity: createTableFormData.capacity,
                pos_x: position.x,  // Use calculated position
                pos_y: position.y,  // Use calculated position
                width: tableWidthPx,  // Send in pixels
                height: tableHeightPx,  // Send in pixels
                rotation: createTableFormData.rotation,
                table_type: createTableFormData.table_type,
            });
            handleCreateTableDialogClose();
            // Don't call onTableCreate() - SWR will auto-refresh via mutate
        } finally {
            setCreatingTable(false);
        }
    };

    const handleDeleteTableConfirm = (tableId: string) => {
        setTableIdToDelete(tableId);
        setDeleteConfirmDialogOpen(true);
    };

    const handleDeleteTableCancel = () => {
        setDeleteConfirmDialogOpen(false);
        setTableIdToDelete(null);
    };

    const handleDeleteTableConfirmation = async () => {
        if (!tableIdToDelete) return;

        setDeletingTable(true);
        try {
            await deleteTable(tableIdToDelete, hallId);
            // Call onTableDelete to update local state immediately
            onTableDelete(tableIdToDelete);
            // Clear selection if this was the selected table
            if (selectedTableId === tableIdToDelete) {
                onTableSelect('');
            }
            setDeleteConfirmDialogOpen(false);
            setTableIdToDelete(null);
        } finally {
            setDeletingTable(false);
        }
    };

    // Hall yaratish dialogi
    const handleHallDialogOpen = () => {
        setHallFormData({ name: '', branch_id: '', width: 800, height: 600 });
        setHallDialogOpen(true);
    };

    const handleHallDialogClose = () => {
        setHallDialogOpen(false);
        setHallFormData({ name: '', branch_id: '', width: 800, height: 600 });
    };

    const handleHallCreate = async () => {
        if (!hallFormData.name.trim()) {
            return;
        }

        if (!hallFormData.branch_id) {
            return;
        }

        setHallCreating(true);
        try {
            await createHall({
                name: hallFormData.name,
                branch_id: hallFormData.branch_id,
                width: hallFormData.width,
                height: hallFormData.height,
            });
            handleHallDialogClose();
        } finally {
            setHallCreating(false);
        }
    };

    return (
        <Box
            key={theme.palette.mode}
            sx={{
                width: 320,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.vars.palette.background.default,
                // borderRight: `2px solid ${theme.palette.divider}`,
                paddingX: 2,
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, transition: theme.transitions.create(['border-color'], { duration: theme.transitions.duration.shorter }) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={() => navigate('/settings/halls')}
                        sx={{ color: '#FB6633' }}
                    >
                        <Iconify icon="eva:arrow-ios-back-fill" width={20} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {t('floorPlan.title')}
                    </Typography>
                </Box>
                <Stack spacing={1}>
                    {/* {!hallId && (
                        <Button
                            fullWidth
                            startIcon={<Iconify icon="solar:flag-bold" />}
                            onClick={handleHallDialogOpen}
                            sx={{ textTransform: 'none', fontWeight: 'bold', backgroundColor: '#1976d2', color: '#FFFFFF', '&:hover': { backgroundColor: '#1565c0' } }}
                        >
                            Create Hall
                        </Button>
                    )} */}
                </Stack>

                {/* Save changes button */}
                {changedTablesCount > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, border: `1px solid #FB6633` }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: '#FB6633' }}>
                            {changedTablesCount} {changedTablesCount > 1 ? t('floorPlan.tablesChanged') : t('floorPlan.tableChanged')}
                        </Typography>
                        <Button
                            fullWidth
                            // variant="contained"
                            size="small"
                            onClick={handleSaveTableChanges}
                            disabled={savingChanges}
                            sx={{ textTransform: 'none', fontWeight: 'bold', backgroundColor: '#FB6633', '&:hover': { backgroundColor: '#FB6633', opacity: 0.8 } }}
                        >
                            {savingChanges ? t('floorPlan.savingChanges') : t('floorPlan.saveChanges')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Settings Section */}
            {/* <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.secondary }}>
          Settings
        </Typography>
        <Stack spacing={1}>
          <FormControlLabel
            control={<Checkbox checked={showGrid} onChange={onGridToggle} size="small" />}
            label="Show Grid"
            sx={{ m: 0 }}
          />
          <FormControlLabel
            control={<Checkbox checked={snapToGrid} onChange={onSnapToggle} size="small" />}
            label="Snap to Grid"
            sx={{ m: 0 }}
          />
        </Stack>
      </Box> */}

            {/* Selected Table Info */}
            {selectedTable && (
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', }}>
                        {t('floorPlan.selectedTable')}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, backgroundColor: theme.vars.palette.background.paper, transition: theme.transitions.create(['background-color'], { duration: theme.transitions.duration.shorter }) }}>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {`${t('floorPlan.tableInfo.tableLabel')} ${selectedTable.number}`}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditOpen(selectedTable)}
                                        sx={{ color: '#FB6633' }}
                                    >
                                        <Iconify icon="solar:pen-bold" width={16} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteTableConfirm(selectedTable.id)}
                                        color='error'
                                        disabled={deletingTable}
                                    >
                                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {t('floorPlan.tableInfo.seats')}: {selectedTable.seats} • {t('floorPlan.tableInfo.size')}: {Math.round(selectedTable.width)} × {Math.round(selectedTable.height)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {t('floorPlan.tableInfo.position')}: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {t('floorPlan.tableInfo.rotation')}: {Math.round(selectedTable.rotation)}{t('floorPlan.tableInfo.degrees')}
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            )}

            {/* Tables List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1, backgroundColor: theme.vars.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            color: theme.palette.text.secondary,
                            transition: theme.transitions.create(['color', 'background-color'], { duration: theme.transitions.duration.shorter }),
                        }}
                    >
                        {t('floorPlan.tablesCount')} ({tables.length})
                    </Typography>
                    {hallId && (
                        <Button size="small" sx={{ backgroundColor: '#FB6633', color: 'white', ":hover": { backgroundColor: '#FB6633', opacity: 0.8 } }} onClick={handleCreateTableDialogOpen} >
                            {t('floorPlan.addTable')}
                        </Button>
                    )}
                </Box>

                {tables.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {t('floorPlan.noTables')}
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {tables.map((table, index) => (
                            <ListItem
                                key={table.id}
                                disablePadding
                                sx={{
                                    backgroundColor: table.id === selectedTableId ? theme.palette.action.selected : 'transparent',
                                    borderLeft: table.id === selectedTableId ? `4px solid ${theme.palette.error.main}` : '4px solid transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                            >
                                <ListItemButton
                                    onClick={() => onTableSelect(table.id)}
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ fontWeight: table.id === selectedTableId ? 'bold' : 'normal' }}>
                                                {`${t('floorPlan.tableInfo.tableLabel')} ${table.number}`}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                <Typography component="span" variant="caption">
                                                    {table.seats} {t('floorPlan.tableInfo.seatLabel')} • {Math.round(table.width)} × {Math.round(table.height)}
                                                </Typography>
                                                {table.table_type === 'time_based' && (
                                                    <Chip
                                                        size="small"
                                                        icon={<Iconify icon="solar:clock-circle-bold" width={12} />}
                                                        label="Time-based"
                                                        color="warning"
                                                        sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 10 } }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.action.hover, fontSize: '12px', color: theme.palette.text.secondary, transition: theme.transitions.create(['background-color', 'border-color', 'color'], { duration: theme.transitions.duration.shorter }) }}>
                {t('floorPlan.totalTables')} {tables.length}
            </Box>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('floorPlan.editTableDialog.title')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label={t('floorPlan.editTableDialog.tableNumber')}
                            type="number"
                            value={editFormData.number || ''}
                            onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label={t('floorPlan.editTableDialog.seats')}
                            type="number"
                            value={editFormData.seats || DEFAULT_TABLE_SEATS}
                            onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 12 }}
                        />
                        <TextField
                            label={t('floorPlan.editTableDialog.width')}
                            type="number"
                            value={editFormData.width || ''}
                            onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ step: 5 }}
                        />
                        <TextField
                            label={t('floorPlan.editTableDialog.height')}
                            type="number"
                            value={editFormData.height || ''}
                            onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ step: 5 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleEditSave} variant="contained" color="primary">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Hall Dialog - only when no hallId */}
            {!hallId && (
                <Dialog open={hallDialogOpen} onClose={handleHallDialogClose} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('floorPlan.createHallDialog.title')}</DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>{t('floorPlan.createHallDialog.branch')}</InputLabel>
                                <Select
                                    label={t('floorPlan.createHallDialog.branch')}
                                    value={hallFormData.branch_id}
                                    onChange={(e) => setHallFormData((prev) => ({ ...prev, branch_id: e.target.value }))}
                                >
                                    {branches.map((branch) => (
                                        <MenuItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label={t('floorPlan.createHallDialog.hallName')}
                                value={hallFormData.name}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, name: e.target.value }))}
                                fullWidth
                                size="small"
                                placeholder={t('floorPlan.createHallDialog.hallNamePlaceholder')}
                            />
                            <TextField
                                label={t('floorPlan.createHallDialog.width')}
                                type="number"
                                value={hallFormData.width}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, width: parseInt(e.target.value)  }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 100, step: 50 }}
                            />
                            <TextField
                                label={t('floorPlan.createHallDialog.height')}
                                type="number"
                                value={hallFormData.height}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, height: parseInt(e.target.value)  }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 100, step: 50 }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleHallDialogClose}>{t('floorPlan.createHallDialog.cancel')}</Button>
                        <Button
                            onClick={handleHallCreate}
                            variant="contained"
                            color="primary"
                            disabled={hallCreating || !hallFormData.name.trim() || !hallFormData.branch_id}
                        >
                            {hallCreating ? t('floorPlan.createHallDialog.creating') : t('floorPlan.createHallDialog.create')}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Create Table Dialog */}
            <Dialog open={createTableDialogOpen} onClose={handleCreateTableDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('floorPlan.createTableDialog.title')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label={t('floorPlan.createTableDialog.tableNumber')}
                            type="number"
                            value={createTableFormData.number}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, number: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label={t('floorPlan.createTableDialog.capacity')}
                            type="number"
                            value={createTableFormData.capacity}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
                                {t('floorPlan.createTableDialog.tableSize')}
                            </Typography>
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
                                    m
                                </ToggleButton>
                                <ToggleButton value="cm">
                                    cm
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label={`${t('floorPlan.createTableDialog.width')} (${unitType})`}
                                type="number"
                                value={createTableFormData.width}
                                onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, width: parseFloat(e.target.value)  }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0.2, step: 0.1 }}
                            />
                            <TextField
                                label={`${t('floorPlan.createTableDialog.height')} (${unitType})`}
                                type="number"
                                value={createTableFormData.height}
                                onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, height: parseFloat(e.target.value)  }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0.2, step: 0.1 }}
                            />
                        </Stack>
                        <TextField
                            label={t('floorPlan.createTableDialog.rotation')}
                            type="number"
                            value={createTableFormData.rotation}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, rotation: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: 360, step: 15 }}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Table type</InputLabel>
                            <Select
                                label="Table type"
                                value={createTableFormData.table_type}
                                onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, table_type: e.target.value as 'simple' | 'time_based' }))}
                            >
                                <MenuItem value="simple">Simple</MenuItem>
                                <MenuItem value="time_based">Time based</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1, fontStyle: 'italic' }}>
                            {t('floorPlan.createTableDialog.infoText')}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateTableDialogClose}>{t('floorPlan.createTableDialog.cancel')}</Button>
                    <Button
                        onClick={handleCreateTableSubmit}
                        // variant="contained"
                        // color="primary"
                        sx={{ backgroundColor: '#FB6633', color: 'white', ":hover": { backgroundColor: '#FB6633', opacity: 0.8 } }}
                        disabled={creatingTable}
                    >
                        {creatingTable ? t('floorPlan.createTableDialog.creating') : t('floorPlan.createTableDialog.create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Table Dialog */}
            <Dialog open={editTableId !== null} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('floorPlan.editTableDialog.title')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label={t('floorPlan.editTableDialog.tableNumber')}
                            type="number"
                            value={editFormData.number}
                            onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label={t('floorPlan.editTableDialog.seats')}
                            type="number"
                            value={editFormData.seats}
                            onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
                                {t('floorPlan.editTableDialog.tableDimensions')}
                            </Typography>
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
                                    m
                                </ToggleButton>
                                <ToggleButton value="cm">
                                    cm
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label={`${t('floorPlan.editTableDialog.width')} (${unitType})`}
                                type="number"
                                value={editFormData.width}
                                onChange={(e) => handleInputChange('width', parseFloat(e.target.value) )}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0.2, step: 0.1 }}
                            />
                            <TextField
                                label={`${t('floorPlan.editTableDialog.height')} (${unitType})`}
                                type="number"
                                value={editFormData.height}
                                onChange={(e) => handleInputChange('height', parseFloat(e.target.value) )}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0.2, step: 0.1 }}
                            />
                        </Stack>
                        <TextField
                            label={t('floorPlan.editTableDialog.rotation')}
                            type="number"
                            value={editFormData.rotation}
                            onChange={(e) => handleInputChange('rotation', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: 360, step: 15 }}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Table type</InputLabel>
                            <Select
                                label="Table type"
                                value={editFormData.table_type || 'simple'}
                                onChange={(e) => handleInputChange('table_type', e.target.value)}
                            >
                                <MenuItem value="simple">Simple</MenuItem>
                                <MenuItem value="time_based">Time based</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1, fontStyle: 'italic' }}>
                            {t('floorPlan.editTableDialog.infoText')}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>{t('floorPlan.editTableDialog.cancel')}</Button>
                    <Button
                        onClick={handleEditSave}
                        // variant="contained"
                        // color="primary"
                        sx={{ backgroundColor: '#FB6633', color: 'white', ":hover": { backgroundColor: '#FB6633', opacity: 0.8 } }}
                        disabled={updatingTable}
                    >
                        {updatingTable ? t('floorPlan.editTableDialog.saving') : t('floorPlan.editTableDialog.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmDialogOpen} onClose={handleDeleteTableCancel} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                    {t('floorPlan.deleteDialog.title')}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        {t('floorPlan.deleteDialog.message')} {selectedTable?.number}? {t('floorPlan.deleteDialog.cannotUndo')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteTableCancel} disabled={deletingTable}>
                        {t('floorPlan.deleteDialog.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteTableConfirmation}
                        variant="contained"
                        color="error"
                        disabled={deletingTable}
                    >
                        {deletingTable ? t('floorPlan.deleteDialog.deleting') : t('floorPlan.deleteDialog.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

