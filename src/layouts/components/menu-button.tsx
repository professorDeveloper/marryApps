import type { IconButtonProps } from '@mui/material/IconButton';

import { useTranslation } from 'react-i18next';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function MenuButton({ sx, ...other }: IconButtonProps) {
  const { t } = useTranslation('layout');

  return (
    <IconButton aria-label={t('a11y.openMenu')} sx={sx} {...other}>
      <Iconify icon="custom:menu-duotone" width={24} />
    </IconButton>
  );
}
