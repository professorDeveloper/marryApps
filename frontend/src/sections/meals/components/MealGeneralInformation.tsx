import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';

import { ImageUpload } from 'src/components/generic-edit-view/image-upload-new';

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
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr' },
                    gap: 2,
                    alignItems: 'stretch',
                }}
            >
                {/* ================= LEFT COLUMN ================= */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
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
                       {/* Category - Row 1, Col 1 (Left) */}
                    <TextField
                        select
                        label={t('mealsProducts.category')}
                        value={categoryId}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        size="small"
                        required
                        sx={{ gridColumn: 1, gridRow: 1 }}
                        slotProps={{ select: { native: true } }}
                    >
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </TextField>

                  
                </Box>

                {/* ================= RIGHT COLUMN ================= */}
                <Box
                    sx={{
                        display: 'grid',
                        // Two equal columns for description and image
                        gridTemplateColumns: '1.4fr 1fr',
                        // 3 rows: price, cooking time + description split, image
                        gridTemplateRows: 'auto 1fr 1fr',
                        gap: 2,
                        height: '100%',
                    }}
                >
                   {/* Price - Full width */}
                   <TextField
                        label={t('mealsProducts.price')}
                        value={price}
                        onChange={(e) => onPriceChange(e.target.value)}
                        size="small"
                        type="number"
                        required
                        disabled={disabled}
                        sx={{ gridColumn: '1 / -1', gridRow: 1 }}
                    />

                    {/* Cooking Time - Row 2, Col 1 */}
                    <TextField
                        label={t('mealsProducts.cookingTime')}
                        value={cookTime}
                        onChange={(e) => onCookTimeChange(e.target.value)}
                        size="small"
                        sx={{ gridColumn: 1, gridRow: 2 }}
                    />
                    
                    {/* Description - Row 2 & 3, Col 1 */}
                    <TextField
                        label={t('mealsProducts.description')}
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        size="small"
                        multiline
                        sx={{
                            gridColumn: 1,
                            gridRow: '3 / 7',
                            height: '100%',
                            
                            '& .MuiInputBase-root': {
                                height: '100%',
                                alignItems: 'flex-start',
                            },
                        }}
                    />
                    
                    {/* Image Upload - Row 2 & 3, Col 2 */}
                    <Box sx={{ gridColumn: 2, gridRow: '2 / 7' }}>
                        <ImageUpload
                            label={t('mealsProducts.imageUrl')}
                            value={pictureUrl || null}
                            onChange={onPictureUrlChange}
                            onRemove={() => onPictureUrlChange('')}
                            height={150}
                        />
                    </Box>

                 
                </Box>
            </Box>
        </GeneralInformation>
    );
});