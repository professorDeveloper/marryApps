import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo/logo';
import { Form, Field } from 'src/components/hook-form';

import { signUp } from 'src/auth/context/jwt';
import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessageKey } from 'src/auth/utils';
import { SignUpTerms } from 'src/auth/components/sign-up-terms';

// ----------------------------------------------------------------------

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;

export const SignUpSchema = z.object({
  fullName: z.string().min(1, { message: "To'liq ism kerak!" }),
  username: z.string().min(1, { message: 'Foydalanuvchi nomi kerak!' }),
  phoneNumber: z.string().min(1, { message: 'Telefon raqami kerak!' }),
  password: z
    .string()
    .min(1, { message: 'Parol kerak!' })
    .min(6, { message: "Parol kamida 6 ta belgi bo'lishi kerak!" }),
  pincode: z
    .string()
    .min(4, { message: 'PIN kod kamida 4 ta raqam bo\'lishi kerak!' })
    .max(4, { message: 'PIN kod 4 ta raqam bo\'lishi kerak!' })
    .regex(/^\d+$/, { message: "PIN kod faqat raqamlardan iborat bo'lishi kerak!" }),
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
  '& .MuiFormHelperText-root': { mx: 0 },
  '& .MuiFormLabel-root': { display: 'none' },
};

// ----------------------------------------------------------------------

export function SignUpForm() {
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

  const methods = useForm({ resolver: zodResolver(SignUpSchema), defaultValues });
  const { handleSubmit, formState: { isSubmitting } } = methods;

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
      setErrorMessage(t(key, fallback));
    }
  });

  const fieldLabel = (label: string) => (
    <Box sx={{
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: 'text.disabled',
      fontWeight: 700,
      mb: '8px',
    }}>
      {label}
    </Box>
  );

  const fieldWrap = { pb: '12px', pt: '16px', borderBottom: '1px solid var(--border)', transition: 'border-color 0.2s', '&:focus-within': { borderBottomColor: 'var(--accent)' } };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '56px 64px', justifyContent: 'space-between', overflowY: 'auto' }}>

      {/* Brand */}
      <Logo size={32} showLabel style={{ gap: '10px' }} />

      {/* Form area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '48px', py: '32px' }}>
        {/* Headline */}
        <Box>
          <Box component="h1" sx={{
            fontSize: 'clamp(24px, 2.8vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            m: 0,
          }}>
            Yangi hisob.<br />
            <Box component="span" sx={{ color: 'var(--accent)' }}>Boshlaylik.</Box>
          </Box>
          <Box component="p" sx={{ mt: '14px', fontSize: '14px', lineHeight: 1.55, color: 'text.secondary', maxWidth: '320px', m: '14px 0 0' }}>
            Allaqachon akkauntingiz bormi?{' '}
            <Box component={RouterLink} href={paths.auth.jwt.signIn} sx={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Kirish
            </Box>
          </Box>
        </Box>

        {/* Fields */}
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Box sx={fieldWrap}>
              {fieldLabel("To'liq ism")}
              <Field.Text name="fullName" placeholder="Sami" variant="standard" sx={underlineFieldSx} slotProps={{ input: { disableUnderline: true } }} />
            </Box>

            <Box sx={fieldWrap}>
              {fieldLabel('Foydalanuvchi nomi')}
              <Field.Text name="username" placeholder="sami" variant="standard" sx={underlineFieldSx} slotProps={{ input: { disableUnderline: true } }} />
            </Box>

            <Box sx={fieldWrap}>
              {fieldLabel('Telefon raqami')}
              <Field.Text name="phoneNumber" placeholder="+998 95 774 91 22" variant="standard" sx={underlineFieldSx} slotProps={{ input: { disableUnderline: true } }} />
            </Box>

            <Box sx={fieldWrap}>
              {fieldLabel('Parol')}
              <Field.Text
                name="password"
                placeholder="Kamida 6 ta belgi"
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

            <Box sx={fieldWrap}>
              {fieldLabel('PIN kod')}
              <Field.Text
                name="pincode"
                placeholder="XXXX"
                type="password"
                variant="standard"
                sx={underlineFieldSx}
                slotProps={{ input: { disableUnderline: true, inputProps: { maxLength: 4 } } }}
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
              <span>{isSubmitting ? 'Hisob yaratilmoqda...' : 'Hisob yaratish'}</span>
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

            <Box sx={{ mt: 1 }}>
              <SignUpTerms />
            </Box>

            {!!errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>
            )}
          </Box>
        </Form>
      </Box>

      {/* Footer */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', letterSpacing: '0.01em', color: 'text.disabled', fontWeight: 500,
      }}>
        <Box component="a" href="#" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>
          Yordam kerakmi?
        </Box>
        <span>v 4.2 · uz</span>
      </Box>
    </Box>
  );
}
