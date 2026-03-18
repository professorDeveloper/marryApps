import type { GenericEditViewConfig } from './types';

/**
 * Builds the initial form data object from the configuration.
 * It iterates through all sections and fields to set default values.
 * @param config - The configuration object for the edit view.
 * @returns An object with initial data for the form.
 */
export function buildInitialFormData(config: GenericEditViewConfig): Record<string, any> {
    const initialData: Record<string, any> = {};

    // Add default fields for translations if not present
    initialData.name_en = '';
    initialData.name_ru = '';

    if (config.leftSidecard) {
        for (const field of config.leftSidecard.fields) {
            initialData[field.key] = field.defaultValue ?? null;
        }
    }

    for (const section of config.sections) {
        for (const field of section.fields) {
            initialData[field.key] = field.defaultValue ?? null;
        }
    }

    return initialData;
}