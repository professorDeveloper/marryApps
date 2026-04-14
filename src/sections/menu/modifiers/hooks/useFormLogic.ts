/**
 * Custom hook for modifier form submission and deletion logic
 */

import { mutate } from 'swr';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints } from 'src/lib/axios';
import {
  useCreateModifier,
  useUpdateModifier,
  useDeleteModifier,
} from 'src/actions/modifiers';

import type { ModifierFormData } from '../types';
import { CACHE_SYNC_DELAY_MS, DELETE_SYNC_DELAY_MS } from 'src/sections/menu/compounds/utilities';

interface UseFormLogicProps {
  isNew: boolean;
  id?: string;
}

export function useFormLogic({ isNew, id }: UseFormLogicProps) {
  const router = useRouter();
  const { t } = useTranslation('menu');
  const { createModifier } = useCreateModifier();
  const { updateModifier } = useUpdateModifier();
  const { deleteModifier } = useDeleteModifier();

  const handleSubmit = useCallback(
    async (formData: Record<string, any>) => {
      try {
        // Validate required fields
        if (!formData.name || !formData.name.trim()) {
          throw new Error(t('modifiers.nameRequired'));
        }
        if (!formData.code || !formData.code.trim()) {
          throw new Error(t('modifiers.codeRequired'));
        }

        const modifierData: ModifierFormData = {
          name: formData.name,
          code: formData.code,
          description: formData.description || '',
          is_active: formData.is_active !== false,
          name_i18n: formData.name_i18n || '',
          picture_url: formData.picture_url || '',
        };

        if (isNew) {
          await createModifier(modifierData);
          // Revalidate modifiers list to show the new modifier
          await mutate(endpoints.modifier.list);
        } else if (id) {
          await updateModifier(id, modifierData);
          // Revalidate modifier cache to reflect the update immediately
          await mutate(endpoints.modifier.details(id));
          await mutate(endpoints.modifier.list);
        }

        // Add small delay to ensure SWR cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, CACHE_SYNC_DELAY_MS));

        // Only redirect if we're not already navigating away
        router.push(paths.menu.modifiers.root);
      } catch (err) {
        console.error('Error saving modifier:', err);
        // Re-throw the error to be handled by the GenericEditView
        // This ensures loading state is properly reset
        throw err;
      }
    },
    [isNew, id, createModifier, updateModifier, router, t]
  );

  const handleDelete = useCallback(async () => {
    try {
      if (id) {
        await deleteModifier(id);
        // Add small delay to ensure SWR cache is updated before redirect
        await new Promise(resolve => setTimeout(resolve, DELETE_SYNC_DELAY_MS));
        router.push(paths.menu.modifiers.root);
      }
    } catch (err) {
      console.error('Error deleting modifier:', err);
      throw err;
    }
  }, [id, deleteModifier, router]);

  return {
    handleSubmit,
    handleDelete,
  };
}
