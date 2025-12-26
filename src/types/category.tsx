import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type ICategory = {
    id: string;
    name: string;
    slug: string;
    description: string;
    image?: string;
    productsCount: number;
    status: 'active' | 'inactive';
    kitchen?: string;
    warehouse?: string;
    createdAt: IDateValue;
    updatedAt: IDateValue;
};

export type ICategoryTableFilters = {
    status: string[];
};
