import type { ICategory } from 'src/types/category';

// ============================================================================
// CATEGORY OPTIONS
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

// ============================================================================
// MOCK CATEGORY DATA
// ============================================================================

const now = Date.now();

export const CATEGORY_MOCK_DATA: ICategory[] = [
    {
        id: '1',
        name: 'Ichimliklar',
        slug: 'ichimliklar',
        description: 'Ichimliklar uchun zarur bo\'lgan barcha vositalar',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-0TWmsU3avbKVWgSYZImP7u2sz3PAv7IyFg&s',
        productsCount: 45,
        status: 'active',
        kitchen: 'tushlik',
        warehouse: 'ombor_1',
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
    },
    {
        id: '2',
        name: 'Mevalar',
        slug: 'mevalar',
        description: 'Mevalar uchun zarur bo\'lgan barcha vositalar',
        image: 'https://suret.pics/uploads/posts/2023-09/1695302331_1-1.jpeg',
        productsCount: 32,
        status: 'active',
        kitchen: 'kechki',
        warehouse: 'ombor_2',
        createdAt: now - 25 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
    },
    {
        id: '3',
        name: 'Turk ovqatlari',
        slug: 'turk-ovqatlari',
        description: 'Turk ovqatlari uchun zarur bo\'lgan mahsulotlar',
        image: 'https://cp.platina.uz/media/uploads/2023/12/20/photo_2023-12-20_14-07-05-2.jpg',
        productsCount: 28,
        status: 'inactive',
        kitchen: 'nonushta',
        warehouse: 'ombor_3',
        createdAt: now - 20 * 24 * 60 * 60 * 1000,
        updatedAt: now - 7 * 24 * 60 * 60 * 1000,
    },
    {
        id: '4',
        name: 'Suyuq ovqatlar',
        slug: 'suyuq-ovqatlar',
        description: 'Suyuq ovqatlar uchun mahsulotlar',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjmzTTtWKDMaw_xLtvlrkHSqSP-9hU4k-XAw&s',
        productsCount: 56,
        status: 'active',
        kitchen: 'snack',
        warehouse: 'markaziy',
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
    },
    {
        id: '5',
        name: 'Fast-food',
        slug: 'fast-food',
        description: 'Turli xil fast-food mahsulotlari',
        image: 'https://www.shutterstock.com/image-photo/various-fast-food-background-burgers-260nw-2613495945.jpg',
        productsCount: 38,
        status: 'inactive',
        kitchen: 'tushlik',
        warehouse: 'ombor_2',
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
        id: '6',
        name: 'Salatlar',
        slug: 'salatlar',
        description: 'Yangi salat va sabzavotlar',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5T6UAhrYvMbEvgY2DhVRJJGX5fEUaPRgkMg&s',
        productsCount: 52,
        status: 'active',
        kitchen: 'kechki',
        warehouse: 'ombor_1',
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 24 * 60 * 60 * 1000,
    },
    {
        id: '7',
        name: 'Souslar',
        slug: 'souslar',
        description: 'Pishgan va tayyorlangan taomlar',
        image: 'https://stradapizza.uz/wp-content/uploads/2023/10/37308-e1703098193890-430x235.jpg',
        productsCount: 24,
        status: 'inactive',
        kitchen: 'nonushta',
        warehouse: 'markaziy',
        createdAt: now - 35 * 24 * 60 * 60 * 1000,
        updatedAt: now - 10 * 24 * 60 * 60 * 1000,
    },
];
