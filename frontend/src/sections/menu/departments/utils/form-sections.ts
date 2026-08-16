/**
 * Form section builders for department edit view
 */

import type { CardSection } from 'src/components/generic-edit-view';

import { COLOR_CODES } from '../constants';

export function buildImageSection(): CardSection {
  return {
    id: 'image',
    title: 'departments.imageTitle',
    fields: [
      {
        key: 'picture_url',
        label: 'departments.imageUrl',
        type: 'image',
        defaultValue: null,
        height: 250,
      },
    ],
  };
}

export function buildBasicInfoSection(): CardSection {
  return {
    id: 'basic',
    title: 'departments.basicInfo',
    columns: 1,
    fields: [
      {
        key: 'name',
        label: 'departments.name',
        type: 'text',
        required: true,
        defaultValue: '',
      },
      {
        key: 'name_en',
        label: 'departments.nameEn',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        key: 'name_ru',
        label: 'departments.nameRu',
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        key: 'color_code',
        label: 'departments.color',
        type: 'color',
        required: true,
        defaultValue: 'var(--danger)',
        colors: COLOR_CODES,
      },
    ],
  };
}

export function buildColorAndStorageSection(
  storageOptions: Array<{ value: string; label: string }>
): CardSection {
  return {
    id: 'storage',
    title: 'departments.storageSection',
    columns: 1,
    fields: [
      {
        key: 'storage_id',
        label: 'departments.storageId',
        type: 'select',
        required: true,
        defaultValue: '',
        options: storageOptions,
      },
    ],
  };
}
