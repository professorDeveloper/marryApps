import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Stack, Button, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import {
  useGetModifier,
  useGetModifierWithCalculations,
} from 'src/actions/modifiers';

import { toast } from 'src/components/snackbar';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';
import {
  MealItemPicker,
  type MealItemPickerApi,
} from 'src/sections/meals/components/MealItemPicker';
import { MealItemPickerCache } from 'src/sections/meals/components/MealItemPicker/MealItemPickerCache';

import { useModifierForm } from './hooks/useModifierForm';
import { ModifierGeneralInformation } from './components/ModifierGeneralInformation';

export interface ModifierEditViewProps {
  isNew?: boolean;
}

export function ModifierEditView({ isNew = false }: ModifierEditViewProps) {
  const params = useParams();
  const id = (params.id as string | undefined) || undefined;
  const router = useRouter();
  const { t } = useTranslation('menu');

  // ── General info state ──────────────────────────────────────
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [pictureUrl, setPictureUrl] = useState('');

  // ── UI state ────────────────────────────────────────────────
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isMealItemsOpen, setIsMealItemsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Picker ref ──────────────────────────────────────────────
  const mealItemsApiRef = useRef<MealItemPickerApi | null>(null);
  const mealItemPickerCacheKey = isNew ? 'modifier_new' : `modifier_${id}`;

  // ── Data ────────────────────────────────────────────────────
  const { modifier, modifierLoading } = useGetModifier(isNew ? '' : id || '');
  const { modifierWithCalculations } = useGetModifierWithCalculations(
    isNew ? undefined : id
  );

  const pageLoading = !isNew && modifierLoading;

  // ── Clear picker cache on unmount ───────────────────────────
  useEffect(
    () => () => {
      MealItemPickerCache.clear(mealItemPickerCacheKey);
    },
    [mealItemPickerCacheKey]
  );

  // ── Hydrate base fields ─────────────────────────────────────
  useEffect(() => {
    if (!modifier) return;
    setName(modifier.name || '');
    setCode(modifier.code || '');
    setDescription(modifier.description || '');
    setIsActive(modifier.is_active !== false);
    setPictureUrl(modifier.picture_url || '');
  }, [modifier]);

  // ── Hydrate calc rows into the picker ───────────────────────
  useEffect(() => {
    if (!modifierWithCalculations?.calculations || !mealItemsApiRef.current) return;

    const ingredientCalcs = modifierWithCalculations.calculations
      .filter((c) => c.ingredient_id && !c.compound_to_add_id)
      .map((c) => ({
        ingredient_id: c.ingredient_id as string,
        quantity: String(c.quantity),
      }));

    const compoundCalcs = modifierWithCalculations.calculations
      .filter((c) => c.compound_to_add_id)
      .map((c) => ({
        compound_id: c.compound_to_add_id as string,
        quantity: String(c.quantity),
      }));

    mealItemsApiRef.current.restoreFromPersisted(ingredientCalcs, compoundCalcs);
  }, [modifierWithCalculations]);

  const { handleSubmit } = useModifierForm({
    isNew,
    id,
    mealItemsApiRef,
  });

  const handleCancel = useCallback(() => {
    router.push(paths.menu.modifiers.root);
  }, [router]);

  const onSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error(t('modifiers.nameRequired'));
      return;
    }
    if (!code.trim()) {
      toast.error(t('modifiers.codeRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await handleSubmit({
        name,
        code,
        description,
        is_active: isActive,
        picture_url: pictureUrl,
      });
    } catch {
      // toast already shown in useModifierForm
    } finally {
      setSubmitting(false);
    }
  }, [name, code, description, isActive, pictureUrl, handleSubmit, t]);

  const handleNavigateFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => {
    // Modifiers form only has one editable column (quantity), so horizontal navigation is not applicable
    if (direction === 'left' || direction === 'right') return;

    const targetRowIndex = direction === 'down' ? currentRowIndex + 1 : currentRowIndex - 1;
    // Find the quantity input in the target row
    const inputs = document.querySelectorAll('input[inputMode="decimal"]') as NodeListOf<HTMLInputElement>;
    // Sort by data-index to get correct order
    const quantityInputs = Array.from(inputs).filter(input =>
      input.closest('[data-index]')
    );
    quantityInputs.sort((a, b) => {
      const indexA = parseInt(a.closest('[data-index]')?.getAttribute('data-index') || '0');
      const indexB = parseInt(b.closest('[data-index]')?.getAttribute('data-index') || '0');
      return indexA - indexB;
    });
    const targetInput = quantityInputs[targetRowIndex];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  }, []);

  const sectionsDisabled = submitting || pageLoading;
  const saveLabel = t('save', 'Save');

  return (
    <Box sx={{ px: 4, m: 0 }}>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {pageLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              opacity: 0.85,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box
        sx={{
          my:2
        }}
        >
          <ModifierGeneralInformation
            name={name}
            code={code}
            description={description}
            isActive={isActive}
            pictureUrl={pictureUrl}
            onNameChange={setName}
            onCodeChange={setCode}
            onDescriptionChange={setDescription}
            onIsActiveChange={setIsActive}
            onPictureUrlChange={setPictureUrl}
            disabled={sectionsDisabled}
            isOpen={isInfoOpen}
            onToggle={() => setIsInfoOpen((p) => !p)}
          />
        </Box>


        <Box sx={{ mx: 0, my: -2 }}>
          <MealItemPicker
            apiRef={mealItemsApiRef}
            onCancel={() => { }}
            onSave={() => { }}
            cancelDisabled
            saveDisabled
            saveLabel={saveLabel}
            hideActionBar
            isVisible={isMealItemsOpen}
            metaFieldsOpen={isInfoOpen}
            cacheKey={mealItemPickerCacheKey}
            onNavigateFocus={handleNavigateFocus}
          />
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={sectionsDisabled}
          >
            {t('cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={onSave} disabled={sectionsDisabled}>
            {saveLabel}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
