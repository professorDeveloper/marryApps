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
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { Logo } from 'src/components/logo/logo';
import { m } from 'framer-motion';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessageKey } from 'src/auth/utils';
import { signInWithPassword } from 'src/auth/context/jwt';
import { Eye, EyeOff, Lock, User, Building2 } from 'lucide-react';

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

const orangeFieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'var(--color-border)' },
    '&:hover fieldset': { borderColor: 'var(--color-border-strong)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)', borderWidth: '1px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' },
};

// ----------------------------------------------------------------------

export function SignInForm() {
  const router = useRouter();
  const { t } = useTranslation('messages');
  const theme = useTheme();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    brand_id: '',
    username: '',
    password: '',
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

      router.push(paths.menu.sign);
    } catch (error) {
      console.error(error);
      const { key, fallback } = getErrorMessageKey(error);
      const translatedMessage = t(key, fallback);
      setErrorMessage(translatedMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ ml: 1, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.4, fontWeight: 700 }}>Brand ID</Typography>
        <Field.Text
          name="brand_id"
          placeholder="Brand ID"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Building2 size={20} style={{ opacity: 0.2 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ ml: 1, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.4, fontWeight: 700 }}>Foydalanuvchi nomi</Typography>
        <Field.Text
          name="username"
          placeholder="Username"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <User size={20} style={{ opacity: 0.2 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ ml: 1, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.4, fontWeight: 700 }}>Parol</Typography>
        <Field.Text
          name="password"
          placeholder="6+ belgi"
          type={showPassword.value ? 'text' : 'password'}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} style={{ opacity: 0.2 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end" size="small">
                    {showPassword.value ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              )
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Kirish..."
        sx={{ py: 2, fontSize: '1rem', mt: 1 }}
      >
        Kirish
      </Button>
    </Box>
  );

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
        <Logo style={{ marginBottom: '24px', transform: 'scale(1.25)' }} size={80} />
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'primary.main', 
            fontWeight: 600, 
            letterSpacing: 2, 
            textTransform: 'uppercase',
            fontSize: '0.7rem'
          }}
        >
          Hisobga kirish
        </Typography>
      </Box>

      <Card sx={{ 
        p: { xs: 3, md: 5 }, 
        backdropFilter: 'blur(20px)', 
        bgcolor: 'transparent',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <Form methods={methods} onSubmit={onSubmit}>
          {renderForm()}
        </Form>
      </Card>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ 
        mt: 6, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 1.5, 
        opacity: 0.3, 
        cursor: 'pointer',
        '&:hover': { opacity: 1 },
        transition: '0.3s'
      }}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Нужна помощь?</Typography>
        <Box sx={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          bgcolor: 'primary.main',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.5)', opacity: 0.5 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          animation: 'pulse 2s infinite' 
        }} />
      </Box>
    </m.div>
  );
}
