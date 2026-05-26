import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Form, Field } from 'src/components/hook-form';
import { Logo } from 'src/components/logo/logo';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessageKey } from 'src/auth/utils';
import { signInWithPassword } from 'src/auth/context/jwt';
import { Eye, EyeOff } from 'lucide-react';

// ----------------------------------------------------------------------

export type SignInSchemaType = z.infer<typeof SignInSchema>;

export const SignInSchema = z.object({
  brand_id: z.string().min(1, { message: 'Brand ID kerak!' }),
  username: z.string().min(1, { message: 'Foydalanuvchi nomi kerak!' }),
  password: z
    .string()
    .min(1, { message: 'Parol kerak!' })
    .min(6, { message: "Parol kamida 6 ta belgi bo'lishi kerak!" }),
});

// ----------------------------------------------------------------------

const underlineFieldSx = {
  '& .MuiInputBase-root': {
    borderRadius: 0,
    bgcolor: 'transparent',
    '&::before': { borderBottom: '1px solid var(--border)', borderBottomStyle: 'solid' },
    '&::after': { borderBottom: '2px solid var(--accent)' },
    '&:hover:not(.Mui-disabled):not(.Mui-error)::before': { borderBottom: '1px solid var(--border-strong)' },
  },
  '& .MuiInputBase-input': {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    pb: '10px',
    pt: '4px',
  },
  '& .MuiFormHelperText-root': { display: 'none' },
  '& .MuiFormLabel-root': { display: 'none' },
};

// ----------------------------------------------------------------------

export function SignInForm() {
  const router = useRouter();
  const { t } = useTranslation('messages');

  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = { brand_id: '', username: '', password: '' };

  const methods = useForm({ resolver: zodResolver(SignInSchema), defaultValues });
  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await signInWithPassword({ brand_id: data.brand_id, username: data.username, password: data.password });
      await checkUserSession?.();
      router.push(paths.menu.sign);
    } catch (error) {
      console.error(error);
      const { key, fallback } = getErrorMessageKey(error);
      setErrorMessage(t(key, fallback));
    }
  });

  const { formState: { errors } } = methods;

  const fieldLabel = (label: string, fieldName: keyof SignInSchemaType) => (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', mb: '8px' }}>
      <Box sx={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'text.disabled',
        fontWeight: 700,
      }}>
        {label}
      </Box>
      {errors[fieldName] && (
        <Box sx={{ fontSize: '11px', color: 'error.main', fontWeight: 500 }}>
          {errors[fieldName]?.message}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '56px 64px', justifyContent: 'space-between' }}>

      {/* Brand */}
      <Logo size={72} showLabel style={{ gap: '10px' }} />

      {/* Form area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Headline */}
        <Box>
          <Box component="h1" sx={{
            fontSize: 'clamp(26px, 3vw, 34px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            m: 0,
          }}>
            Xush kelibsiz.<br />
            <Box component="span" sx={{ color: 'var(--accent)' }}>Ishga kirishaylik.</Box>
          </Box>
          <Box component="p" sx={{ mt: '14px', fontSize: '14px', lineHeight: 1.55, color: 'text.secondary', maxWidth: '320px', m: '14px 0 0' }}>
            Menyu, xodimlar va hisobotlarni boshqarish uchun tizimga kiring.
          </Box>
        </Box>

        {/* Fields */}
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Brand ID */}
            <Box sx={{ pb: '12px', pt: '16px', borderBottom: '1px solid var(--border)', transition: 'border-color 0.2s', '&:focus-within': { borderBottomColor: 'var(--accent)' } }}>
              {fieldLabel('Brand ID', 'brand_id')}
              <Field.Text
                name="brand_id"
                placeholder="brand-id"
                variant="standard"
                sx={underlineFieldSx}
                slotProps={{ input: { disableUnderline: true } }}
              />
            </Box>

            {/* Username */}
            <Box sx={{ pb: '12px', pt: '16px', borderBottom: '1px solid var(--border)', transition: 'border-color 0.2s', '&:focus-within': { borderBottomColor: 'var(--accent)' } }}>
              {fieldLabel('Foydalanuvchi nomi', 'username')}
              <Field.Text
                name="username"
                placeholder="username"
                variant="standard"
                sx={underlineFieldSx}
                slotProps={{ input: { disableUnderline: true } }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ pb: '12px', pt: '16px', borderBottom: '1px solid var(--border)', transition: 'border-color 0.2s', '&:focus-within': { borderBottomColor: 'var(--accent)' } }}>
              {fieldLabel('Parol', 'password')}
              <Field.Text
                name="password"
                placeholder="6+ belgi"
                type={showPassword.value ? 'text' : 'password'}
                variant="standard"
                sx={underlineFieldSx}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={showPassword.onToggle} edge="end" size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                          {showPassword.value ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            {/* CTA */}
            <Box
              component="button"
              type="submit"
              disabled={isSubmitting}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: '24px',
                height: '56px',
                mt: '28px',
                bgcolor: 'var(--accent)',
                color: 'var(--accent-fg)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                width: '100%',
                border: 0,
                cursor: 'pointer',
                transition: 'filter 0.12s, transform 0.06s',
                '&:hover': { filter: 'brightness(1.07)' },
                '&:active': { transform: 'translateY(0.5px)' },
                '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
              }}
            >
              <span>{isSubmitting ? 'Kirish...' : 'Mary Ai ga kirish'}</span>
              <Box sx={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                bgcolor: 'var(--accent-fg)',
                color: 'var(--accent)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Box>
            </Box>

            {!!errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>
            )}
          </Box>
        </Form>
      </Box>

      {/* Footer */}
      <Box sx={{ fontSize: '12px', letterSpacing: '0.01em', color: 'text.disabled', fontWeight: 500 }}>
        <Box component="a" href="#" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
          Kirishda muammo bormi?
        </Box>
      </Box>
    </Box>
  );
}
