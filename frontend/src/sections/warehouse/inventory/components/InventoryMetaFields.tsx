import type { InventoryMetaFieldsProps } from '../types';

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

import { InventoryDescriptionField } from './InventoryDescriptionField';

export const InventoryMetaFields = React.memo(function InventoryMetaFields({
    date,
    storageId,
    status,
    description,
    onDateChange,
    onStorageChange,
    onStatusChange,
    onDescriptionChange,
    storages,
    disabled,
    isOpen,
    onToggle,
}: InventoryMetaFieldsProps & { isOpen: boolean; onToggle: () => void }) {
    const { t } = useTranslation('menu');
    const dateValue = date ? dayjs(date) : null;
    const formattedDate = dateValue ? dateValue.format('DD.MM.YYYY HH:mm') : '';
    const selectedStorage = storages.find((s) => String(s.id) === String(storageId))?.name;
    const statusLabel =
        status === 'deleted'
            ? t('inventory.deleted')
            : status === 'active'
                ? t('inventory.active')
                : status === 'draft'
                    ? t('inventory.draft')
                    : '';

    const summaryValues = [formattedDate, selectedStorage, statusLabel].filter(
        Boolean
    ) as string[];

    return (
        <GeneralInformation
            title={t('inventory.details')}
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
                    alignItems: 'stretch',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <DateTimePicker
                        label={t('inventory.dateTime')}
                        value={dateValue}
                        onChange={(newDateTime) => {
                            onDateChange(newDateTime ? newDateTime.format('YYYY-MM-DDTHH:mm:ss') : '');
                        }}
                        format="DD.MM.YYYY HH:mm"
                        ampm={false}
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
                        label={t('inventory.storage')}
                        value={storageId}
                        onChange={(e) => onStorageChange(e.target.value)}
                        size="small"
                        SelectProps={{ native: true }}
                        disabled={disabled || storages.length === 0}
                    >
                        <option value="" />
                        {storages.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label={t('inventory.status')}
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        size="small"
                        SelectProps={{ native: true }}
                        disabled={disabled}
                    >
                        <option value="deleted">{t('inventory.deleted')}</option>
                        <option value="draft">{t('inventory.draft')}</option>
                        <option value="active">{t('inventory.active')}</option>
                    </TextField>
                </Box>
                <Box sx={{ height: '100%', display: 'flex' }}>
                    <InventoryDescriptionField
                        value={description}
                        onLiveChange={onDescriptionChange}
                        label={t('inventory.description')}
                        disabled={disabled}
                    />
                </Box>
            </Box>
        </GeneralInformation>
    );
});
