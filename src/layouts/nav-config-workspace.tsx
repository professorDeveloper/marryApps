import type { WorkspacesPopoverProps } from './components/workspaces-popover';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const _workspaces: WorkspacesPopoverProps['data'] = [
  {
    id: 'team-1',
    name: 'Friends Yakkasaroy',
    // plan: 'Free',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-4.webp`,
  },
  {
    id: 'team-2',
    name: 'Friends Sebzor',
    // plan: 'Pro',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-5.webp`,
  },
  {
    id: 'team-3',
    name: 'Friends Oqsaroy',
    // plan: 'Pro',
    logo: `${CONFIG.assetsDir}/assets/icons/workspaces/logo-4.webp`,
  },
];
