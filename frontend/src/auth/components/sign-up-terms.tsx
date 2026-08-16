import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }: BoxProps) {
  return (
    <Box
      component="span"
      sx={[
      () => ({
        display: 'block',
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {'Ro\'yxatdan o\'tish orqali men quyidagi shartlarga roziman: '}
      <Link underline="always" color="text.primary">
      Xizmat ko‘rsatish shartlari
      </Link>
      {' va '}
      <Link underline="always" color="text.primary">
      Maxfiylik siyosati
      </Link>
      .
    </Box>
  );
}
