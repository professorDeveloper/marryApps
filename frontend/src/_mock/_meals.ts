import type { IMealsItem } from 'src/types/meals';

// ============================================================================
// MOCK DATA - Backend'dan real data olinganda bu file ishlatilmaydi
// ============================================================================
// Faqat test yoki offline mode uchun

export const mockMeals: IMealsItem[] = [
    {
        id: '1',
        name: 'Osh',
        description: 'Milliy taom - Osh',
        category_id: 'cat-1',
        category: {
            id: 'cat-1',
            name: 'Milliy Taomlar',
        },
        department_id: 'dept-1',
        department: {
            id: 'dept-1',
            name: 'Oshxona',
        },
        picture_url:
            'https://www.shutterstock.com/shutterstock/photos/2488727069/display_1500/stock-photo-palov-osh-which-is-one-of-uzbek-cuisine-2488727069.jpg',
        price: 30000,
        cook_time: 40,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coverUrl:
            'https://www.shutterstock.com/shutterstock/photos/2488727069/display_1500/stock-photo-palov-osh-which-is-one-of-uzbek-cuisine-2488727069.jpg',
    },
    {
        id: '2',
        name: 'Haggi',
        description: 'Fast Food - Haggi',
        category_id: 'cat-2',
        category: {
            id: 'cat-2',
            name: 'Fast Food',
        },
        department_id: 'dept-1',
        department: {
            id: 'dept-1',
            name: 'Oshxona',
        },
        picture_url:
            'https://imageproxy.wolt.com/menu/menu-images/669105f598f9f8adccf97e39/97fe25e4-d740-11f0-b813-7aeae949e502_d966f41d881e3f7d54e63cbaa4d7587a.png',
        price: 15000,
        cook_time: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coverUrl:
            'https://imageproxy.wolt.com/menu/menu-images/669105f598f9f8adccf97e39/97fe25e4-d740-11f0-b813-7aeae949e502_d966f41d881e3f7d54e63cbaa4d7587a.png',
    },
    {
        id: '3',
        name: "Uyg'ur lag'mon",
        description: "Uyg'ur milliy taom - Lag'mon",
        category_id: 'cat-3',
        category: {
            id: 'cat-3',
            name: "Uyg'ur Taomlar",
        },
        department_id: 'dept-1',
        department: {
            id: 'dept-1',
            name: 'Oshxona',
        },
        picture_url:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGJcGxMOOCjpMV6eYxJuH_4wa-NE-2ztlwjg&s',
        price: 60000,
        cook_time: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coverUrl:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGJcGxMOOCjpMV6eYxJuH_4wa-NE-2ztlwjg&s',
    },
    {
        id: '4',
        name: 'Manti',
        description: 'Milliy taom - Manti',
        category_id: 'cat-1',
        category: {
            id: 'cat-1',
            name: 'Milliy Taomlar',
        },
        department_id: 'dept-1',
        department: {
            id: 'dept-1',
            name: 'Oshxona',
        },
        picture_url:
            'https://cdn.tveda.ru/thumbs/13f/13fb7f86894176fbf3137bc728d083f0/3252227abdbd4aa2064f9a01fff6d164.jpg',
        price: 6000,
        cook_time: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coverUrl:
            'https://cdn.tveda.ru/thumbs/13f/13fb7f86894176fbf3137bc728d083f0/3252227abdbd4aa2064f9a01fff6d164.jpg',
    },
];