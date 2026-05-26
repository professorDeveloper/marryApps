import type { SelectOption } from '../types';

import dayjs from 'dayjs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface StatusOption {
    value: string;
    label: string;
}

interface DeductionMetaFieldsProps {
    date: string;
    storageId: string;
    groupId: string;
    status: string;
    description: string;
    onDateChange: (value: string) => void;
    onStorageChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    storages: SelectOption[];
    groups: SelectOption[];
    statusOptions: StatusOption[];
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const DeductionMetaFields = React.memo(function DeductionMetaFields({
    date,
    storageId,
    groupId,
    status,
    description,
    onDateChange,
    onStorageChange,
    onGroupChange,
    onStatusChange,
    onDescriptionChange,
    storages,
    groups,
    statusOptions,
    disabled = false,
    isOpen,
    onToggle,
}: DeductionMetaFieldsProps) {
    const { t } = useTranslation('menu');

    const formattedDate = date ? dayjs(date).format('DD.MM.YYYY') : '';
    const selectedStorage = storages.find((s) => String(s.id) === String(storageId))?.name;
    const selectedGroup = groups.find((g) => String(g.id) === String(groupId))?.name;
    const statusLabel = statusOptions.find((opt) => opt.value === status)?.label;

    const summaryValues = [formattedDate, selectedStorage, selectedGroup, statusLabel].filter(
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
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
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
                    label={`${t('deductions.group')} *`}
                    value={groupId}
                    onChange={(e) => onGroupChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || groups.length === 0}
                >
                    <option value="">{t('deductions.selectGroup')}</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={t('deductions.status')}
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled}
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
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
                disabled={disabled}
                sx={{ mt: 2 }}
            />
        </GeneralInformation>
    );
});
