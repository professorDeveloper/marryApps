import type { TFunction } from 'i18next';
import type { CardSection } from 'src/components/generic-edit-view/types';

// Color palette used across edit views
export const COLOR_CODES = [
    '#FF4842', // Red
    '#1890FF', // Blue
    '#00AB55', // Green
    '#FFC107', // Yellow
    '#7F00FF', // Violet
    '#FF6B35', // Orange
    '#FF1493', // Deep Pink
    '#00CED1', // Dark Turquoise
    '#FFD700', // Gold
    '#8B4513', // Saddle Brown
    '#000000', // Black
    '#FFFFFF', // White
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