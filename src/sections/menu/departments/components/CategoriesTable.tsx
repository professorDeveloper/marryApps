/**
 * Categories table component for displaying categories within a department
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, Box, Typography } from '@mui/material';

import { fDate } from 'src/utils/format-time';
import { getInitials } from 'src/utils/avatar';
import { getFullImageUrl } from 'src/utils/image-url';

import { useGetCategoriesByDepartment, useGetStorages } from 'src/actions/departments';

interface CategoriesTableProps {
  departmentId: string;
}

export function CategoriesTable({ departmentId }: CategoriesTableProps) {
  const { t } = useTranslation('menu');
  const { categories, categoriesLoading } = useGetCategoriesByDepartment(departmentId);
  const { storages } = useGetStorages();
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

  // Create storage map for quick lookup
  const storageMap = useMemo(() => {
    const map = new Map<string, string>();
    storages.forEach((storage) => {
      map.set(storage.id, storage.name || '');
    });
    return map;
  }, [storages]);

  // Load images for categories in parallel
  useEffect(() => {
    const loadImages = async () => {
      if (categories.length === 0) return;

      const imagePromises = categories.map(async (category) => {
        if (!category.picture_url) {
          return { id: category.id, url: null };
        }
        try {
          const url = await getFullImageUrl(category.picture_url);
          return { id: category.id, url };
        } catch (error) {
          console.error('Failed to load category image:', error);
          return { id: category.id, url: null };
        }
      });

      const results = await Promise.all(imagePromises);
      const urls: { [key: string]: string | null } = {};
      results.forEach(({ id, url }) => {
        urls[id] = url;
      });
      setImageUrls(urls);
    };

    loadImages();
  }, [categories]);

  if (categoriesLoading) {
    return (
      <Typography sx={{ color: 'text.primary' }}>
        {t('common.loading')}
      </Typography>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Typography sx={{ color: 'text.primary' }}>
        {t('common.noData')}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th': {
            padding: '12px',
            textAlign: 'left',
            fontWeight: 600,
            color: 'text.primary',
            borderBottom: `2px solid`,
            borderColor: 'divider',
          },
          '& td': {
            padding: '12px',
            color: 'text.primary',
            borderBottom: `1px solid`,
            borderColor: 'divider',
          },
        }}
      >
        <thead>
          <tr>
            <th>{t('categories.name')}</th>
            <th>{t('categories.color')}</th>
            <th>{t('departments.storage')}</th>
            <th>{t('categories.created')}</th>
            <th>{t('categories.updated')}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    alt={category.name}
                    src={imageUrls[category.id] || undefined}
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: imageUrls[category.id] ? undefined : (category.color_code || 'var(--border)'),
                      color: 'var(--accent-fg)',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                    }}
                  >
                    {!imageUrls[category.id] && getInitials(category.name)}
                  </Avatar>
                  <Typography sx={{ color: 'text.primary' }}>
                    {category.name}
                  </Typography>
                </Box>
              </td>
              <td>
                {category.color_code ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        bgcolor: category.color_code,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Typography sx={{ color: 'text.primary' }}>
                      {category.color_code}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ color: 'text.secondary' }}>-</Typography>
                )}
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {storageMap.get(category.storage_id) || '-'}
                </Typography>
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {fDate(category.created_at)}
                </Typography>
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {fDate(category.updated_at)}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
