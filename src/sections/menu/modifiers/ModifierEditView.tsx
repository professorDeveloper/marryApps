/**
 * Modifier edit/create view
 */

import type { GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useGetModifier } from 'src/actions/modifiers';

import { GenericEditView } from 'src/components/generic-edit-view';

import { translateSection } from 'src/sections/menu/compounds/utilities';

import { useFormLogic } from './hooks/useFormLogic';
import {
  buildImageSection,
  buildBasicInfoSection,
} from './utils/form-sections';

export interface ModifierEditViewProps {
  isNew?: boolean;
}

export function ModifierEditView({ isNew = false }: ModifierEditViewProps) {
  const params = useParams();
  const id = params.id as string | undefined;
  const { t } = useTranslation('menu');
  const { modifier, modifierLoading } = useGetModifier(!isNew && id ? id : '');

  const { handleSubmit, handleDelete } = useFormLogic({ isNew, id });

  const IMAGE_SECTION_T = translateSection(buildImageSection(), t);
  const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(), t);

  const config: GenericEditViewConfig = {
    title: isNew ? t('modifiers.new') : t('modifiers.edit'),
    entityName: 'modifier',
    showBreadcrumbs: false,
    breadcrumbs: [
      { name: t('app'), href: paths.menu.root },
      { name: t('modifiers.title'), href: paths.menu.modifiers.root },
      { name: isNew ? t('modifiers.new') : t('modifiers.edit'), href: '' },
    ],
    leftSidecard: IMAGE_SECTION_T,
    sections: [
      BASIC_INFO_SECTION_T,
    ],
    onSubmit: handleSubmit,
    onDelete: !isNew ? handleDelete : undefined,
    showDeleteButton: !isNew,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <GenericEditView
          config={config}
          data={modifier}
          isNew={isNew}
          loading={!isNew && modifierLoading}
        />
      </Box>
    </Box>
  );
}
