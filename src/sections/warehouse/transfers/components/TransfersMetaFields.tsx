import type { Branch, Storage, SelectOption } from '../types';

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface StatusOption {
    value: string;
    label: string;
}

interface TransfersMetaFieldsProps {
    date: string;
    fromBranchId: string;
    toBranchId: string;
    fromStorageId: string;
    toStorageId: string;
    groupId: string;
    status: string;
    description: string;
    onDateChange: (value: string) => void;
    onFromBranchChange: (value: string) => void;
    onToBranchChange: (value: string) => void;
    onFromStorageChange: (value: string) => void;
    onToStorageChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    branches: Branch[];
    fromStorages: Storage[];
    toStorages: Storage[];
    groups: SelectOption[];
    statusOptions: StatusOption[];
    disabled?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

export const TransfersMetaFields = React.memo(function TransfersMetaFields({
    date,
    fromBranchId,
    toBranchId,
    fromStorageId,
    toStorageId,
    groupId,
    status,
    description,
    onDateChange,
    onFromBranchChange,
    onToBranchChange,
    onFromStorageChange,
    onToStorageChange,
    onGroupChange,
    onStatusChange,
    onDescriptionChange,
    branches,
    fromStorages,
    toStorages,
    groups,
    statusOptions,
    disabled = false,
    isOpen,
    onToggle,
}: TransfersMetaFieldsProps) {
    const { t } = useTranslation('menu');

    const formattedDate = date ? dayjs(date).format('DD.MM.YYYY') : '';
    const fromBranchName = branches.find((b) => String(b.id) === String(fromBranchId))?.name;
    const toBranchName = branches.find((b) => String(b.id) === String(toBranchId))?.name;
    const statusLabel = statusOptions.find((opt) => opt.value === status)?.label;

    const summaryValues = [
        formattedDate,
        fromBranchName ? `From: ${fromBranchName}` : '',
        toBranchName ? `To: ${toBranchName}` : '',
        statusLabel,
    ].filter(Boolean) as string[];

    return (
        <GeneralInformation
            title={t('transfers.details')}
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
                    label={`${t('transfers.fromBranch')} *`}
                    value={fromBranchId}
                    onChange={(e) => onFromBranchChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || branches.length === 0}
                >
                    <option value="">{t('transfers.selectFromBranch')}</option>
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('transfers.fromStorage')} *`}
                    value={fromStorageId}
                    onChange={(e) => onFromStorageChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || fromStorages.length === 0}
                >
                    <option value="">{t('transfers.selectFromStorage')}</option>
                    {fromStorages.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('transfers.toBranch')} *`}
                    value={toBranchId}
                    onChange={(e) => onToBranchChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || branches.length === 0}
                >
                    <option value="">{t('transfers.selectToBranch')}</option>
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </TextField>

                <TextField
                    select
                    label={`${t('transfers.toStorage')} *`}
                    value={toStorageId}
                    onChange={(e) => onToStorageChange(e.target.value)}
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={disabled || toStorages.length === 0}
                >
                    <option value="">{t('transfers.selectToStorage')}</option>
                    {toStorages.map((s) => (
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
                    <option value="">{t('transfers.selectGroup')}</option>
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
                placeholder={t('transfers.enterDescription')}
                disabled={disabled}
                sx={{ mt: 2 }}
            />
        </GeneralInformation>
    );
});
