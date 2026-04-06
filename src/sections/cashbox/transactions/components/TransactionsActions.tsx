import { useTranslation } from 'react-i18next';

import { Stack, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

interface TransactionsActionsProps {
  showHeaderActions?: boolean;
}

export function TransactionsActions({ showHeaderActions = true }: TransactionsActionsProps) {
  const { t } = useTranslation('menu');

  if (!showHeaderActions) return null;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button
        component={RouterLink}
        href={`${paths.cashbox.transactionsNew}?kind=income`}
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
      >
        Add income
      </Button>
      <Button
        component={RouterLink}
        href={`${paths.cashbox.transactionsNew}?kind=expense`}
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
      >
        Add expense
      </Button>
      <Button
        component={RouterLink}
        href={`${paths.cashbox.transactionsNew}?kind=transfer`}
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
      >
        Add transfer
      </Button>
    </Stack>
  );
}
