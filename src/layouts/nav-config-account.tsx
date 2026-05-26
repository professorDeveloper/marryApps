import type { TFunction } from 'i18next';
import type { AccountDrawerProps } from './components/account-drawer';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const getAccountData = (t: TFunction): AccountDrawerProps['data'] => [
  { label: t('overview.menu.title'), href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: t('profile'),
    href: paths.profile,
    icon: <Iconify icon="custom:profile-duotone" />,
  },
];
