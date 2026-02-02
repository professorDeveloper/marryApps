import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import type { IStorageFormData } from 'src/types/departments.tsx';
import { Box } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useCreateStorage, useDeleteStorage, useGetStorage, useUpdateStorage } from 'src/actions/departments';
import { useGetBranches } from 'src/actions/branches';
import { useTranslationsAPI } from 'src/hooks/use-translations-api';

const COLOR_CODES = [
  '#FF4842', // Red
  '#1890FF', // Blue
  '#00AB55', // Green
  '#FFC107', // Yellow
  '#7F00FF', // Violet
  '#FF6B35', // Orange
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FFD700', // Gold
  '#8B4513', // Saddle Brown
  '#000000', // Black
  '#FFFFFF', // White
];

export function WarehouseEditView({ isNew = false }: { isNew?: boolean }) {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string | undefined;

  const { createStorage } = useCreateStorage();
  const { updateStorage } = useUpdateStorage();
  const { deleteStorage } = useDeleteStorage();
  const { createTranslation } = useTranslationsAPI();

  const { storage, storageLoading } = useGetStorage(!isNew && id ? id : '');
  const { branches } = useGetBranches();

  const branchOptions = useMemo(
    () =>
      (branches || []).map((b) => ({
        value: b.id,
        label: b.name || b.id,
      })),
    [branches]
  );

  const handleSubmit = useCallback(
    async (formData: Record<string, any>) => {
      if (!formData.name || !String(formData.name).trim()) {
        throw new Error('Name is required');
      }
      if (!formData.branch_id) {
        throw new Error('Branch is required');
      }

      // Create translation if translations are provided
      let name_i18n = formData.name_i18n;
      if (!name_i18n && (formData.name_en || formData.name_ru)) {
        // Create translation with provided language-specific names
        const translationData: any = {
          en: formData.name_en || formData.name || '',
          ru: formData.name_ru || formData.name || '',
          uz: formData.name || '', // Primary name is always Uzbek
        };

        const translationResult = await createTranslation(translationData);
        name_i18n = translationResult.id;
      }

      const payload: IStorageFormData = {
        name: String(formData.name).trim(),
        name_i18n,
        branch_id: formData.branch_id,
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
    [createStorage, createTranslation, id, isNew, router, updateStorage]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteStorage(id);
    await new Promise((resolve) => setTimeout(resolve, 300));
    router.push(paths.warehouse.storage.root);
  }, [deleteStorage, id, router]);

  const IMAGE: CardSection = {
    id: 'image',
    title: t('warehouse.imageTitle', 'Warehouse Image'),
    fields: [{ key: 'picture_url', label: t('warehouse.picture', 'Picture'), type: 'image', defaultValue: null, height: 250 }],
  };

  const BASIC: CardSection = {
    id: 'basic',
    title: t('warehouse.basicInfo', 'Basic Information'),
    columns: 1,
    fields: [
      {
        key: 'name',
        label: t('warehouse.name', 'Name'),
        type: 'text',
        required: true,
        defaultValue: '',
        // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
      },
      {
        key: 'name_en',
        label: t('warehouse.nameEn', 'Name (English)'),
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        key: 'name_ru',
        label: t('warehouse.nameRu', 'Name (Russian)'),
        type: 'text',
        required: false,
        defaultValue: '',
      },
      {
        key: 'branch_id',
        label: t('warehouse.branch', 'Branch'),
        type: 'select',
        required: true,
        defaultValue: '',
        options: branchOptions,
      },
      {
        key: 'color_code',
        label: t('warehouse.color', 'Color'),
        type: 'color',
        defaultValue: '#FF4842',
        colors: COLOR_CODES,
      },
    ],
  };

  const config: GenericEditViewConfig = {
    title: isNew ? t('warehouse.newStorage', 'New storage') : t('warehouse.editStorage', 'Edit storage'),
    entityName: 'storage',
    showBreadcrumbs: false,
    breadcrumbs: [
      { name: t('app', 'Menu'), href: paths.menu.root },
      { name: t('warehouse.title', 'Warehouse'), href: paths.menu.inventory.root },
      { name: isNew ? t('warehouse.new', 'New') : t('warehouse.edit', 'Edit'), href: '' },
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
