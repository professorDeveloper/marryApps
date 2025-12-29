import type { AccountDrawerProps } from './components/account-drawer';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  { label: 'Home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    label: 'Profil',
    href: '#',
    icon: <Iconify icon="custom:profile-duotone" />,
  },
  {
    label: 'Loyahalar',
    href: '#',
    icon: <Iconify icon="solar:notes-bold-duotone" />,
    info: '3',
  },
  {
    label: 'Obuna',
    href: '#',
    icon: <Iconify icon="custom:invoice-duotone" />,
  },
  { label: 'Xavfsizlik', href: '#', icon: <Iconify icon="solar:shield-keyhole-bold-duotone" /> },
  { label: 'Akkaunt sozlamalari', href: '#', icon: <Iconify icon="solar:settings-bold-duotone" /> },
];
