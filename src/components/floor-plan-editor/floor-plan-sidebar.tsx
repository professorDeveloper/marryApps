import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    TextField,
    Stack,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Iconify } from '../iconify';
import { useCreateHall } from 'src/actions/halls';
import { useGetBranches } from 'src/actions/branches';
import { useCreateCafeTable, useUpdateCafeTable, useDeleteCafeTable } from 'src/actions/cafe-tables';
import type { ICafeTableFormData } from 'src/types/cafe-tables';
import type { Table } from './types';
import { DEFAULT_TABLE_SEATS, DEFAULT_TABLE_WIDTH, DEFAULT_TABLE_HEIGHT, HALL_WIDTH, HALL_HEIGHT } from './types';
import { findNearestEmptyPosition } from './utils';

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
    const { createHall } = useCreateHall();
    const { branches } = useGetBranches();
    const { createTable } = useCreateCafeTable();
    const { updateTable } = useUpdateCafeTable();
    const { deleteTable } = useDeleteCafeTable();

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTableId, setEditTableId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Table>>({});
    const [createTableDialogOpen, setCreateTableDialogOpen] = useState(false);
    const [createTableFormData, setCreateTableFormData] = useState({ number: 0, capacity: 4, pos_x: 0, pos_y: 0, width: 80, height: 60, rotation: 0 });
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
        setEditFormData({
            number: table.number,
            seats: table.seats,
            width: table.width,
            height: table.height,
        });
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
            // Map table fields to café table API format
            const payload: Partial<ICafeTableFormData> = {
                number: editFormData.number,
                capacity: editFormData.seats,
                pos_x: editFormData.x,
                pos_y: editFormData.y,
                width: editFormData.width,
                height: editFormData.height,
                rotation: editFormData.rotation,
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
        // Default form data - no position input needed
        setCreateTableFormData({
            number: nextNumber,
            capacity: 4,
            pos_x: 0,  // Will be auto-set by server or ignored
            pos_y: 0,  // Will be auto-set by server or ignored
            width: 80,
            height: 60,
            rotation: 0
        });
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

            // Find nearest empty position for new table
            const position = findNearestEmptyPosition(
                tables,
                effectiveHallWidth,
                effectiveHallHeight,
                createTableFormData.width,
                createTableFormData.height
            );

            await createTable(hallId, {
                number: createTableFormData.number,
                capacity: createTableFormData.capacity,
                pos_x: position.x,  // Use calculated position
                pos_y: position.y,  // Use calculated position
                width: createTableFormData.width,
                height: createTableFormData.height,
                rotation: createTableFormData.rotation,
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
                        onClick={() => navigate('/menu/halls')}
                        sx={{ color: theme.palette.primary.main }}
                    >
                        <Iconify icon="eva:arrow-ios-back-fill" width={20} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                        Floor Plan
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
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.warning.main}` }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: theme.palette.warning.main }}>
                            {changedTablesCount} table{changedTablesCount > 1 ? 's' : ''} changed
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={handleSaveTableChanges}
                            disabled={savingChanges}
                            sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                            {savingChanges ? 'Saving...' : 'Save Changes'}
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
                        Selected Table
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, backgroundColor: theme.vars.palette.background.paper, transition: theme.transitions.create(['background-color'], { duration: theme.transitions.duration.shorter }) }}>
                        <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Table {selectedTable.number}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditOpen(selectedTable)}
                                        sx={{ color: theme.palette.warning.main }}
                                    >
                                        <Iconify icon="solar:pen-bold" width={16} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteTableConfirm(selectedTable.id)}
                                        sx={{ color: theme.palette.error.main }}
                                        disabled={deletingTable}
                                    >
                                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Seats: {selectedTable.seats} • Size: {Math.round(selectedTable.width)} × {Math.round(selectedTable.height)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Position: ({Math.round(selectedTable.x)}, {Math.round(selectedTable.y)})
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Rotation: {Math.round(selectedTable.rotation)}°
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
                        Tables ({tables.length})
                    </Typography>
                    {hallId && (
                        <Button size="small" variant="contained" color="primary" onClick={handleCreateTableDialogOpen} disabled={creatingTable}>
                            + Add
                        </Button>
                    )}
                </Box>

                {tables.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            No tables yet. Click "+ Add" to get started.
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
                                                Table {table.number}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                {table.seats} seats • {Math.round(table.width)} × {Math.round(table.height)}
                                            </Typography>
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
                Total Tables: {tables.length}
            </Box>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Table {selectedTable?.number}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="Table Number"
                            type="number"
                            value={editFormData.number || ''}
                            onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Seats"
                            type="number"
                            value={editFormData.seats || DEFAULT_TABLE_SEATS}
                            onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 12 }}
                        />
                        <TextField
                            label="Width"
                            type="number"
                            value={editFormData.width || ''}
                            onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ step: 5 }}
                        />
                        <TextField
                            label="Height"
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
                    <Button onClick={handleEditClose}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Hall Dialog - only when no hallId */}
            {!hallId && (
                <Dialog open={hallDialogOpen} onClose={handleHallDialogClose} maxWidth="sm" fullWidth>
                    <DialogTitle>Create New Hall</DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Branch</InputLabel>
                                <Select
                                    label="Branch"
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
                                label="Hall Name"
                                value={hallFormData.name}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, name: e.target.value }))}
                                fullWidth
                                size="small"
                                placeholder="e.g., Main Hall, VIP Hall"
                            />
                            <TextField
                                label="Width (px)"
                                type="number"
                                value={hallFormData.width}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 100, step: 50 }}
                            />
                            <TextField
                                label="Height (px)"
                                type="number"
                                value={hallFormData.height}
                                onChange={(e) => setHallFormData((prev) => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 100, step: 50 }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleHallDialogClose}>Cancel</Button>
                        <Button
                            onClick={handleHallCreate}
                            variant="contained"
                            color="primary"
                            disabled={hallCreating || !hallFormData.name.trim() || !hallFormData.branch_id}
                        >
                            {hallCreating ? 'Creating...' : 'Create Hall'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Create Table Dialog */}
            <Dialog open={createTableDialogOpen} onClose={handleCreateTableDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Table</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label="Table Number"
                            type="number"
                            value={createTableFormData.number}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, number: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Capacity (Seats)"
                            type="number"
                            value={createTableFormData.capacity}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1 }}>
                            Table Size
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="Width"
                                type="number"
                                value={createTableFormData.width}
                                onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, width: parseInt(e.target.value) }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 40, step: 10 }}
                            />
                            <TextField
                                label="Height"
                                type="number"
                                value={createTableFormData.height}
                                onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, height: parseInt(e.target.value) }))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 40, step: 10 }}
                            />
                        </Stack>
                        <TextField
                            label="Rotation (degrees)"
                            type="number"
                            value={createTableFormData.rotation}
                            onChange={(e) => setCreateTableFormData((prev) => ({ ...prev, rotation: parseInt(e.target.value) }))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: 360, step: 15 }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1, fontStyle: 'italic' }}>
                            ℹ️ Table will be placed at default location. You can drag it to desired position after creation.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateTableDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleCreateTableSubmit}
                        variant="contained"
                        color="primary"
                        disabled={creatingTable}
                    >
                        {creatingTable ? 'Creating...' : 'Create Table'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Table Dialog */}
            <Dialog open={editTableId !== null} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Table</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label="Table Number"
                            type="number"
                            value={editFormData.number}
                            onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Seats"
                            type="number"
                            value={editFormData.seats}
                            onChange={(e) => handleInputChange('seats', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1 }}>
                            Table Dimensions
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="Width"
                                type="number"
                                value={editFormData.width}
                                onChange={(e) => handleInputChange('width', parseInt(e.target.value))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 40, step: 10 }}
                            />
                            <TextField
                                label="Height"
                                type="number"
                                value={editFormData.height}
                                onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 40, step: 10 }}
                            />
                        </Stack>
                        <TextField
                            label="Rotation (degrees)"
                            type="number"
                            value={editFormData.rotation}
                            onChange={(e) => handleInputChange('rotation', parseInt(e.target.value))}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: 360, step: 15 }}
                        />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, pt: 1, fontStyle: 'italic' }}>
                            ℹ️ To move table, drag it on the canvas.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>Cancel</Button>
                    <Button
                        onClick={handleEditSave}
                        variant="contained"
                        color="primary"
                        disabled={updatingTable}
                    >
                        {updatingTable ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmDialogOpen} onClose={handleDeleteTableCancel} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                    Delete Table?
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        Are you sure you want to delete Table {selectedTable?.number}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteTableCancel} disabled={deletingTable}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteTableConfirmation}
                        variant="contained"
                        color="error"
                        disabled={deletingTable}
                    >
                        {deletingTable ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

