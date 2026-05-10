import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { SimpleLayout } from 'src/layouts/simple';
import { ServerErrorIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export function ErrorView() {
  const { t } = useTranslation('menu');
  
  return (
    <SimpleLayout
      cssVars={{}}
      slotProps={{
        content: { compact: true },
      }}
    >
      <Container component={MotionContainer}>
        <m.div variants={varBounce('in')}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {t('error.title', 'Something went wrong')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary' }}>
            {t('error.description', 'We apologize for the inconvenience. An unexpected error has occurred. Please try refreshing the page or contact support if the problem persists.')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <ServerErrorIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>

        <Button component={RouterLink} href="/" size="large" variant="contained">
          {t('error.goHome', 'Go back to home')}
        </Button>
      </Container>
    </SimpleLayout>
  );
}
