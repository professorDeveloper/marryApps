import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface MealGeneralInformationProps {
    name: string;
    nameEn: string;
    nameRu: string;
    description: string;
    categoryId: string;
    price: string;
    cookTime: string;
    pictureUrl: string;
    categories: any[];
    onNameChange: (value: string) => void;
    onNameEnChange: (value: string) => void;
    onNameRuChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onPriceChange: (value: string) => void;
    onCookTimeChange: (value: string) => void;
    onPictureUrlChange: (value: string) => void;
    disabled: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const MealGeneralInformation = React.memo(function MealGeneralInformation({
    name,
    nameEn,
    nameRu,
    description,
    categoryId,
    price,
    cookTime,
    pictureUrl,
    categories,
    onNameChange,
    onNameEnChange,
    onNameRuChange,
    onDescriptionChange,
    onCategoryChange,
    onPriceChange,
    onCookTimeChange,
    onPictureUrlChange,
    disabled,
    isOpen,
    onToggle,
}: MealGeneralInformationProps) {
    const { t } = useTranslation('menu');

    const selectedCategoryName = categories.find(
        (c) => String(c.id) === String(categoryId)
    )?.name;

    const summaryValues = [name, selectedCategoryName, price ? `${price}` : ''].filter(
        Boolean
    ) as string[];

    return (
        <GeneralInformation
            title={t('mealsProducts.basicTitle')}
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
                <TextField
                    label={t('mealsProducts.name')}
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    size="small"
                    required
                    disabled={disabled}
                />
                <TextField
                    select
                    label={t('mealsProducts.category')}
                    value={categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    size="small"
                    required
                    SelectProps={{ native: true }}
                    disabled={disabled || categories.length === 0}
                >
                    <option value="" />
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </TextField>
                <TextField
                    label={t('mealsProducts.nameEn')}
                    value={nameEn}
                    onChange={(e) => onNameEnChange(e.target.value)}
                    size="small"
                    disabled={disabled}
                />
                <TextField
                    label={t('mealsProducts.nameRu')}
                    value={nameRu}
                    onChange={(e) => onNameRuChange(e.target.value)}
                    size="small"
                    disabled={disabled}
                />
                <TextField
                    label={t('mealsProducts.price')}
                    value={price}
                    onChange={(e) => onPriceChange(e.target.value)}
                    size="small"
                    type="number"
                    required
                    disabled={disabled}
                />
                <TextField
                    label={t('mealsProducts.cookingTime')}
                    value={cookTime}
                    onChange={(e) => onCookTimeChange(e.target.value)}
                    size="small"
                    type="number"
                    disabled={disabled}
                />
                <TextField
                    label={t('mealsProducts.imageUrl')}
                    value={pictureUrl}
                    onChange={(e) => onPictureUrlChange(e.target.value)}
                    size="small"
                    placeholder="https://example.com/image.jpg"
                    disabled={disabled}
                    sx={{ gridColumn: { md: '1 / -1' } }}
                />
                <TextField
                    label={t('mealsProducts.description')}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    size="small"
                    multiline
                    minRows={2}
                    disabled={disabled}
                    sx={{ gridColumn: { md: '1 / -1' } }}
                />
            </Box>
        </GeneralInformation>
    );
});
