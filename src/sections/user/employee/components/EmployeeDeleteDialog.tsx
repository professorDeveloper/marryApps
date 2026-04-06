import type { EmployeeDeleteDialogProps } from '../types';

import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

/**
 * Employee delete confirmation dialog component
 */
export function EmployeeDeleteDialog({ 
    open, 
    onClose, 
    onConfirm, 
    employeeName 
}: EmployeeDeleteDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                Are you sure you want to delete {employeeName ? `"${employeeName}"` : 'this employee'}? 
                This action cannot be undone.
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
