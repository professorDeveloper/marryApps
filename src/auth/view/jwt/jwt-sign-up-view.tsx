import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { Form, Field } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessageKey } from '../../utils';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;

export const SignUpSchema = z.object({
  fullName: z.string().min(1, { message: 'To\'liq ism kerak!' }),
  username: z.string().min(1, { message: 'Foydalanuvchi nomi kerak!' }),
  phoneNumber: z.string().min(1, { message: 'Telefon raqami kerak!' }),
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

export function JwtSignUpView() {
  const router = useRouter();
  const { t } = useTranslation('messages');

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignUpSchemaType = {
    fullName: '',
    username: '',
    phoneNumber: '',
    password: '',
    pincode: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await signUp({
        fullName: data.fullName,
        username: data.username,
        password: data.password,
        phoneNumber: data.phoneNumber,
        pincode: data.pincode,
        role: 'user',
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
    <Stack spacing={2}>
      <Field.Text
        name="fullName"
        label="To'liq ism"
        placeholder="Sami"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="username"
        label="Foydalanuvchi nomi"
        placeholder="sami"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="phoneNumber"
        label="Telefon raqami"
        placeholder="+998 95 774 91 22"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Parol
          </Typography>
        </Box>


        <Field.Text
          name="password"
          placeholder="Kamida 6 ta belgi"
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
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Hisob yaratish..."
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        Hisob yaratish
      </Button>

      <SignUpTerms />
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

        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Hisob yaratish
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Allaqachon akkauntingiz bormi?{' '}
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            sx={{ color: '#4facfe', textDecoration: 'none', fontWeight: 600 }}
          >
            Kirish
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
