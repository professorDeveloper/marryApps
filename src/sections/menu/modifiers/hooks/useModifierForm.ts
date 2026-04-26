import type { IModifierRecipePayload } from 'src/types/modifiers';
import type { MealItemPickerApi } from 'src/sections/meals/components/MealItemPicker';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useDeleteModifier,
  useCreateModifierWithCalculations,
  useUpdateModifierWithCalculations,
} from 'src/actions/modifiers';

import { toast } from 'src/components/snackbar';

interface UseModifierFormProps {
  isNew: boolean;
  id?: string;
  mealItemsApiRef: React.RefObject<MealItemPickerApi | null>;
}

interface SubmitFormData {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  picture_url: string;
}

export function useModifierForm({
  isNew,
  id,
  mealItemsApiRef,
}: UseModifierFormProps) {
  const router = useRouter();
  const { t } = useTranslation('menu');
  const { createModifierWithCalculations } = useCreateModifierWithCalculations();
  const { updateModifierWithCalculations } = useUpdateModifierWithCalculations();
  const { deleteModifier } = useDeleteModifier();

  const handleSubmit = useCallback(
    async (form: SubmitFormData) => {
      try {
        const { ingredient_calculations, compound_calculations } =
          mealItemsApiRef.current?.getCalculations() ?? {
            ingredient_calculations: [],
            compound_calculations: [],
          };

        const ingredientRows = ingredient_calculations
          .filter((r) => parseFloat(r.quantity) > 0)
          .map((r) => ({ ingredient_id: r.ingredient_id, quantity: r.quantity }));

        const compoundRows = compound_calculations
          .filter((r) => parseFloat(r.quantity) > 0)
          .map((r) => ({ compound_to_add_id: r.compound_id, quantity: r.quantity }));

        const payload: IModifierRecipePayload = {
          modifier: {
            name: form.name,
            code: form.code,
            description: form.description ?? '',
            is_active: form.is_active,
            picture_url: form.picture_url || '',
          },
          ingredient_calculations: ingredientRows,
          compound_calculations: compoundRows,
        };

        if (isNew) {
          await createModifierWithCalculations(payload);
          toast.success(t('success.created', 'Successfully created'));
        } else if (id) {
          await updateModifierWithCalculations(id, payload);
          toast.success(t('success.updated', 'Successfully updated'));
        }

        router.push(paths.menu.modifiers.root);
      } catch (err) {
        console.error('Error saving modifier:', err);
        toast.error(
          isNew
            ? t('error.createFailed', 'Failed to create')
            : t('error.updateFailed', 'Failed to update')
        );
        throw err;
      }
    },
    [
      isNew,
      id,
      mealItemsApiRef,
      createModifierWithCalculations,
      updateModifierWithCalculations,
      router,
      t,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteModifier(id);
      router.push(paths.menu.modifiers.root);
    } catch (err) {
      console.error('Error deleting modifier:', err);
      toast.error(t('error.deleteFailed', 'Failed to delete'));
      throw err;
    }
  }, [id, deleteModifier, router, t]);

  return { handleSubmit, handleDelete };
}
