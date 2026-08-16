import Box from '@mui/material/Box';

import { AuthSlideCarousel } from './AuthSlideCarousel';

type Props = {
  children: React.ReactNode;
};

export function AuthVisualLayout({ children }: Props) {
  return (
    <Box component="main" sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT: Form column */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 480px' },
          width: { xs: '100%', md: '480px' },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          bgcolor: 'var(--bg)',
          borderRight: { xs: 'none', md: '1px solid var(--border)' },
          overflowY: 'auto',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {children}
      </Box>

      {/* RIGHT: Slide carousel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: '1 1 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AuthSlideCarousel />
      </Box>
    </Box>
  );
}
