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

export type IModifierCalculation = {
  id: string;
  modifier_id: string;
  ingredient_id?: string | null;
  compound_to_add_id?: string | null;
  quantity: string;
  ingredient?: { id: string; name: string; measurement?: string };
  compound?: { id: string; name: string; measurement?: string };
};

export type IModifierWithCalculations = IModifierItem & {
  calculations: IModifierCalculation[];
};

export type IModifierRecipePayload = {
  modifier: {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    name_i18n?: string;
    picture_url?: string;
  };
  ingredient_calculations: { ingredient_id: string; quantity: string }[];
  compound_calculations: { compound_to_add_id: string; quantity: string }[];
};
