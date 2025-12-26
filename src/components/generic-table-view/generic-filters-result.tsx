import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';
import { upperFirst } from 'es-toolkit';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export interface GenericTableFilters {
    [key: string]: string[];
}

type Props<T extends GenericTableFilters> = FiltersResultProps & {
    filters: UseSetStateReturn<T>;
    filterKeys: (keyof T)[];
};

/**
 * Generic filters result component
 * Displays active filters as chips with remove functionality
 */
export function GenericFiltersResult<T extends GenericTableFilters>({
    filters,
    totalResults,
    sx,
    filterKeys,
}: Props<T>) {
    const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

    const handleRemoveFilter = useCallback(
        (key: keyof T, value: string) => {
            const newValue = (currentFilters[key] as string[]).filter((item) => item !== value);
            updateFilters({ [key]: newValue } as Partial<T>);
        },
        [updateFilters, currentFilters]
    );

    return (
        <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
            {filterKeys.map((key) => (
                <FiltersBlock
                    key={String(key)}
                    label={`${upperFirst(String(key))}:`}
                    isShow={!!(currentFilters[key] && currentFilters[key].length)}
                >
                    {currentFilters[key]?.map((item) => (
                        <Chip
                            {...chipProps}
                            key={item}
                            label={upperFirst(item)}
                            onDelete={() => handleRemoveFilter(key, item)}
                        />
                    ))}
                </FiltersBlock>
            ))}
        </FiltersResult>
    );
}
