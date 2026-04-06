import type { SelectOption } from '../types';

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface ShipmentsMetaFieldsProps {
    date: string;
    storageId: string;
    supplierId: string;
    description: string;
    onDateChange: (value: string) => void;
    onStorageChange: (value: string) => void;
    onSupplierChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    storages: SelectOption[];
    suppliers: SelectOption[];
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const ShipmentsMetaFields = React.memo(function ShipmentsMetaFields({
    date,
    storageId,
    supplierId,
    description,
    onDateChange,
    onStorageChange,
    onSupplierChange,
    onDescriptionChange,
    storages,
    suppliers,
    disabled = false,
    isOpen,
    onToggle,
}: ShipmentsMetaFieldsProps) {
    const { t } = useTranslation('menu');

    const dateValue = date ? dayjs(date) : null;
    const formattedDate = dateValue ? dateValue.format('DD.MM.YYYY') : '';
    const selectedStorage = storages.find((s) => String(s.id) === String(storageId))?.name;
    const selectedSupplier = suppliers.find((s) => String(s.id) === String(supplierId))?.name;

    const summaryValues = [formattedDate, selectedStorage, selectedSupplier].filter(
        Boolean
    ) as string[];

    return (
        <GeneralInformation
            title={t('shipments.details', 'Shipment Details')}
            isOpen={isOpen}
            onToggle={onToggle}
            disabled={disabled}
            summaryValues={summaryValues}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                    gap: 2,
                }}
            >
                <DatePicker
                    label={`${t('deductions.date', 'Date')} *`}
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
                    label={`${t('deductions.storage', 'Warehouse')} *`}
                    value={storageId}
                    onChange={(e) => onStorageChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || storages.length === 0}
                >
                    <option value="">{t('deductions.selectStorage', 'Select Warehouse')}</option>
                    {storages.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('shipments.supplier', 'Supplier')} *`}
                    value={supplierId}
                    onChange={(e) => onSupplierChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || suppliers.length === 0}
                >
                    <option value="">{t('shipments.selectSupplier', 'Select Supplier')}</option>
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>
            </Box>

            <TextField
                label={t('deductions.description', 'Description')}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder={t('shipments.enterDescription', 'Enter description...')}
                disabled={disabled}
                sx={{ mt: 2 }}
            />
        </GeneralInformation>
    );
});
