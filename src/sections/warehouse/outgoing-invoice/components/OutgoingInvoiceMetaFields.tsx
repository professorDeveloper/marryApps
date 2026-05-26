import type { SelectOption } from '../types';

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface OutgoingInvoiceMetaFieldsProps {
    date: string;
    storageId: string;
    groupId: string;
    description: string;
    onDateChange: (value: string) => void;
    onStorageChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    storages: SelectOption[];
    groups: SelectOption[];
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const OutgoingInvoiceMetaFields = React.memo(function OutgoingInvoiceMetaFields({
    date,
    storageId,
    groupId,
    description,
    onDateChange,
    onStorageChange,
    onGroupChange,
    onDescriptionChange,
    storages,
    groups,
    disabled = false,
    isOpen,
    onToggle,
}: OutgoingInvoiceMetaFieldsProps) {
    const { t } = useTranslation('menu');

    const selectedStorage = storages.find((s) => String(s.id) === String(storageId))?.name;
    const selectedGroup = groups.find((g) => String(g.id) === String(groupId))?.name;
    const formattedDate = date ? dayjs(date).format('DD.MM.YYYY') : '';

    const summaryValues = [formattedDate, selectedStorage, selectedGroup].filter(
        Boolean
    ) as string[];

    return (
        <GeneralInformation
            title={t('deductions.details')}
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
                    label={`${t('deductions.date')} *`}
                    value={date ? dayjs(date) : null}
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
                    label={`${t('outgoingInvoices.group')} *`}
                    value={groupId}
                    onChange={(e) => onGroupChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || groups.length === 0}
                >
                    <option value="">{t('outgoingInvoices.selectGroup')}</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                        </option>
                    ))}
                </TextField>
            </Box>

            <TextField
                label={t('deductions.description')}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder={t('outgoingInvoices.enterDescription')}
                disabled={disabled}
                sx={{ mt: 2 }}
            />
        </GeneralInformation>
    );
});
