export const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

export const DEVICE_TYPES = [
  { value: 'category' as const, label: 'Category' },
  { value: 'close_check' as const, label: 'Close Check' },
] as const;

export const CONNECTION_TYPES = [
  { value: 'wlan' as const, label: 'WLAN' },
  { value: 'cable' as const, label: 'CABLE' },
] as const;
