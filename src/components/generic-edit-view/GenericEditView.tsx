import type { FC } from 'react';
import type { GenericEditViewProps } from './types';
import type { FieldConfig, SectionConfig, EditViewConfig } from 'src/components/generic-edit-v2';

import { useMemo, useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { GenericEditV2 } from 'src/components/generic-edit-v2';

export const GenericEditView: FC<GenericEditViewProps> = ({
    config,
    data,
    isNew = false,
    loading = false,
    onFormDataChange,
}) => {
    const router = useRouter();

    const mapField = useCallback(
        (field: any): FieldConfig<Record<string, any>> => ({
            key: field.key,
            label: field.label,
            // Backward compatibility: old GenericEditView often used `type: 'url'`
            // for picture fields, but V2 expects `type: 'image'` for uploader UI.
            type: field.type === 'url' && field.key === 'picture_url' ? 'image' : field.type,
            required: field.required,
            placeholder: field.placeholder,
            multiline: field.multiline,
            rows: field.rows,
            options: field.options,
            defaultValue: field.defaultValue,
            helperText: field.helperText,
            fullWidth: field.fullWidth,
            colors: field.colors,
            height: field.height,
        }),
        []
    );

    const mapSection = useCallback(
        (section: any): SectionConfig<Record<string, any>> => ({
            id: section.id,
            title: section.title,
            columns: section.columns === 2 ? 2 : 1,
            fields: (section.fields || []).map(mapField),
        }),
        [mapField]
    );

    const v2Config: EditViewConfig<Record<string, any>> = useMemo(
        () => ({
            entityName: config.entityName,
            breadcrumbs: config.breadcrumbs,
            showBreadcrumbs: config.showBreadcrumbs,
            showDeleteButton: config.showDeleteButton,
            deleteConfirmMessage: config.deleteConfirmMessage,
            sidebar: config.leftSidecard ? mapSection(config.leftSidecard) : undefined,
            sections: (config.sections || []).map(mapSection),
        }),
        [config, mapSection]
    );

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            await config.onSubmit(formData);
            onFormDataChange?.(formData);
        },
        [config, onFormDataChange]
    );

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <GenericEditV2
            data={data ?? null}
            config={v2Config}
            isNew={isNew}
            loading={loading}
            onSubmit={handleSubmit}
            onDelete={config.onDelete}
            onCancel={handleCancel}
            title={config.title}
        />
    );
};
