// Domain types for Modifiers API

export type IModifierItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  name_i18n: string;
  picture_url: string;
  created_at: string;
  updated_at: string;
};

export type IModifierFormData = {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  name_i18n?: string;
  picture_url?: string;
};
