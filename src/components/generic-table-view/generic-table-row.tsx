import type { GridCellParams } from '@mui/x-data-grid';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type ParamsProps = {
    params: GridCellParams;
};

/**
 * Generic price renderer
 */
export function RenderCellPrice({ params }: ParamsProps) {
    return fCurrency(params.row.price);
}

/**
 * Generic status/publish renderer
 */
export function RenderCellPublish({ params }: ParamsProps) {
    const status = params.row.publish || params.row.status;

    return (
        <Label
            variant="soft"
            color={status === 'published' ? 'info' : status === 'active' ? 'success' : 'default'}
        >
            {status}
        </Label>
    );
}

/**
 * Generic stock/inventory status renderer
 */
export function RenderCellStock({ params }: ParamsProps) {
    const inventoryType = params.row.inventoryType || 'in stock';

    const bgColor =
        (inventoryType === 'out of stock' && 'error.main') ||
        (inventoryType === 'low stock' && 'warning.main') ||
        'success.main';

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '4px',
                    bgcolor: bgColor,
                }}
            />
        </Box>
    );
}

/**
 * Generic item renderer with avatar and name
 * @param params - Grid cell params
 * @param imageField - Field name for image URL (default: 'coverUrl')
 * @param nameField - Field name for item name (default: 'name')
 */
export function RenderCellItem({
    params,
    imageField = 'coverUrl',
    nameField = 'name',
}: ParamsProps & {
    imageField?: string;
    nameField?: string;
}) {
    // Defensive: params or params.row can be undefined in some runtimes; render fallback
    const row = params?.row ?? null;

    if (!row) {
        return <span>-</span>;
    }

    const name = row[nameField] ?? '-';
    const src = row[imageField] ?? null;

    return (
        <Box
            sx={{
                py: 2,
                gap: 2,
                width: 1,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Avatar
                alt={name}
                src={src}
                variant="rounded"
                sx={{ width: 64, height: 64 }}
            />

            <ListItemText
                primary={
                    <span>{name}</span>
                }
            />
        </Box>
    );
}

/**
 * Generic text renderer
 */
export function RenderCellText({ params }: ParamsProps) {
    return <span>{params.row[params.field]}</span>;
}

/**
 * Generic number renderer
 */
export function RenderCellNumber({ params }: ParamsProps) {
    return <span>{params.row[params.field]}</span>;
}
