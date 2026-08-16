import type { IDeviceFormData } from '../types';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

import { useGetCategories } from 'src/actions/categories';

import { Iconify } from 'src/components/iconify';

import { DEVICE_TYPES, CONNECTION_TYPES } from '../constants';
import { validatePort, validateIpAddress, validateConnectedEntities } from '../utils/validation';

interface DeviceFormProps {
  formId: string;
  defaultValues?: Partial<IDeviceFormData>;
  onSubmit: (data: IDeviceFormData) => Promise<void>;
}

export function DeviceForm({ formId, defaultValues, onSubmit }: DeviceFormProps) {
  const { t } = useTranslation('menu');
  const { categories } = useGetCategories();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IDeviceFormData>({
    defaultValues: {
      ip: defaultValues?.ip ?? '',
      port: defaultValues?.port ?? 9100,
      type: defaultValues?.type ?? 'close_check',
      connection_type: defaultValues?.connection_type ?? 'wlan',
      connected_entity_ids: defaultValues?.connected_entity_ids ?? [],
    },
  });

  const selectedType = watch('type');

  // Reset when defaultValues change (switching between create/edit)
  useEffect(() => {
    reset({
      ip: defaultValues?.ip ?? '',
      port: defaultValues?.port ?? 9100,
      type: defaultValues?.type ?? 'close_check',
      connection_type: defaultValues?.connection_type ?? 'wlan',
      connected_entity_ids: defaultValues?.connected_entity_ids ?? [],
    });
  }, [defaultValues, reset]);

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
    >
      <TextField
        label={t('devices.ipAddress')}
        {...register('ip', { validate: validateIpAddress })}
        error={!!errors.ip}
        helperText={errors.ip?.message}
        fullWidth
        placeholder="192.168.1.100"
      />

      <TextField
        label={t('devices.port')}
        {...register('port', { 
          valueAsNumber: true,
          validate: validatePort 
        })}
        error={!!errors.port}
        helperText={errors.port?.message}
        fullWidth
        type="number"
        inputProps={{ min: 1, max: 65535 }}
        placeholder="9100"
      />

      <FormControl fullWidth error={!!errors.type}>
        <InputLabel id="type-select-label">{t('devices.type')}</InputLabel>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              labelId="type-select-label"
              label={t('devices.type')}
            >
              {DEVICE_TYPES.map((dt) => (
                <MenuItem key={dt.value} value={dt.value}>
                  {dt.label}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
      </FormControl>

      <FormControl fullWidth error={!!errors.connection_type}>
        <InputLabel id="connection-type-select-label">{t('devices.connectionType')}</InputLabel>
        <Controller
          name="connection_type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              labelId="connection-type-select-label"
              label={t('devices.connectionType')}
            >
              {CONNECTION_TYPES.map((ct) => (
                <MenuItem key={ct.value} value={ct.value}>
                  {ct.label}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        {errors.connection_type && <FormHelperText>{errors.connection_type.message}</FormHelperText>}
      </FormControl>

      {selectedType === 'category' && (
        <FormControl fullWidth error={!!errors.connected_entity_ids}>
          <InputLabel id="entity-select-label">{t('devices.categories')}</InputLabel>
          <Controller
            name="connected_entity_ids"
            control={control}
            rules={{
              validate: (value) => validateConnectedEntities(value, selectedType),
            }}
            render={({ field }) => (
              <Select
                  {...field}
                  labelId="entity-select-label"
                  label={t('devices.categories')}
                  multiple
                  renderValue={(selected) => {
                    const selectedIds = selected as string[];
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedIds.map((id) => {
                          const cat = categories.find((c) => c.id === id);
                          return (
                            <Chip
                              key={id}
                              label={cat?.name ?? id}
                              size="small"
                              onMouseDown={(event) => event.stopPropagation()} // Prevent dropdown opening on chip click
                              onDelete={(event) => {
                                event.stopPropagation();
                                const newSelected = selectedIds.filter((selectedId) => selectedId !== id);
                                field.onChange(newSelected);
                              }}
                              deleteIcon={
                                <Iconify 
                                  icon="mingcute:close-line" 
                                  width={14} 
                                  height={14} 
                                  sx={{ fontSize: 14 }}
                                />
                              }
                            />
                          );
                        })}
                      </Box>
                    );
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex !important',
                      flexWrap: 'wrap !important',
                      gap: '4px !important',
                      padding: '8px !important',
                      minHeight: '32px !important',
                      alignItems: 'center !important',
                    }
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
            )}
          />
          {errors.connected_entity_ids && (
            <FormHelperText>{errors.connected_entity_ids.message}</FormHelperText>
          )}
        </FormControl>
      )}
    </Box>
  );
}
