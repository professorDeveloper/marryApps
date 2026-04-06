import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface InvoiceMetaFieldsProps {
    supplier: string;
    storage: string;
    invoiceDate: string;
    invoiceStatus: string;
    onSupplierChange: (value: string) => void;
    onStorageChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    suppliers: any[];
    storages: any[];
    disabled: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const InvoiceMetaFields = React.memo(function InvoiceMetaFields({
    supplier,
    storage,
    invoiceDate,
    invoiceStatus,
    onSupplierChange,
    onStorageChange,
    onDateChange,
    onStatusChange,
    suppliers,
    storages,
    disabled,
    isOpen,
    onToggle,
}: InvoiceMetaFieldsProps) {
    const { t } = useTranslation('menu');
    const dateValue = invoiceDate ? dayjs(invoiceDate) : null;

    const selectedSupplier = suppliers.find((s) => String(s.id) === String(supplier))?.name;
    const selectedStorage = storages.find((s) => String(s.id) === String(storage))?.name;
    const formattedDate = dateValue ? dateValue.format('DD.MM.YYYY') : '';
    const statusLabel =
        invoiceStatus === 'completed'
            ? t('warehouse.invoices.completed')
            : invoiceStatus === 'pending'
              ? t('warehouse.invoices.pending')
              : '';

    const summaryValues = [selectedSupplier, selectedStorage, formattedDate, statusLabel].filter(
        Boolean
    ) as string[];

    return (
        <GeneralInformation
            title={t('warehouse.invoices.information')}
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
                    select
                    label={t('warehouse.invoices.supplier')}
                    value={supplier}
                    onChange={(e) => onSupplierChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || suppliers.length === 0}
                    sx={{ cursor: suppliers.length === 0 ? 'not-allowed' : 'default' }}
                >
                    <option value="" />
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>
                <TextField
                    select
                    label={t('warehouse.invoices.storage')}
                    value={storage}
                    onChange={(e) => onStorageChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || storages.length === 0}
                    sx={{ cursor: storages.length === 0 ? 'not-allowed' : 'default' }}
                >
                    <option value="" />
                    {storages.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>
                <DatePicker
                    label={t('warehouse.invoices.date')}
                    value={dateValue}
                    onChange={(newDate) => {
                        onDateChange(newDate ? newDate.toISOString() : '');
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
                    label={t('warehouse.invoices.status')}
                    value={invoiceStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled}
                >
                    <option value="pending">{t('warehouse.invoices.pending', 'Pending')}</option>
                    <option value="completed">{t('warehouse.invoices.completed', 'Completed')}</option>
                </TextField>
            </Box>
        </GeneralInformation>
    );
});
