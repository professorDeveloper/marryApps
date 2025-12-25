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

export function RenderCellPrice({ params }: ParamsProps) {
  return fCurrency(params.row.price);
}

// export function RenderCellPublish({ params }: ParamsProps) {
//   return (
//     <Label variant="soft" color={params.row.publish === 'published' ? 'info' : 'default'}>
//       {params.row.publish}
//     </Label>
//   );
// }

export function RenderCellPublish({ params }: ParamsProps) {
  return <span>{params.row.publish}</span>;
}


// export function RenderCellCreatedAt({ params }: ParamsProps) {
//   return (
//     <Box sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
//       <span>{fDate(params.row.createdAt)}</span>
//       <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
//         {fTime(params.row.createdAt)}
//       </Box>
//     </Box>
//   );
// }

export function RenderCellStock({ params }: ParamsProps) {
  const bgColor =
    (params.row.inventoryType === 'out of stock' && 'error.main') ||
    (params.row.inventoryType === 'low stock' && 'warning.main') ||
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


export function RenderCellProduct({ params, href }: ParamsProps & { href: string }) {
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
        alt={params.row.name}
        src={params.row.coverUrl}
        variant="rounded"
        sx={{ width: 64, height: 64 }}
      />

      <ListItemText
        primary={
          <Link component={RouterLink} href={href} color="inherit">
            {params.row.name}
          </Link>
        }
        // secondary={params.row.category}
        // slotProps={{
        //   primary: { noWrap: true },
        //   secondary: { sx: { color: 'text.disabled' } },
        // }}
      />
    </Box>
  );
}
