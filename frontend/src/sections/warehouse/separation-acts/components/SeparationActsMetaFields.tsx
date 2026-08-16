import type { Ingredient, SelectOption } from '../types';

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface SeparationActsMetaFieldsProps {
    date: string;
    storageId: string;
    groupId: string;
    sourceIngredientId: string;
    sourceQuantity: string;
    description: string;
    onDateChange: (value: string) => void;
    onStorageChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onSourceIngredientChange: (value: string) => void;
    onSourceQuantityChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    storages: SelectOption[];
    groups: SelectOption[];
    ingredients: Ingredient[];
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const SeparationActsMetaFields = React.memo(function SeparationActsMetaFields({
    date,
    storageId,
    groupId,
    sourceIngredientId,
    sourceQuantity,
    description,
    onDateChange,
    onStorageChange,
    onGroupChange,
    onSourceIngredientChange,
    onSourceQuantityChange,
    onDescriptionChange,
    storages,
    groups,
    ingredients,
    disabled = false,
    isOpen,
    onToggle,
}: SeparationActsMetaFieldsProps) {
    const { t } = useTranslation('menu');

    const dateValue = date ? dayjs(date) : null;
    const formattedDate = dateValue ? dateValue.format('DD.MM.YYYY') : '';
    const selectedStorage = storages.find((s) => String(s.id) === String(storageId))?.name;
    const selectedGroup = groups.find((g) => String(g.id) === String(groupId))?.name;
    const selectedIngredient = ingredients.find((i) => String(i.id) === String(sourceIngredientId))?.name;

    const summaryValues = [
        formattedDate,
        selectedStorage,
        selectedGroup,
        selectedIngredient,
        sourceQuantity ? `${sourceQuantity}` : '',
    ].filter(Boolean) as string[];

    return (
        <GeneralInformation
            title={t('separationActs.details')}
            isOpen={isOpen}
            onToggle={onToggle}
            disabled={disabled}
            summaryValues={summaryValues}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                }}
            >
                <DatePicker
                    label={`${t('deductions.date')} *`}
                    value={dateValue}
                    onChange={(newDate) => {
                        onDateChange(newDate ? newDate.format('YYYY-MM-DD') : '');
                    }}
                    format="DD.MM.YYYY"
                    disabled={disabled}
                    slotProps={{
                        textField: {
                            size: 'small',
                            inputProps: { readOnly: true },
                            sx: { cursor: 'pointer' },
                        },
                    }}
                />

                <TextField
                    select
                    label={`${t('deductions.storage')} *`}
                    value={storageId}
                    onChange={(e) => onStorageChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || storages.length === 0}
                >
                    <option value="">{t('deductions.selectStorage')}</option>
                    {storages.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('deductions.group')} *`}
                    value={groupId}
                    onChange={(e) => onGroupChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || groups.length === 0}
                >
                    <option value="">{t('separationActs.selectGroup')}</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('separationActs.sourceIngredient')} *`}
                    value={sourceIngredientId}
                    onChange={(e) => onSourceIngredientChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || ingredients.length === 0}
                >
                    <option value="">{t('separationActs.selectSourceIngredient')}</option>
                    {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                            {ing.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    label={`${t('separationActs.sourceQuantity')} *`}
                    type="number"
                    value={sourceQuantity}
                    onChange={(e) => onSourceQuantityChange(e.target.value)}
                    size="small"
                    disabled={disabled}
                    inputProps={{ step: '0.01', min: '0' }}
                />
            </Box>

            <TextField
                label={t('deductions.description')}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder={t('separationActs.enterDescription')}
                disabled={disabled}
                sx={{ mt: 2 }}
            />
        </GeneralInformation>
    );
});
