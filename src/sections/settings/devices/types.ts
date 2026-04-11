export type DeviceType = 'category' | 'close_check';

export type ConnectionType = 'wlan' | 'cable';

export interface IDevice {
  id: number;
  ip: string;
  port: number;
  type: DeviceType;
  connection_type: ConnectionType;
  connected_entity_ids: string[];
  connected_entities?: Array<{ id: string; name: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface IDeviceFormData {
  ip: string;
  port: number;
  type: DeviceType;
  connection_type: ConnectionType;
  connected_entity_ids: string[];
}

export interface DeviceModalState {
  open: boolean;
  mode: 'create' | 'edit';
  device: IDevice | null;
}
