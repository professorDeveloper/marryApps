/**
 * Custom hook for department form submission and deletion logic
 */

import { mutate } from 'swr';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';

import { endpoints } from 'src/lib/axios';
import {
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from 'src/actions/departments';

import type { DepartmentFormData } from '../types';
import { CACHE_SYNC_DELAY_MS, DELETE_SYNC_DELAY_MS } from 'src/sections/menu/compounds/utilities';

interface UseFormLogicProps {
  isNew: boolean;
  id?: string;
}

export function useFormLogic({ isNew, id }: UseFormLogicProps) {
  const router = useRouter();
  const { t } = useTranslation('menu');
  const { createDepartment } = useCreateDepartment();
  const { updateDepartment } = useUpdateDepartment();
  const { deleteDepartment } = useDeleteDepartment();
  const { createTranslation, updateTranslation } = useTranslationsAPI();

  const handleSubmit = useCallback(
    async (formData: Record<string, any>) => {
      try {
        // Validate required fields
        if (!formData.name || !formData.name.trim()) {
          throw new Error(t('departments.nameRequired'));
        }
        if (!formData.color_code) {
          throw new Error(t('departments.colorRequired'));
        }
        if (!formData.storage_id) {
          throw new Error(t('departments.storageRequired'));
        }

        // Create or update translation if translations are provided
        let name_i18n = formData.name_i18n;
        if (formData.name_en || formData.name_ru || formData.name) {
          const translationData: any = {
            en: formData.name_en || '',
            ru: formData.name_ru || '',
            uz: formData.name || '', // Primary name is always Uzbek
          };

          if (!isNew && name_i18n) {
            // Update existing translation when editing
            await updateTranslation(name_i18n, translationData);
            // Revalidate translations cache to reflect the update immediately
            await mutate(endpoints.translations.list);
          } else if (isNew && !name_i18n) {
            // Create new translation when creating
            const translationResult = await createTranslation(translationData);
            name_i18n = translationResult.id;
          }
        }

        const departmentData: DepartmentFormData = {
          name: formData.name,
          name_i18n,
          color_code: formData.color_code || '',
          picture_url: formData.picture_url || '',
          storage_id: formData.storage_id,
        };

        if (isNew) {
          await createDepartment(departmentData);
          // Revalidate departments list to show the new department
          await mutate(endpoints.department.list);
          await mutate(endpoints.translations.list);
        } else if (id) {
          await updateDepartment(id, departmentData);
          // Revalidate department cache to reflect the update immediately
          await mutate(endpoints.department.details(id));
          await mutate(endpoints.department.list);
        }

        // Add small delay to ensure SWR cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, CACHE_SYNC_DELAY_MS));

        // Only redirect if we're not already navigating away
        router.push(paths.menu.product.root);
      } catch (err) {
        console.error('Error saving department:', err);
        // Re-throw the error to be handled by the GenericEditView
        // This ensures loading state is properly reset
        throw err;
      }
    },
    [isNew, id, createDepartment, updateDepartment, router, t, createTranslation, updateTranslation]
  );

  const handleDelete = useCallback(async () => {
    try {
      if (id) {
        await deleteDepartment(id);
        // Add small delay to ensure SWR cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, DELETE_SYNC_DELAY_MS));
        router.push(paths.menu.product.root);
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      throw err;
    }
  }, [id, deleteDepartment, router]);

  return {
    handleSubmit,
    handleDelete,
  };
}
