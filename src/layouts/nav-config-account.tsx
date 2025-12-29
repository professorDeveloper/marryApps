import type { TFunction } from 'i18next';
import type { AccountDrawerProps } from './components/account-drawer';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const getAccountData = (t: TFunction): AccountDrawerProps['data'] => [
  { label: t('overview.menu.title', 'Home'), href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: t('profile', 'Profile'),
    href: '#',
    icon: <Iconify icon="custom:profile-duotone" />,
  },
  {
    label: t('projects', 'Projects'),
    href: '#',
    icon: <Iconify icon="solar:notes-bold-duotone" />,
    info: '3',
  },
  {
    label: t('invoice', 'Invoice'),
    href: '#',
    icon: <Iconify icon="custom:invoice-duotone" />,
  },
  { label: t('security', 'Security'), href: '#', icon: <Iconify icon="solar:shield-keyhole-bold-duotone" /> },
  { label: t('settings', 'Settings'), href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
