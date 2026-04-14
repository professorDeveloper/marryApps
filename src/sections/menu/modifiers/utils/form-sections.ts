/**
 * Form section builders for modifier edit view
 */

import type { CardSection } from 'src/components/generic-edit-view';

export function buildImageSection(): CardSection {
  return {
    id: 'image',
    title: 'modifiers.imageTitle',
    fields: [
      {
        key: 'picture_url',
        label: 'modifiers.imageUrl',
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
    title: 'modifiers.basicInfo',
    columns: 1,
    fields: [
      {
        key: 'name',
        label: 'modifiers.name',
        type: 'text',
        required: true,
        defaultValue: '',
      },
      {
        key: 'code',
        label: 'modifiers.code',
        type: 'text',
        required: true,
        defaultValue: '',
      },
      {
        key: 'description',
        label: 'modifiers.description',
        type: 'textarea',
        required: false,
        defaultValue: '',
      },
      {
        key: 'is_active',
        label: 'modifiers.isActive',
        type: 'switch',
        required: false,
        defaultValue: true,
      },
    ],
  };
}
