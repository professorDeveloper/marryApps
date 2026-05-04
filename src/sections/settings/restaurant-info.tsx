import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useGetBranchById } from 'src/hooks/use-branch-by-id';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useBranchContext } from 'src/components/contexts/branch-context';

export function RestaurantInfoListView() {
  const { t } = useTranslation('menu');
  const { selectedBranchId } = useBranchContext();
  const { branch, branchLoading, branchError } = useGetBranchById(selectedBranchId ?? undefined);

  // Demo ma'lumotlar - keyin API dan keladi
  const restaurantData = {
    organizationName: branch?.name || 'Nomdor somsa',
    address: branch?.address || 'Chilonzor tumani novza metro',
    description: '',
    city: 'Toshkent',
    phone: branch?.phone || '-',
    averageBill: '500 000 000 so\'m',
    averageCheckLevel: '600 ta',
    availableOnline: false,
    email: 'novza.chilonzornovza.com',
    workingDays: {
      monday: '8:00 22:00',
      tuesday: '8:00 22:00',
      wednesday: '',
      thursday: '8:00 22:00',
      friday: '8:00 22:00',
      saturday: '8:00 22:00',
      sunday: '8:00 22:00',
    },
    socialNetworks: {
      facebook: 'https://www.facebook.com/name',
      instagram: 'https://www.instagram.com/name',
      linkedin: 'linkedin.com/in/name',
      twitter: 'https://www.twitter.com/name',
    },
  };

  const location = {
    lat: 41.292258,
    lng: 69.222216,
  };

  // 41.292258, 69.222276
  const weekDays = [
    { key: 'monday', label: 'Dushanba', value: restaurantData.workingDays.monday },
    { key: 'tuesday', label: 'Seshanba', value: restaurantData.workingDays.tuesday },
    { key: 'wednesday', label: 'Chorshanba', value: restaurantData.workingDays.wednesday },
    { key: 'thursday', label: 'Payshanba', value: restaurantData.workingDays.thursday },
    { key: 'friday', label: 'Juma', value: restaurantData.workingDays.friday },
    { key: 'saturday', label: 'Shanba', value: restaurantData.workingDays.saturday },
    { key: 'sunday', label: 'Yakshanba', value: restaurantData.workingDays.sunday },
  ];

  return (
    <DashboardContent
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        '--layout-dashboard-content-pt': { xs: '16px', md: '24px' },
        '--layout-dashboard-content-pb': { xs: '16px', md: '24px' },
      }}
    >
      <CustomBreadcrumbs
        heading="Sozlamalar"
        links={[
          { name: t('app') || 'Bosh sahifa', href: paths.menu.root },
          {
            name: 'Restoran ma\'lumotlari',
            // icon: <Iconify icon="eva:chevron-down-fill" width={16} />,
          },
        ]}
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {/* Loading va Error states */}
        {branchLoading && (
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </CardContent>
          </Card>
        )}

        {branchError && !branchLoading && (
          <Alert severity="error">
            Restoran ma'lumotlarini yuklashda xatolik yuz berdi
          </Alert>
        )}

        {!selectedBranchId && !branchLoading && (
          <Alert severity="info">
            Restoranni tanlang
          </Alert>
        )}

        {/* Asosiy ma'lumotlar Card */}
        {!branchLoading && selectedBranchId && (
          <Card>
            <CardHeader title="Asosiy ma'lumotlar" />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Tashkilot nomi
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {restaurantData.organizationName}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Manzil
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {restaurantData.address}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Telefon
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {restaurantData.phone}
                  </Typography>
                </Box>

                {/* <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Tavsif
                </Typography>
                <Typography variant="body1" fontWeight={500} color="text.secondary">
                  {restaurantData.description || '-'}
                </Typography>
              </Box> */}

                {/* <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Shahar
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {restaurantData.city}
                </Typography>
              </Box> */}

                {/* <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  O'rtacha hisob-kitob miqdori
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {restaurantData.averageBill}
                </Typography>
              </Box> */}

                {/* <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  O'rtacha tekshirish darajasi
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {restaurantData.averageCheckLevel}
                </Typography>
              </Box> */}

                {/* <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Onlayn mavjud
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {restaurantData.availableOnline ? 'Mavjud' : 'Mavjud emas'}
                </Typography>
              </Box> */}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Map Display Card */}
        <Card>
          <CardContent sx={{ p: 0, m: 0, height: '100%', minHeight: 400 }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                minHeight: 400,
                position: 'relative',
                backgroundColor: 'grey.100',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <iframe
                title="Restaurant Location Map"
                src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* Location Pin Overlay */}
              {/* <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -100%)',
                  pointerEvents: 'none',
                }}
              >
                <Iconify
                  icon="mingcute:location-fill"
                  width={40}
                  sx={{ color: 'error.main' }}
                />
              </Box> */}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Bottom Row - 3 Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
          mt: 3,
        }}
      >
        {/* Ish kunlari Card */}
        <Card>
          <CardHeader title="Ish kunlari" />
          <CardContent>
            <Stack spacing={1.5}>
              {weekDays.map((day) => (
                <Box
                  key={day.key}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {day.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={day.value ? 'text.primary' : 'text.secondary'}
                  >
                    {day.value || '-'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Manzil Card */}
        <Card>
          <CardHeader title="Manzil" />
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Iconify
                  icon="mingcute:location-fill"
                  width={20}
                  sx={{ color: 'text.primary', mt: 0.25 }}
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {restaurantData.address}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Iconify
                  icon="solar:letter-bold"
                  width={20}
                  sx={{ color: 'text.primary', mt: 0.25 }}
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {restaurantData.email}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Ijtimoiy tarmoqlar Card */}
        <Card>
          <CardHeader title="Ijtimoiy tarmoqlar" />
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Iconify
                  icon="socials:facebook"
                  width={24}
                  sx={{ color: 'var(--color-social-facebook)' }}
                />
                <Typography
                  variant="body2"
                  component="a"
                  href={restaurantData.socialNetworks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {restaurantData.socialNetworks.facebook}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Iconify
                  icon="socials:instagram"
                  width={24}
                  sx={{
                    background: 'linear-gradient(45deg, var(--color-social-instagram-start), var(--color-social-instagram-middle), var(--color-social-instagram-end))',
                    borderRadius: '50%',
                  }}
                />
                <Typography
                  variant="body2"
                  component="a"
                  href={restaurantData.socialNetworks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {restaurantData.socialNetworks.instagram}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Iconify
                  icon="socials:linkedin"
                  width={24}
                  sx={{ color: 'var(--color-social-linkedin)' }}
                />
                <Typography
                  variant="body2"
                  component="a"
                  href={`https://${restaurantData.socialNetworks.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {restaurantData.socialNetworks.linkedin}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Iconify
                  icon="socials:twitter"
                  width={24}
                  sx={{ color: 'var(--color-text)' }}
                />
                <Typography
                  variant="body2"
                  component="a"
                  href={restaurantData.socialNetworks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'text.primary',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {restaurantData.socialNetworks.twitter}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </DashboardContent>
  );
}
