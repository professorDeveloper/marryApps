export interface IBranchItem {
  id: string;
  name: string;
  name_i18n?: any;
  address?: string | null;
  phone?: string | null;
  color_code?: string | null;
  picture_url?: string | null;
  created_at?: string;
  updated_at?: string;
  // Some backends may return this field name too
  branch_id?: string;
}

export interface IBranchFormData {
  name: string;
  address?: string | null;
  phone?: string | null;
  color_code?: string | null;
  picture_url?: string | null;
}


