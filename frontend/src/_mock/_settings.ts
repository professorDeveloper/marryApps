import { _mock } from './_mock';

export const _settings = [
  // General
  { id: _mock.id(1), key: 'general.currency', label: 'Currency', value: 'USD' },
  { id: _mock.id(2), key: 'general.language', label: 'Language', value: 'en' },
  { id: _mock.id(3), key: 'general.timezone', label: 'Timezone', value: 'GMT' },
  { id: _mock.id(4), key: 'general.measurement', label: 'Measurement unit', value: 'Metric' },

  // Profile
  { id: _mock.id(5), key: 'profile.company', label: 'Company name', value: 'My Company' },
  { id: _mock.id(6), key: 'profile.email', label: 'Support email', value: 'support@example.com' },
  { id: _mock.id(7), key: 'profile.phone', label: 'Phone', value: '+1-555-0100' },

  // Notifications
  { id: _mock.id(8), key: 'notifications.email', label: 'Email notifications', value: true },
  { id: _mock.id(9), key: 'notifications.push', label: 'Push notifications', value: true },
  { id: _mock.id(10), key: 'notifications.sms', label: 'SMS alerts', value: false },

  // Integrations
  { id: _mock.id(11), key: 'integrations.slack', label: 'Slack enabled', value: true },
  { id: _mock.id(12), key: 'integrations.stripe', label: 'Stripe API Key', value: 'sk_test_XXXX' },
  { id: _mock.id(13), key: 'integrations.google.analytics', label: 'Google Analytics ID', value: 'UA-XXXX' },
];

export const _settingsGeneral = _settings.filter((s) => s.key.startsWith('general'));
export const _settingsProfile = _settings.filter((s) => s.key.startsWith('profile'));
export const _settingsNotifications = _settings.filter((s) => s.key.startsWith('notifications'));
export const _settingsIntegrations = _settings.filter((s) => s.key.startsWith('integrations'));
