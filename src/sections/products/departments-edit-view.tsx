// ============================================================================
// DEPARTMENTS EDIT VIEW - REAL API INTEGRATION
// ============================================================================

import type { IDepartmentFormData } from 'src/types/departments';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { useGetDepartment, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from 'src/actions/departments';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface DepartmentEditViewProps {
    isNew?: boolean;
}

// ============================================================================
// FIELD CONFIGS
// ============================================================================

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'Asosiy ma\'lumotlar',
    columns: 2,
    fields: [
        {
            key: 'name',
            label: 'Department Name',
            type: 'text',
            required: true,
            defaultValue: '',
            placeholder: 'e.g., Kitchen',
        },
        {
            key: 'name_i18n',
            label: 'Name (i18n)',
            type: 'text',
            required: true,
            defaultValue: '',
            placeholder: 'e.g., ошхона (Uzbek)',
        },
    ],
};

const STORAGE_SECTION: CardSection = {
    id: 'storage',
    title: 'Storage',
    columns: 1,
    fields: [
        {
            key: 'storage_id',
            label: 'Storage ID',
            type: 'text',
            required: true,
            defaultValue: '',
            placeholder: 'e.g., 1234567890',
        },
    ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductEditView({ isNew = false }: DepartmentEditViewProps) {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string | undefined;
    const { createDepartment } = useCreateDepartment();
    const { updateDepartment } = useUpdateDepartment();
    const { deleteDepartment } = useDeleteDepartment();

    // Load department if editing
    const { department, departmentLoading } = useGetDepartment(!isNew && id ? id : '');

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

                // After successful save, redirect to department list
                router.push(paths.menu.product.root);
            } catch (err) {
                console.error('Error saving department:', err);
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
                router.push(paths.menu.product.root);
            }
        } catch (err) {
            console.error('Error deleting department:', err);
            throw err;
        }
    }, [id, deleteDepartment, router]);

    const config: GenericEditViewConfig = {
        title: 'Department',
        entityName: 'department',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Departments', href: paths.menu.product.root },
            { name: isNew ? 'New' : 'Edit', href: '' },
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
