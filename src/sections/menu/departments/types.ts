/**
 * Menu feature types - departments and related data structures
 */

export interface DepartmentFormData {
  name: string;
  name_en?: string;
  name_ru?: string;
  name_i18n?: string;
  color_code: string;
  picture_url?: string;
  storage_id: string;
}

export interface CellRenderParams {
  row: any;
}
