import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { themeConfig, ThemeProvider } from 'src/theme';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';
import { I18nProvider } from 'src/locales/i18n-provider';
import { LocalizationProvider } from 'src/locales/localization-provider';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <I18nProvider>
      <AuthProvider>
        <SettingsProvider defaultSettings={defaultSettings}>
          <ThemeProvider
            modeStorageKey={themeConfig.modeStorageKey}
            defaultMode={themeConfig.defaultMode}
          >
            <LocalizationProvider>
              <MotionLazy>
                <ProgressBar />
                <SettingsDrawer defaultSettings={defaultSettings} />
                {children}
              </MotionLazy>
            </LocalizationProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
