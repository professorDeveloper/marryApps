import Box from '@mui/material/Box';

import { NeuralGrid, DarkTechPattern } from 'src/components/animate/background-patterns';

type Props = {
  children: React.ReactNode;
};

export function AuthVisualLayout({ children }: Props) {
  return (
    <Box component="main" sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT: Form - 35% width */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 35%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRight: { xs: 'none', md: '1px solid var(--color-border)' },
          overflowY: 'auto',
          p: { xs: 3, md: 4 },
          position: 'relative',
          zIndex: 10,
        }}
      >
        {children}
      </Box>

      {/* RIGHT: Animated background - 65% width */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '1 1 65%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'common.black',
        }}
      >
        <NeuralGrid />
        <DarkTechPattern bright />
      </Box>
    </Box>
  );
}
