import type { ICategory } from 'src/types/category';

// ============================================================================
// MOCK CATEGORY DATA - REAL API FORMAT
// ============================================================================

export const CATEGORY_MOCK_DATA: ICategory[] = [
    {
        id: '19b8e2dc-b36d-4563-8f54-6ea943fe1241',
        name: 'ichimliklar',
        name_i18n: '0ae8c864-fad1-4f91-9f50-b12cf24d04c4',
        picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-0TWmsU3avbKVWgSYZImP7u2sz3PAv7IyFg&s',
        storage_id: 'dde715d4-bc56-43e7-96b9-9bd927a397dd',
        department_id: 'dept-001',
        created_at: '2026-01-05T08:45:33.838869Z',
        updated_at: '2026-01-05T08:45:33.838869Z',
    },
    {
        id: '2c2f557f-b7ae-424e-a9e5-60870a2fc924',
        name: 'Appetizers',
        name_i18n: 'Appetizers2',
        picture_url: 'https://example.com/image.jpg',
        storage_id: 'dde715d4-bc56-43e7-96b9-9bd927a397dd',
        department_id: '6061013a-1f66-4d0e-9175-ce39a715420a',
        created_at: '2026-01-04T13:34:22.293788Z',
        updated_at: '2026-01-04T13:34:22.293788Z',
    },
];

// ============================================================================
// OLD OPTIONS (DEPRECATED - NOT USED)
// ============================================================================

export const CATEGORY_KITCHEN_OPTIONS = [
    { value: 'tushlik', label: 'Tushlik' },
    { value: 'kechki', label: 'Kechki' },
    { value: 'nonushta', label: 'Nonushta' },
    { value: 'snack', label: 'Snack' },
];

export const CATEGORY_WAREHOUSE_OPTIONS = [
    { value: 'ombor_1', label: 'Ombor 1' },
    { value: 'ombor_2', label: 'Ombor 2' },
    { value: 'ombor_3', label: 'Ombor 3' },
    { value: 'markaziy', label: 'Markaziy' },
];

export const CATEGORY_STATUS_OPTIONS = [
    { value: 'active', label: 'Faol' },
    { value: 'inactive', label: 'Faol emas' },
];
