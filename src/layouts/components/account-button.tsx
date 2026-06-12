import type { IconButtonProps } from '@mui/material/IconButton';

import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

import { varTap, varHover, AnimateBorder, transitionTap } from 'src/components/animate';

// ----------------------------------------------------------------------

export type AccountButtonProps = IconButtonProps & {
  photoURL: string;
  displayName: string;
};

export function AccountButton({ photoURL, displayName, sx, ...other }: AccountButtonProps) {
  const { t } = useTranslation('layout');

  const renderDefaultAvatar = () => (
    <Box
      sx={{
        width: 1,
        height: 1,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'var(--surface)',
      }}
    >
      <Box
        sx={{
          top: '22%',
          left: '50%',
          width: '40%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          bgcolor: 'var(--surface-2)',
          position: 'absolute',
          transform: 'translateX(-50%)',
        }}
      />
      <Box
        sx={{
          left: '50%',
          bottom: '10%',
          width: '72%',
          height: '30%',
          bgcolor: 'var(--surface-2)',
          position: 'absolute',
          transform: 'translateX(-50%)',
          borderRadius: '999px 999px 0 0',
        }}
      />
    </Box>
  );

  return (
    <IconButton
      component={m.button}
      whileTap={varTap(0.96)}
      whileHover={varHover(1.04)}
      transition={transitionTap()}
      aria-label={t('a11y.account')}
      sx={[{ p: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <AnimateBorder
        sx={{ p: '3px', borderRadius: '50%', width: 40, height: 40 }}
        slotProps={{
          primaryBorder: { size: 60, width: '1px', sx: { color: 'primary.main' } },
          secondaryBorder: { sx: { color: 'warning.main' } },
        }}
      >
        <Avatar src={photoURL} alt={displayName} sx={{ width: 1, height: 1 }}>
          {!photoURL && renderDefaultAvatar()}
        </Avatar>
      </AnimateBorder>
    </IconButton>
  );
}
