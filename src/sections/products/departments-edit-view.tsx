import type { IDepartmentFormData } from 'src/types/departments.tsx';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';

import { endpoints } from 'src/lib/axios';
import { useGetStorages, useGetDepartment, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from 'src/actions/departments';

import { GenericEditView } from 'src/components/generic-edit-view';

import { COLOR_CODES, translateSection, CACHE_SYNC_DELAY_MS, DELETE_SYNC_DELAY_MS, mapStoragesToOptions } from 'src/sections/menu/compounds/utilities';

export interface DepartmentEditViewProps {
    isNew?: boolean;
}

export function DepartmentEditView({ isNew = false }: DepartmentEditViewProps) {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string | undefined;
    const { t } = useTranslation('menu');
    const { createDepartment } = useCreateDepartment();
    const { updateDepartment } = useUpdateDepartment();
    const { deleteDepartment } = useDeleteDepartment();
    const { createTranslation, updateTranslation } = useTranslationsAPI();
    const { storages } = useGetStorages();
    const { department, departmentLoading } = useGetDepartment(!isNew && id ? id : '');

    const storageOptions = useMemo(
        () => mapStoragesToOptions(storages),
        [storages]
    );

    const IMAGE_SECTION_T = translateSection(buildImageSection(), t);
    const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(), t);
    const COLOR_AND_STORAGE_SECTION_T = translateSection(
        buildColorAndStorageSection(storageOptions),
        t
    );

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // Validate required fields
                if (!formData.name || !formData.name.trim()) {
                    throw new Error(t('departments.nameRequired'));
                }
                if (!formData.color_code) {
                    throw new Error(t('departments.colorRequired'));
                }
                if (!formData.storage_id) {
                    throw new Error(t('departments.storageRequired'));
                }

                // Create or update translation if translations are provided
                let name_i18n = formData.name_i18n;
                if (formData.name_en || formData.name_ru || formData.name) {
                    const translationData: any = {
                        en: formData.name_en || '',
                        ru: formData.name_ru || '',
                        uz: formData.name || '', // Primary name is always Uzbek
                    };

                    if (!isNew && name_i18n) {
                        // Update existing translation when editing
                        await updateTranslation(name_i18n, translationData);
                        // Revalidate translations cache to reflect the update immediately
                        await mutate(endpoints.translations.list);
                    } else if (isNew && !name_i18n) {
                        // Create new translation when creating
                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    }
                }

                const departmentData: IDepartmentFormData = {
                    name: formData.name,
                    name_i18n,
                    color_code: formData.color_code || '',
                    picture_url: formData.picture_url || '',
                    storage_id: formData.storage_id,
                };

                if (isNew) {
                    await createDepartment(departmentData);
                    // Revalidate departments list to show the new department
                    await mutate(endpoints.department.list);
                    await mutate(endpoints.translations.list);
                } else if (id) {
                    await updateDepartment(id, departmentData);
                    // Revalidate department cache to reflect the update immediately
                    await mutate(endpoints.department.details(id));
                    await mutate(endpoints.department.list);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, CACHE_SYNC_DELAY_MS));

                // Only redirect if we're not already navigating away
                router.push(paths.menu.product.root);
            } catch (err) {
                console.error('Error saving department:', err);
                // Re-throw the error to be handled by the GenericEditView
                // This ensures loading state is properly reset
                throw err;
            }
        },
        [isNew, id, createDepartment, updateDepartment, router, t, createTranslation, updateTranslation]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            if (id) {
                await deleteDepartment(id);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, DELETE_SYNC_DELAY_MS));
                router.push(paths.menu.product.root);
            }
        } catch (err) {
            console.error('Error deleting department:', err);
            throw err;
        }
    }, [id, deleteDepartment, router]);

    const config: GenericEditViewConfig = {
        title: isNew ? t('departments.new') : t('departments.edit'),
        entityName: 'department',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('departments.title'), href: paths.menu.product.root },
            { name: isNew ? t('departments.new') : t('departments.edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [
            BASIC_INFO_SECTION_T,
            COLOR_AND_STORAGE_SECTION_T,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
         
                <GenericEditView
                    config={config}
                    data={department}
                    isNew={isNew}
                    loading={!isNew && departmentLoading}
                />
            </Box>
        </Box>
    );
}

function buildImageSection(): CardSection {
    return {
        id: 'image',
        title: 'departments.imageTitle',
        fields: [
            {
                key: 'picture_url',
                label: 'departments.imageUrl',
                type: 'image',
                defaultValue: null,
                height: 250,
            },
        ],
    };
}

function buildBasicInfoSection(): CardSection {
    return {
        id: 'basic',
        title: 'departments.basicInfo',
        columns: 1,
        fields: [
            {
                key: 'name',
                label: 'departments.name',
                type: 'text',
                required: true,
                defaultValue: '',
                // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
            },
            {
                key: 'name_en',
                label: 'departments.nameEn',
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'name_ru',
                label: 'departments.nameRu',
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'color_code',
                label: 'departments.color',
                type: 'color',
                required: true,
                defaultValue: '#FF4842',
                colors: COLOR_CODES,
            },
        ],
    };
}

function buildColorAndStorageSection(
    storageOptions: Array<{ value: string; label: string }>
): CardSection {
    return {
        id: 'storage',
        title: 'departments.storageSection',
        columns: 1,
        fields: [
            {
                key: 'storage_id',
                label: 'departments.storageId',
                type: 'select',
                required: true,
                defaultValue: '',
                options: storageOptions,
            },
        ],
    };
}

