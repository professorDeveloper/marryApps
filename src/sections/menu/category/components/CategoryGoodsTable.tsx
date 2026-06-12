import type { GridColDef } from '@mui/x-data-grid';
import type { CategoryGoodsTableProps } from '../types';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { DataGrid } from '@mui/x-data-grid';

import { getInitials } from 'src/utils/avatar';
import { getFullImageUrl } from 'src/utils/image-url';

import { useGetGoodsByCategory } from 'src/actions/categories';

/**
 * Goods table component using DataGrid
 */
export function CategoryGoodsTable({ categoryId }: CategoryGoodsTableProps) {
    const { t } = useTranslation('menu');
    const { goods, goodsLoading } = useGetGoodsByCategory(categoryId);
    const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

    // Load images for goods
    useEffect(() => {
        let isMounted = true;

        const loadImages = async () => {
            const urls: { [key: string]: string | null } = {};
            for (const item of goods) {
                if (item.picture_url) {
                    try {
                        const url = await getFullImageUrl(item.picture_url);
                        urls[item.id] = url;
                    } catch (error) {
                        console.error('Failed to load goods image:', error);
                        urls[item.id] = null;
                    }
                } else {
                    urls[item.id] = null;
                }
            }
            if (isMounted) {
                setImageUrls(urls);
            }
        };

        if (goods.length > 0) {
            loadImages();
        } else {
            setImageUrls({});
        }

        return () => {
            isMounted = false;
        };
    }, [goods]);

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: t('mealsProducts.name'),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        alt={params.row.name}
                        src={imageUrls[params.row.id] || undefined}
                        variant="rounded"
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: imageUrls[params.row.id] ? undefined : 'var(--border)',
                            color: 'var(--accent-fg)',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                        }}
                    >
                        {!imageUrls[params.row.id] && getInitials(params.row.name)}
                    </Avatar>
                    <span>{params.row.name}</span>
                </Box>
            ),
        },
        {
            field: 'description',
            headerName: t('mealsProducts.description'),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <span
                    style={{
                        fontSize: '0.875rem',
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {params.row.description || '-'}
                </span>
            ),
        },
        {
            field: 'price',
            headerName: t('mealsProducts.price'),
            width: 120,
            renderCell: (params) => (
                <span>{parseFloat(params.row.price).toLocaleString()} so&apos;m</span>
            ),
        },
        {
            field: 'cook_time',
            headerName: t('mealsProducts.cookingTime'),
            width: 120,
            renderCell: (params) => <span>{params.row.cook_time} min</span>,
        },
        {
            field: 'created_at',
            headerName: t('mealsProducts.createdAt'),
            width: 120,
            renderCell: (params) => (
                <span>
                    {new Date(params.row.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            ),
        },
    ];

    if (goodsLoading) {
        return <div>{t('common.loading')}</div>;
    }

    if (!goods || goods.length === 0) {
        return <div>{t('common.noData')}</div>;
    }

    return (
        <Box sx={{ width: '100%', height: 400 }}>
            <DataGrid
                rows={goods}
                columns={columns}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                hideFooter
                sx={{
                    '& .MuiDataGrid-root': {
                        border: 'none',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        borderBottom: '2px solid var(--border)',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid var(--border)',
                    },
                }}
            />
        </Box>
    );
}
