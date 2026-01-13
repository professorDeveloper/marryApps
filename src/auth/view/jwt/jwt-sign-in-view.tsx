import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessageKey } from '../../utils';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  brand_id: z
    .string()
    .min(1, { message: 'Brand ID kerak!' }),
  username: z
    .string()
    .min(1, { message: 'Foydalanuvchi nomi kerak!' }),
  password: z
    .string()
    .min(1, { message: 'Parol kerak!' })
    .min(6, { message: 'Parol kamida 6 ta belgi bo\'lishi kerak!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const { t } = useTranslation('messages');

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    brand_id: 'my_restaurant',
    username: 'qwerty1',
    password: 'Javohir11',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await signInWithPassword({
        brand_id: data.brand_id,
        username: data.username,
        password: data.password,
      });
      await checkUserSession?.();

      router.push(paths.menu.root);
    } catch (error) {
      console.error(error);
      const { key, fallback } = getErrorMessageKey(error);
      // Try to get translated message, fallback to default message if translation not available
      const translatedMessage = t(key, fallback);
      setErrorMessage(translatedMessage);
    }
  });

  const renderForm = () => (
    <Stack spacing={3}>
      <Field.Text
        name="brand_id"
        label="Brand ID"
        placeholder="my_restaurant2"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="username"
        label="Foydalanuvchi nomi"
        placeholder="sami"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Stack spacing={1.5}>
        <Field.Text
          label="Parol"
          name="password"
          placeholder="6+ belgi"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end" size="small">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      width={20}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Button
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Kirish..."
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        Kirish
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'rgba(79, 172, 254, 0.1)',
          }}
        >
          <Typography variant="h3" sx={{ color: '#4facfe' }}>
            M
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
          Hisobga kirish
        </Typography>

        {/* <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Hisobingiz yoqmi?{' '}
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signUp}
            sx={{ color: '#4facfe', textDecoration: 'none', fontWeight: 600 }}
          >
            Yaratish
          </Link>
        </Typography> */}
      </Box>

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      {!!errorMessage && (
        <Alert severity="error">
          {errorMessage}
        </Alert>
      )}
    </Stack>
  );
}
