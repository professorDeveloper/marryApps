import type { CategoryGoodsModalProps } from '../types';

import { Dialog, IconButton, DialogTitle, DialogContent } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { CategoryGoodsTable } from './CategoryGoodsTable';

/**
 * Modal component for viewing goods within a category
 */
export function CategoryGoodsModal({ isOpen, onClose, category }: CategoryGoodsModalProps) {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    height: '80vh',
                    maxHeight: '80vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                }}
            >
                {category?.name || 'Category'} - {category?.name_en || 'Goods'}
                <IconButton onClick={onClose} size="small">
                    <Iconify icon="solar:close-circle-bold" width={24} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {category && <CategoryGoodsTable categoryId={category.id} />}
            </DialogContent>
        </Dialog>
    );
}
