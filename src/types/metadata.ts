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
  HALLS = 'halls',
  CAFE_TABLES = 'cafetables',
  USERS = 'users',
}

export interface MetadataRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export type MetadataResponse = Partial<Record<MetadataEntity, MetadataRecord[]>>;

export type MetadataInclude =
  | MetadataEntity
  | { entity: MetadataEntity; fields: string[] };
