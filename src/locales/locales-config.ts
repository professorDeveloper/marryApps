import type { InitOptions } from 'i18next';
import type { Theme, Components } from '@mui/material/styles';

import resourcesToBackend from 'i18next-resources-to-backend';

// MUI Core Locales
import {
  ruRU as ruRUCore,
} from '@mui/material/locale';
// MUI Date Pickers Locales
import {
  enUS as enUSDate,
  ruRU as ruRUDate,
} from '@mui/x-date-pickers/locales';
// MUI Data Grid Locales
import {
  enUS as enUSDataGrid,
  ruRU as ruRUDataGrid,
} from '@mui/x-data-grid/locales';

// ----------------------------------------------------------------------

// Supported languages
export const supportedLngs = ['en', 'fr', 'vi', 'cn', 'ar', 'uz', 'uz-Latn', 'uz-Cyrl', 'ru'] as const;
export type LangCode = (typeof supportedLngs)[number];

// Fallback and default namespace
export const fallbackLng: LangCode = 'en';
export const defaultNS = 'common';

// Storage config
export const storageConfig = {
  cookie: { key: 'i18next', autoDetection: false },
  localStorage: { key: 'i18nextLng', autoDetection: false },
} as const;

// ----------------------------------------------------------------------

/**
 * @countryCode https://flagcdn.com/en/codes.json
 * @adapterLocale https://github.com/iamkun/dayjs/tree/master/src/locale
 * @numberFormat https://simplelocalize.io/data/locales/
 */

export type LangOption = {
  value: LangCode;
  label: string;
  countryCode: string;
  adapterLocale?: string;
  numberFormat: { code: string; currency: string };
  systemValue?: { components: Components<Theme> };
};

export const allLangs: LangOption[] = [
  {
    value: 'en',
    label: 'English',
    countryCode: 'GB',
    adapterLocale: 'en',
    numberFormat: { code: 'en-US', currency: 'USD' },
    systemValue: {
      components: { ...enUSDate.components, ...enUSDataGrid.components },
    },
  },
  {
    value: 'uz-Latn',
    label: 'O\'zbek (Lotin)',
    countryCode: 'UZ',
    adapterLocale: 'uz',
    numberFormat: { code: 'uz-UZ', currency: 'UZS' },
  },
  {
    value: 'uz-Cyrl',
    label: 'Ўзбек (Кирил)',
    countryCode: 'UZ',
    adapterLocale: 'uz',
    numberFormat: { code: 'uz-UZ', currency: 'UZS' },
  },
  {
    value: 'ru',
    label: 'Русский',
    countryCode: 'RU',
    adapterLocale: 'ru',
    numberFormat: { code: 'ru-RU', currency: 'RUB' },
    systemValue: {
      components: { ...ruRUCore.components, ...ruRUDate.components, ...ruRUDataGrid.components },
    },
  },
];

// ----------------------------------------------------------------------

export const i18nResourceLoader = resourcesToBackend(
  (lang: LangCode, namespace: string) => import(`./langs/${lang}/${namespace}.json`)
);

const reportedMissingKeys = new Set<string>();

function reportMissingKey(lngs: readonly string[] | string, ns: string, key: string, fallbackValue?: string) {
  const lngList = Array.isArray(lngs) ? lngs : [lngs];
  const fingerprint = `${lngList.join(',')}::${ns}::${key}`;
  if (reportedMissingKeys.has(fingerprint)) return;
  reportedMissingKeys.add(fingerprint);

  const payload = {
    languages: lngList,
    namespace: ns,
    key,
    fallback: fallbackValue,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };

  // eslint-disable-next-line no-console
  console.warn('[i18n missing]', payload);

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/__missing-i18n', new Blob([body], { type: 'application/json' }));
    } else if (typeof fetch !== 'undefined') {
      fetch('/__missing-i18n', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* swallow — logging must never break the app */
  }
}

export function i18nOptions(lang = fallbackLng, namespace = defaultNS): InitOptions {
  return {
    debug: import.meta.env.DEV,
    supportedLngs,
    fallbackLng,
    lng: lang,
    /********/
    fallbackNS: defaultNS,
    defaultNS,
    ns: [namespace, 'common', 'menu', 'navbar', 'messages', 'layout'],
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      reportMissingKey(lngs, ns, key, fallbackValue);
    },
  };
}

export function getCurrentLang(lang?: string): LangOption {
  const fallbackLang = allLangs.find((l) => l.value === fallbackLng) ?? allLangs[0];

  if (!lang) {
    return fallbackLang;
  }

  return allLangs.find((l) => l.value === lang) ?? fallbackLang;
}
