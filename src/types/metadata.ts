export enum MetadataEntity {
  STORAGES = 'storages',
  DEPARTMENTS = 'departments',
  CATEGORIES = 'categories',
  INGREDIENT_GROUPS = 'ingredient_groups',
  INGREDIENTS = 'ingredients',
  COMPOUNDS = 'compounds',
  MENUS = 'menus',
  MODIFIERS = 'modifiers',
  DEDICATION_GROUPS = 'dedication_groups',
  TRANSACTION_GROUPS = 'transaction_groups',
}

export interface MetadataRecord {
  id: string;
  name: string;
}

export type MetadataResponse = Partial<Record<MetadataEntity, MetadataRecord[]>>;
