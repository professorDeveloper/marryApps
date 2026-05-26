import type { TFunction } from 'i18next';
import type { IIngredientGroupFormData } from 'src/types/ingredient-group';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import {
  useGetIngredientGroup,
  useCreateIngredientGroup,
  useUpdateIngredientGroup,
  useDeleteIngredientGroup,
} from 'src/actions/ingredient-group';

import { GenericEditView } from 'src/components/generic-edit-view';

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

function translateSection(section: CardSection, t: TFunction): CardSection {
  const mapped = { ...section } as CardSection;
  if (typeof mapped.title === 'string' && mapped.title.includes('.')) {
    mapped.title = t(mapped.title as string, mapped.title as string);
  }
  if (Array.isArray(mapped.fields)) {
    mapped.fields = mapped.fields.map((f) => {
      const nf = { ...f };
      if (typeof nf.label === 'string' && nf.label.includes('.')) {
        nf.label = t(nf.label as string, nf.label as string);
      }
      return nf;
    });
  }
  return mapped;
}

function buildBasicInfoSection(): CardSection {
  return {
    id: 'basic',
    title: 'ingredientGroups.basicInfo',
    columns: 1,
    fields: [
      {
        key: 'name',
        label: 'common.name',
        type: 'text' as const,
        required: true,
        defaultValue: '',
      },
    ],
  };
}

function buildColorSection(): CardSection {
  return {
    id: 'color',
    title: 'ingredientGroups.colorInfo',
    columns: 1,
    fields: [
      {
        key: 'color_code',
        label: '',
        type: 'color' as const,
        defaultValue: 'var(--danger)',
        colors: COLOR_CODES,
      },
    ],
  };
}

function buildPictureSection(): CardSection {
  return {
    id: 'picture',
    title: 'ingredientGroups.pictureInfo',
    columns: 1,
    fields: [
      {
        key: 'picture_url',
        label: 'common.pictureUrl',
        type: 'image' as const,
        defaultValue: null,
        height: 250,
      },
    ],
  };
}

export interface IngredientGroupEditViewProps {
  isNew?: boolean;
}

export function IngredientGroupEditView({ isNew = false }: IngredientGroupEditViewProps) {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string | undefined;
  const { t } = useTranslation('menu');
  const { createIngredientGroup } = useCreateIngredientGroup();
  const { updateIngredientGroup } = useUpdateIngredientGroup();
  const { deleteIngredientGroup } = useDeleteIngredientGroup();

  const { ingredientGroup, ingredientGroupLoading } = useGetIngredientGroup(!isNew && id ? id : '');

  const BASIC_INFO_SECTION_T = useMemo(() => translateSection(buildBasicInfoSection(), t), [t]);
  const COLOR_SECTION_T = useMemo(() => translateSection(buildColorSection(), t), [t]);
  const IMAGE_SECTION_T = useMemo(() => translateSection(buildPictureSection(), t), [t]);

  const handleSubmit = useCallback(
    async (formData: Record<string, any>) => {
      try {
        if (!formData.name || !formData.name.trim()) {
          throw new Error(t('ingredientGroups.nameRequired'));
        }

        const groupData: IIngredientGroupFormData = {
          name: formData.name,
          color_code: formData.color_code || undefined,
          picture_url: formData.picture_url || undefined,
        };

        if (isNew) {
          await createIngredientGroup(groupData);
        } else if (id) {
          await updateIngredientGroup(id, groupData);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        router.push(paths.menu.ingredients_group.root);
      } catch (err) {
        console.error('Error saving ingredient group:', err);
        throw err;
      }
    },
    [isNew, id, t, createIngredientGroup, updateIngredientGroup, router]
  );

  const handleDelete = useCallback(async () => {
    try {
      if (id) {
        await deleteIngredientGroup(id);
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push(paths.menu.ingredients_group.root);
      }
    } catch (err) {
      console.error('Error deleting ingredient group:', err);
      throw err;
    }
  }, [id, deleteIngredientGroup, router]);

  const config: GenericEditViewConfig = useMemo(
    () => ({
      title: isNew ? t('ingredientGroups.new') : t('ingredientGroups.edit'),
      entityName: 'ingredientGroup',
      showBreadcrumbs: false,
      breadcrumbs: [
        { name: t('app'), href: paths.menu.root },
        { name: t('ingredientGroups.title'), href: paths.menu.ingredients_group.root },
        { name: isNew ? t('ingredientGroups.new') : t('ingredientGroups.edit'), href: '' },
      ],
      leftSidecard: IMAGE_SECTION_T,
      sections: [BASIC_INFO_SECTION_T, COLOR_SECTION_T],
      onSubmit: handleSubmit,
      onDelete: !isNew ? handleDelete : undefined,
      showDeleteButton: !isNew,
    }),
    [isNew, t, IMAGE_SECTION_T, BASIC_INFO_SECTION_T, COLOR_SECTION_T, handleSubmit, handleDelete]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <GenericEditView
          config={config}
          data={ingredientGroup || undefined}
          isNew={isNew}
          loading={!isNew && ingredientGroupLoading}
        />
      </Box>
    </Box>
  );
}

export function IngredientGroupEditViewWrapper({ isNew = false }: IngredientGroupEditViewProps) {
  return <IngredientGroupEditView isNew={isNew} />;
}
