// Form data types for Modifiers feature

export interface ModifierFormData {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  name_i18n?: string;
  picture_url?: string;
}

export interface CellRenderParams {
  row: any;
}
