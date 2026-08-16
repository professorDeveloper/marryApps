import type { Ingredient } from '../types';

import React, { memo } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

import { getFullImageUrl } from 'src/utils/image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';

import { Iconify } from 'src/components/iconify';

import { getMeasurementLabel, formatIngredientPrice } from '../utils';

interface IngredientNameCellProps {
  row: Ingredient;
}

export const IngredientNameCell = memo(function IngredientNameCell({ row }: IngredientNameCellProps) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (row.picture_url) {
      const loadImage = async () => {
        try {
          setLoading(true);
          const url = await getFullImageUrl(row.picture_url);
          setImageUrl(url);
        } catch (error) {
          console.error('Failed to load image:', error);
          setImageUrl(null);
        } finally {
          setLoading(false);
        }
      };
      loadImage();
    }
  }, [row.picture_url]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar
        src={imageUrl || undefined}
        sx={{
          bgcolor: imageUrl ? undefined : getAvatarColor(row.name),
          width: 40,
          height: 40,
        }}
      >
        {!imageUrl && !loading && getInitials(row.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary' }}>
          {row.name}
        </Box>
        {row.group_name && (
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
            {row.group_name}
          </Box>
        )}
      </Box>
    </Box>
  );
});

interface IngredientMeasurementCellProps {
  value: string;
  t: any; // Using any to avoid i18next type conflicts
}

export const IngredientMeasurementCell = memo(function IngredientMeasurementCell({ 
  value, 
  t 
}: IngredientMeasurementCellProps) {
  return (
    <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
      {getMeasurementLabel(String(value || '-'), t)}
    </Box>
  );
});

interface IngredientColorCellProps {
  value: string;
}

export const IngredientColorCell = memo(function IngredientColorCell({ value }: IngredientColorCellProps) {
  const colorCode = value as string;
  if (!colorCode) {
    return <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>-</Box>;
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: colorCode,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    </Box>
  );
});

interface IngredientPriceCellProps {
  value: string | number | undefined;
}

export const IngredientPriceCell = memo(function IngredientPriceCell({ value }: IngredientPriceCellProps) {
  return (
    <Box sx={{ fontSize: '0.875rem' }}>
      {formatIngredientPrice(value)}
    </Box>
  );
});

interface IngredientActionsCellProps {
  row: Ingredient;
  onView: (ingredient: Ingredient) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const IngredientActionsCell = memo(function IngredientActionsCell({ 
  row, 
  onView, 
  onEdit, 
  onDelete 
}: IngredientActionsCellProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <IconButton
        size="small"
        onClick={() => onView(row)}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon="solar:eye-bold" width={18} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onEdit(row.id)}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon="solar:pen-bold" width={18} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDelete(row.id)}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
      </IconButton>
    </Box>
  );
});
