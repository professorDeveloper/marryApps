import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface CompoundGeneralInformationProps {
    name: string;
    nameEn: string;
    nameRu: string;
    description: string;
    ingredientGroupId: string;
    quantity: string;
    measurement: string;
    ingredientGroups: any[];
    measurementOptions: Array<{ value: string; label: string }>;
    onNameChange: (value: string) => void;
    onNameEnChange: (value: string) => void;
    onNameRuChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onIngredientGroupChange: (value: string) => void;
    onQuantityChange: (value: string) => void;
    onMeasurementChange: (value: string) => void;
    disabled: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const CompoundGeneralInformation = React.memo(function CompoundGeneralInformation({
    name,
    nameEn,
    nameRu,
    description,
    ingredientGroupId,
    quantity,
    measurement,
    ingredientGroups,
    measurementOptions,
    onNameChange,
    onNameEnChange,
    onNameRuChange,
    onDescriptionChange,
    onIngredientGroupChange,
    onQuantityChange,
    onMeasurementChange,
    disabled,
    isOpen,
    onToggle,
}: CompoundGeneralInformationProps) {
    const { t } = useTranslation('menu');

    const selectedGroupName = ingredientGroups.find(
        (g) => String(g.id) === String(ingredientGroupId)
    )?.name;

    const summaryValues = [name, selectedGroupName].filter(Boolean) as string[];

    return (
        <GeneralInformation
            title={t('semifinishedProducts.basicTitle')}
            isOpen={isOpen}
            onToggle={onToggle}
            disabled={disabled}
            summaryValues={summaryValues}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {/* TWO COLUMN LAYOUT */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2,
                    }}
                >
                    {/* LEFT COLUMN - 4 fields */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: 2,
                        }}
                    >
                        {/* Name */}
                        <TextField
                            label={t('semifinishedProducts.name')}
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            size="small"
                            required
                            disabled={disabled}
                        />

                        {/* Name EN */}
                        <TextField
                            label={t('semifinishedProducts.nameEn')}
                            value={nameEn}
                            onChange={(e) => onNameEnChange(e.target.value)}
                            size="small"
                            disabled={disabled}
                        />

                        {/* Name RU */}
                        <TextField
                            label={t('semifinishedProducts.nameRu')}
                            value={nameRu}
                            onChange={(e) => onNameRuChange(e.target.value)}
                            size="small"
                            disabled={disabled}
                        />
                          {/* Ingredient Group */}
                        <TextField
                            select
                            label={t('ingredients.group')}
                            value={ingredientGroupId}
                            onChange={(e) => onIngredientGroupChange(e.target.value)}
                            size="small"
                            required
                            SelectProps={{ native: true }}
                            disabled={disabled || ingredientGroups.length === 0}
                        >
                            <option value="" />
                            {ingredientGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </TextField>
                    </Box>

                    {/* RIGHT COLUMN - 3 fields */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: 2,
                        }}
                    >
                      

                        {/* Quantity */}
                        <TextField
                            label={t('semifinishedProducts.quantity')}
                            value={quantity}
                            onChange={(e) => onQuantityChange(e.target.value)}
                            size="small"
                            type="number"
                            required
                            disabled={disabled}
                        />

                        {/* Measurement */}
                        <TextField
                            select
                            label={t('semifinishedProducts.measurement')}
                            value={measurement}
                            onChange={(e) => onMeasurementChange(e.target.value)}
                            size="small"
                            required
                            SelectProps={{ native: true }}
                            disabled={disabled}
                        >
                            {measurementOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </TextField>
                            {/* DESCRIPTION - Spans both columns */}
                    <TextField
                        label={t('semifinishedProducts.description')}
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        size="small"
                        multiline
                        minRows={3}
                        disabled={disabled}
                        sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                    />
                    </Box>

                
                </Box>
            </Box>
        </GeneralInformation>
    );
});
