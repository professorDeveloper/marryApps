import type { DeviceType } from '../types';

import { IP_REGEX } from '../constants';

export function isValidIp(value: string): boolean {
  return IP_REGEX.test(value);
}

export function validateIpAddress(value: string): string | true {
  if (!value) return 'IP address is required';
  if (!isValidIp(value)) return 'Invalid IP address format (e.g. 192.168.1.1)';
  return true;
}

export function validatePort(value: number): string | true {
  if (!value) return 'Port is required';
  if (value < 1 || value > 65535) return 'Port must be between 1 and 65535';
  return true;
}

export function validateConnectedEntities(value: string[], type: DeviceType): string | true {
  if (type === 'category' && (!value || value.length === 0)) {
    return 'At least one connected entity is required for category type';
  }
  return true;
}
