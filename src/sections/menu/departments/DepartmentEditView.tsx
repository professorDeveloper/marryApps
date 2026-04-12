/**
 * Department edit/create view
 */

import type { GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useGetStorages, useGetDepartment } from 'src/actions/departments';

import { GenericEditView } from 'src/components/generic-edit-view';

import { translateSection, mapStoragesToOptions } from 'src/sections/menu/compounds/utilities';

import { useFormLogic } from './hooks/useFormLogic';
import {
  buildImageSection,
  buildBasicInfoSection,
  buildColorAndStorageSection,
} from './utils/form-sections';

export interface DepartmentEditViewProps {
  isNew?: boolean;
}

export function DepartmentEditView({ isNew = false }: DepartmentEditViewProps) {
  const params = useParams();
  const id = params.id as string | undefined;
  const { t } = useTranslation('menu');
  const { storages } = useGetStorages();
  const { department, departmentLoading } = useGetDepartment(!isNew && id ? id : '');

  const { handleSubmit, handleDelete } = useFormLogic({ isNew, id });

  const storageOptions = useMemo(
    () => mapStoragesToOptions(storages),
    [storages]
  );

  const IMAGE_SECTION_T = translateSection(buildImageSection(), t);
  const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(), t);
  const COLOR_AND_STORAGE_SECTION_T = translateSection(
    buildColorAndStorageSection(storageOptions),
    t
  );

  const config: GenericEditViewConfig = {
    title: isNew ? t('departments.new') : t('departments.edit'),
    entityName: 'department',
    showBreadcrumbs: false,
    breadcrumbs: [
      { name: t('app'), href: paths.menu.root },
      { name: t('departments.title'), href: paths.menu.product.root },
      { name: isNew ? t('departments.new') : t('departments.edit'), href: '' },
    ],
    leftSidecard: IMAGE_SECTION_T,
    sections: [
      BASIC_INFO_SECTION_T,
      COLOR_AND_STORAGE_SECTION_T,
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
          data={department}
          isNew={isNew}
          loading={!isNew && departmentLoading}
        />
      </Box>
    </Box>
  );
}
