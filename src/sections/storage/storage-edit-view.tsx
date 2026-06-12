import type { IStorageFormData } from 'src/types/departments.tsx';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';

import { useGetStorage, useCreateStorage, useDeleteStorage, useUpdateStorage, useUpdateTranslation } from 'src/actions/departments';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

const COLOR_CODES = [
  'var(--danger)', // Error/Red
  '#60A5FA', // Info/Blue
  'var(--success)', // Success/Green
  'var(--warning)', // Warning/Yellow
  'var(--text-2)', // Secondary/Violet
  'var(--accent)', // Primary/Orange
  'color-mix(in oklch, var(--danger) 20%, transparent)', // Light Error
  'var(--danger)', // Danger/Dark Red
  'color-mix(in oklch, #60A5FA 20%, transparent)', // Light Info
  'color-mix(in oklch, var(--warning) 40%, transparent)', // Light Warning
  'var(--text)', // Black
  'var(--accent-fg)', // White
];

export function WarehouseEditView({ isNew = false }: { isNew?: boolean }) {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string | undefined;

  const { createStorage } = useCreateStorage();
  const { updateStorage } = useUpdateStorage();
  const { deleteStorage } = useDeleteStorage();
  const { updateTranslation } = useUpdateTranslation();
  const { createTranslation } = useTranslationsAPI();

  const { storage, storageLoading } = useGetStorage(!isNew && id ? id : '');

  const handleSubmit = useCallback(
    async (formData: Record<string, any>) => {
      if (!formData.name || !String(formData.name).trim()) {
        throw new Error('Name is required');
      }

      // Create or update translation if translations are provided
      let name_i18n = formData.name_i18n;
      if (formData.name_en || formData.name_ru) {
        const translationData: any = {
          en: formData.name_en || formData.name || '',
          ru: formData.name_ru || formData.name || '',
          uz: formData.name || '', // Primary name is always Uzbek
        };

        if (name_i18n) {
          // Update existing translation
          await updateTranslation(name_i18n, translationData);
        } else {
          // Create new translation
          const translationResult = await createTranslation(translationData);
          name_i18n = translationResult.id;
        }
      }

      const payload: IStorageFormData = {
        name: String(formData.name).trim(),
        name_i18n,
        picture_url: formData.picture_url ?? undefined,
        color_code: formData.color_code ?? undefined,
      };

      if (isNew) {
        await createStorage(payload);
      } else if (id) {
        await updateStorage(id, payload);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(paths.warehouse.storage.root);
    },
    [createStorage, createTranslation, id, isNew, router, updateStorage, updateTranslation]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteStorage(id);
    await new Promise((resolve) => setTimeout(resolve, 300));
    router.push(paths.warehouse.storage.root);
  }, [deleteStorage, id, router]);

  const IMAGE: CardSection = {
    id: 'image',
    title: t('warehouse.imageTitle'),
    fields: [{ key: 'picture_url', label: t('warehouse.picture'), type: 'image', defaultValue: null, height: 250 }],
  };

  const BASIC: CardSection = {
    id: 'basic',
    title: t('warehouse.basicInfo'),
    columns: 1,
    fields: [
      {
        key: 'name',
        label: t('warehouse.name'),
        type: 'text',
        required: true,
        defaultValue: '',
        // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
      },
      {
        key: 'name_en',
        label: t('warehouse.nameEn'),
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        key: 'name_ru',
        label: t('warehouse.nameRu'),
        type: 'text',
        required: false,
        defaultValue: '',
      },
      // {
      //   key: 'branch_id',
      //   label: t('warehouse.branch'),
      //   type: 'select',
      //   required: true,
      //   defaultValue: '',
      //   options: branchOptions,
      // },
      {
        key: 'color_code',
        label: t('warehouse.color'),
        type: 'color',
        defaultValue: 'var(--danger)',
        colors: COLOR_CODES,
      },
    ],
  };

  const config: GenericEditViewConfig = {
    title: isNew ? t('warehouse.newStorage') : t('warehouse.editStorage'),
    entityName: 'storage',
    showBreadcrumbs: false,
    breadcrumbs: [
      { name: t('overview.storages.title'), href: paths.storage.storages.root },
      { name: t('overview.warehouse.storage'), href: paths.warehouse.storage.root },
      { name: isNew ? t('warehouse.new') : t('warehouse.edit'), href: '' },
    ],
    leftSidecard: IMAGE,
    sections: [BASIC],
    onSubmit: handleSubmit,
    onDelete: !isNew ? handleDelete : undefined,
    showDeleteButton: !isNew,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <CustomBreadcrumbs heading={config.title} links={config.breadcrumbs} sx={{ mb: 3 }} />
        <GenericEditView
          config={config}
          isNew={isNew}
          data={storage}
          loading={!isNew && storageLoading}
        />
      </Box>
    </Box>
  );
}

