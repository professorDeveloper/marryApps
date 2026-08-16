import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Switch, TextField, FormControlLabel } from '@mui/material';

import { ImageUpload } from 'src/components/generic-edit-view/image-upload-new';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

interface ModifierGeneralInformationProps {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  pictureUrl: string;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onPictureUrlChange: (value: string) => void;
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const ModifierGeneralInformation = React.memo(function ModifierGeneralInformation({
  name,
  code,
  description,
  isActive,
  pictureUrl,
  onNameChange,
  onCodeChange,
  onDescriptionChange,
  onIsActiveChange,
  onPictureUrlChange,
  disabled,
  isOpen,
  onToggle,
}: ModifierGeneralInformationProps) {
  const { t } = useTranslation('menu');

  const summaryValues = [name, code].filter(Boolean) as string[];

  return (
    <GeneralInformation
      title={t('modifiers.basicInfo')}
      isOpen={isOpen}
      onToggle={onToggle}
      disabled={disabled}
      summaryValues={summaryValues}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr 0.4fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          {/* ================= COLUMN 1: Name, Code, IsActive ================= */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <TextField
              label={t('modifiers.name')}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              size="small"
              required
              disabled={disabled}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <TextField
                label={t('modifiers.code')}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                size="small"
                required
                disabled={disabled}
                sx={{ flex: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => onIsActiveChange(e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={t('modifiers.isActive')}
              />
            </Box>
          </Box>

          {/* ================= COLUMN 2: Description ================= */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <TextField
              label={t('modifiers.generalInfo')}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              size="small"
              multiline
              rows={3}
              disabled={disabled}
            />
          </Box>

          {/* ================= COLUMN 3: Image Upload ================= */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <ImageUpload
              label={t('modifiers.imageUrl')}
              value={pictureUrl || null}
              onChange={onPictureUrlChange}
              height={86}
            />
          </Box>
        </Box>
      </Box>
    </GeneralInformation>
  );
});
