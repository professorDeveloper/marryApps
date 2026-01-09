import type { IDepartmentFormData } from 'src/types/departments.tsx';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { useGetStorages, useGetDepartment, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from 'src/actions/departments';

import { GenericEditView } from 'src/components/generic-edit-view';

export interface DepartmentEditViewProps {
    isNew?: boolean;
}

export function ProductEditView({ isNew = false }: DepartmentEditViewProps) {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string | undefined;
    const { t } = useTranslation('menu');
    const { createDepartment } = useCreateDepartment();
    const { updateDepartment } = useUpdateDepartment();
    const { deleteDepartment } = useDeleteDepartment();
    const { storages } = useGetStorages();

    // Load department if editing
    const { department, departmentLoading } = useGetDepartment(!isNew && id ? id : '');

    // Build storage options
    const storageOptions = useMemo(
        () => storages.map((s) => ({
            value: s.id,
            label: s.name || s.id,
        })),
        [storages]
    );


    // Create section configs with translations
    const BASIC_INFO_SECTION: CardSection = {
        id: 'basic',
        title: t('departments.basicInfo'),
        columns: 2,
        fields: [
            {
                key: 'name',
                label: t('departments.name'),
                type: 'text',
                required: true,
                defaultValue: '',
                placeholder: 'e.g., Kitchen',
            },
            {
                key: 'name_i18n',
                label: t('departments.name_i18n'),
                type: 'text',
                required: false,
                defaultValue: '',
                placeholder: 'e.g., ошхона (Uzbek)',
            },
        ],
    };

    const STORAGE_SECTION: CardSection = {
        id: 'storage',
        title: t('departments.storageSection'),
        columns: 1,
        fields: [
            {
                key: 'storage_id',
                label: t('departments.storageId'),
                type: 'select',
                required: true,
                defaultValue: '',
                options: storageOptions,
            },
        ],
    };

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                const departmentData: IDepartmentFormData = {
                    name: formData.name,
                    name_i18n: formData.name_i18n,
                    storage_id: formData.storage_id,
                };

                if (isNew) {
                    await createDepartment(departmentData);
                } else if (id) {
                    await updateDepartment(id, departmentData);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push(paths.menu.product.root);
            } catch (err) {
                console.error('Error saving department:', err);
                // Re-throw the error to be handled by the form
                throw err;
            }
        },
        [isNew, id, createDepartment, updateDepartment, router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            if (id) {
                await deleteDepartment(id);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push(paths.menu.product.root);
            }
        } catch (err) {
            console.error('Error deleting department:', err);
            throw err;
        }
    }, [id, deleteDepartment, router]);

    const config: GenericEditViewConfig = {
        title: t('departments.title'),
        entityName: t('departments.title'),
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('departments.title'), href: paths.menu.product.root },
            { name: isNew ? t('departments.add') : t('departments.edit'), href: '' },
        ],
        sections: [
            BASIC_INFO_SECTION,
            STORAGE_SECTION,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <GenericEditView
            config={config}
            data={department}
            isNew={isNew}
            loading={!isNew && departmentLoading}
        />
    );
}
