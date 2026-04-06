import type { StorageNameCellProps } from '../types';

/**
 * Storage name renderer
 */
export function StorageNameCell({ category }: StorageNameCellProps) {
    const storageName = category.storage_name || '-';
    return <span>{storageName}</span>;
}
