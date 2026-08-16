import type { ReactElement } from 'react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

type NoDataTooltipProps = {
  enabled: boolean;
  title: string;
  children: ReactElement;
};

export function NoDataTooltip({ enabled, title, children }: NoDataTooltipProps) {
  if (!enabled) {
    return children;
  }

  return (
    <Tooltip title={title} arrow>
      <Box component="span" sx={{ display: 'block' }}>
        {children}
      </Box>
    </Tooltip>
  );
}
