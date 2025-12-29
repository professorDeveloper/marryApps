import type { WorkspacesPopoverProps } from './components/workspaces-popover';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const _workspaces: WorkspacesPopoverProps['data'] = [
  {
    id: 'team-1',
    name: 'Friends Yakkasaroy',
    // plan: 'Free',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-1.webp`,
  },
  {
    id: 'team-2',
    name: 'Friends Sebzor',
    // plan: 'Pro',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-2.webp`,
  },
  {
    id: 'team-3',
    name: 'Nomdor Novza',
    // plan: 'Pro',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-3.webp`,
  },
];
