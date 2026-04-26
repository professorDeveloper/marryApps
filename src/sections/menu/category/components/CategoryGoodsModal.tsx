import type { CategoryGoodsModalProps } from '../types';

import { Dialog, IconButton, DialogTitle, DialogContent, Typography } from '@mui/material';

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
                    backgroundColor: 'var(--color-surface-0)',
                    border: '1px solid var(--color-border)',
                    backdropFilter: 'blur(12px)',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 2,
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-1)',
                }}
            >
                <Typography sx={{ color: 'primary.main', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {category?.name || 'Category'} - {category?.name_en || 'Goods'}
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        backgroundColor: 'var(--color-primary-soft)',
                        color: 'text.primary',
                        '&:hover': {
                            backgroundColor: 'var(--color-primary-ring)',
                        },
                    }}
                >
                    <Iconify icon="solar:close-circle-bold" width={24} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, backgroundColor: 'var(--color-surface-0)' }}>
                {category && <CategoryGoodsTable categoryId={category.id} />}
            </DialogContent>
        </Dialog>
    );
}
