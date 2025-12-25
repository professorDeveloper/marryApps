import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';

import { Iconify } from 'src/components/iconify';

type Props = {
  numSelected: number;
  onDelete: () => void;
  children?: React.ReactNode;
};

export function SharedTableToolbar({
  numSelected,
  onDelete,
  children,
}: Props) {
  return (
    <GridToolbarContainer>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
          width: '100%',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexGrow: 1, width: 1 }}
        >
          <GridToolbarQuickFilter
            sx={{ width: { xs: 1, md: 320 } }}
            slotProps={{
              textField: {
                placeholder: 'Search...',
              },
            }}
          />

          {children}
        </Stack>

        {numSelected > 0 && (
          <Button
            size="small"
            color="error"
            startIcon={
              <Iconify icon="solar:trash-bin-trash-bold" />
            }
            onClick={onDelete}
          >
            Delete ({numSelected})
          </Button>
        )}
      </Stack>
    </GridToolbarContainer>
  );
}
