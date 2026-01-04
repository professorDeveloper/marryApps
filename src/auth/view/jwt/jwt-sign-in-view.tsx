import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Foydalanuvchi nomi kerak!' }),
  password: z
    .string()
    .min(1, { message: 'Parol kerak!' })
    .min(6, { message: 'Parol kamida 6 ta belgi bo\'lishi kerak!' }),
  pincode: z
    .string()
    .min(4, { message: 'PIN kod kamida 4 ta raqam bo\'lishi kerak!' })
    .max(4, { message: 'PIN kod 4 ta raqam bo\'lishi kerak!' })
    .regex(/^\d+$/, { message: 'PIN kod faqat raqamlardan iborat bo\'lishi kerak!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    username: 'sami',
    password: '',
    pincode: 'XXXX',
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
      await signInWithPassword({
        username: data.username,
        password: data.password,
        pincode: data.pincode
      });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Stack spacing={3}>
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

      <Field.Text
        name="pincode"
        label="PIN kod"
        placeholder="XXXX"
        type="password"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            inputProps: {
              maxLength: 4,
            }
          }
        }}
      />

      <Button
        fullWidth
        color="inherit"
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
          bgcolor: '#1a202c',
          '&:hover': { bgcolor: '#0f172a' },
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

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Hisobingiz yoqmi?{' '}
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signUp}
            sx={{ color: '#4facfe', textDecoration: 'none', fontWeight: 600 }}
          >
            Yaratish
          </Link>
        </Typography>
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
