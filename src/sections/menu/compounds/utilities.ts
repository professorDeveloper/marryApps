import type { TFunction } from 'i18next';
import type { CardSection } from 'src/components/generic-edit-view/types';

// Color palette used across edit views - using CSS variables from global.css
export const COLOR_CODES = [
    'var(--color-danger-500)', // Error/Red
    'var(--color-info-500)', // Info/Blue
    'var(--color-success-500)', // Success/Green
    'var(--color-warning-500)', // Warning/Yellow
    'var(--color-secondary-500)', // Secondary/Violet
    'var(--color-primary-500)', // Primary/Orange
    'var(--color-danger-100)', // Light Error
    'var(--color-danger-600)', // Danger/Dark Red
    'var(--color-info-100)', // Light Info
    'var(--color-warning-300)', // Light Warning
    'var(--color-text)', // Black text color
    'var(--color-text-on-primary)', // White
];

// Cache sync delays
export const CACHE_SYNC_DELAY_MS = 300;
export const DELETE_SYNC_DELAY_MS = 500;

// Persist keys
export const DEPARTMENTS_TABLE_PERSIST_KEY = 'departments-list';

/**
 * Runtime helper: translate CardSection objects that may contain translation keys
 */
export function translateSection(section: CardSection, t: TFunction): CardSection {
    const mapped = { ...section } as CardSection;

    // translate title if it looks like a key
    if (typeof mapped.title === 'string' && mapped.title.includes('.')) {
        mapped.title = t(mapped.title as string, mapped.title as string);
    }

    if (Array.isArray(mapped.fields)) {
        mapped.fields = mapped.fields.map((f) => {
            const nf = { ...f };
            if (typeof nf.label === 'string' && nf.label.includes('.')) {
                nf.label = t(nf.label as string, nf.label as string);
            }
            if (nf.options && Array.isArray(nf.options)) {
                nf.options = nf.options.map((opt) => ({
                    ...opt,
                    label:
                        typeof opt.label === 'string' && opt.label.includes('.')
                            ? t(opt.label as string, opt.label as string)
                            : opt.label,
                }));
            }
            return nf;
        });
    }
    return mapped;
}

/**
 * Map storage items to option format for select fields
 */
export function mapStoragesToOptions(
    storages: Array<{ id: string; name?: string }>
): Array<{ value: string; label: string }> {
    return Array.isArray(storages)
        ? storages.map((s) => ({
              value: s.id,
              label: s.name || s.id,
          }))
        : [];
}

/**
 * Create a lookup map from an array of items
 */
export function createLookupMap<T, K extends string | number>(
    items: T[],
    keyField: keyof T,
    valueField: keyof T
): Map<K, T[keyof T]> {
    const map = new Map<K, T[keyof T]>();
    items.forEach((item) => {
        map.set(item[keyField] as unknown as K, item[valueField]);
    });
    return map;
}