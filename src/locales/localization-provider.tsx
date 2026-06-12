// Keep in sync with the adapterLocale values in src/locales/locales-config.ts
// (en, uz, ru). Importing locales that aren't offered just bloats the bundle;
// missing ones silently fall back to English date formatting.
import 'dayjs/locale/en';
import 'dayjs/locale/uz';
import 'dayjs/locale/ru';

import dayjs from 'dayjs';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider as Provider } from '@mui/x-date-pickers/LocalizationProvider';

import { useTranslate } from './use-locales';

// ---------------------------------------------------------------------- 

type Props = {
  children: React.ReactNode;
};

export function LocalizationProvider({ children }: Props) {
  const { currentLang } = useTranslate();

  dayjs.locale(currentLang.adapterLocale);

  return (
    <Provider dateAdapter={AdapterDayjs} adapterLocale={currentLang.adapterLocale}>
      {children}
    </Provider>
  );
}
