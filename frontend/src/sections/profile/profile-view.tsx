import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function ProfileView() {
  const { user } = useAuthContext();

  const fields = [
    { label: 'Full name', value: user?.fullName || user?.displayName || '—' },
    { label: 'Username', value: user?.username || '—' },
    { label: 'Phone number', value: user?.phoneNumber || '—' },
    { label: 'Role', value: user?.role || '—' },
    { label: 'Branch ID', value: user?.branchId || '—' },
    { label: 'Brand ID', value: user?.brandId || '—' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar
            src={user?.photoURL}
            alt={user?.displayName}
            sx={{ width: 72, height: 72, fontSize: 28 }}
          >
            {user?.displayName?.[0]?.toUpperCase()}
          </Avatar>

          <Box>
            <Typography variant="h6">{user?.displayName || '—'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          {fields.map(({ label, value }) => (
            <Stack key={label} direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2">{value}</Typography>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
