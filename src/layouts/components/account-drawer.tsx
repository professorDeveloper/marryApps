import type { IconButtonProps } from '@mui/material/IconButton';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateBorder } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

// ----------------------------------------------------------------------

export type AccountDrawerProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountDrawer({ data: _data = [], sx, ...other }: AccountDrawerProps) {
  const { user } = useAuthContext();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const profileName =
    user?.full_name || user?.fullName || user?.displayName || user?.username || 'User';
  const profilePhone = user?.phoneNumber || user?.phone_number || '-';
  const avatarSrc = user?.photoURL || '';

  const renderDefaultAvatar = () => (
    <Box
      sx={{
        width: 1,
        height: 1,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'var(--color-surface-1)',
      }}
    >
      <Box
        sx={{
          top: '22%',
          left: '50%',
          width: '40%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          bgcolor: 'var(--color-surface-2)',
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
          bgcolor: 'var(--color-surface-2)',
          position: 'absolute',
          transform: 'translateX(-50%)',
          borderRadius: '999px 999px 0 0',
        }}
      />
    </Box>
  );

  const renderAvatar = () => (
    <AnimateBorder
      sx={{ mb: 2, p: '6px', width: 96, height: 96, borderRadius: '50%' }}
      slotProps={{
        primaryBorder: { size: 120, sx: { color: 'primary.main' } },
      }}
    >
      <Avatar src={avatarSrc} alt={profileName} sx={{ width: 1, height: 1 }}>
        {!avatarSrc && renderDefaultAvatar()}
      </Avatar>
    </AnimateBorder>
  );

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL={avatarSrc}
        displayName={profileName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { 
            sx: { 
              width: 320,
              backgroundColor: 'var(--color-surface-0)',
              borderLeft: '1px solid var(--color-border)',
            } 
          },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            top: 12,
            left: 12,
            zIndex: 9,
            position: 'absolute',
          }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box
            sx={{
              pt: 8,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            {renderAvatar()}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {profileName}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
              {profilePhone}
            </Typography>
          </Box>
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}
