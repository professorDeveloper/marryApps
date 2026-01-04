import type { IProductItem } from 'src/types/departments';

export const PRODUCT_GENDER_OPTIONS = [
  { label: 'Men', value: 'Men' },
  { label: 'Women', value: 'Women' },
  { label: 'Kids', value: 'Kids' },
];

export const PRODUCT_CATEGORY_OPTIONS = ['Shose', 'Apparel', 'Accessories'];

export const PRODUCT_RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];

export const PRODUCT_COLOR_OPTIONS = [
  '#FF4842',
  '#1890FF',
  '#FFC0CB',
  '#00AB55',
  '#FFC107',
  '#7F00FF',
  '#000000',
  '#FFFFFF',
];

export const PRODUCT_COLOR_NAME_OPTIONS = [
  { value: '#FF4842', label: 'Red' },
  { value: '#1890FF', label: 'Blue' },
  { value: '#FFC0CB', label: 'Pink' },
  { value: '#00AB55', label: 'Green' },
  { value: '#FFC107', label: 'Yellow' },
  { value: '#7F00FF', label: 'Violet' },
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
];

export const PRODUCT_SIZE_OPTIONS = [
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '8.5', label: '8.5' },
  { value: '9', label: '9' },
  { value: '9.5', label: '9.5' },
  { value: '10', label: '10' },
  { value: '10.5', label: '10.5' },
  { value: '11', label: '11' },
  { value: '11.5', label: '11.5' },
  { value: '12', label: '12' },
  { value: '13', label: '13' },
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: 'in stock', label: 'Zaxirada mavjud' },
  { value: 'low stock', label: 'Zaxira kam' },
  { value: 'out of stock', label: 'Zaxira tugagan' },
];

export const PRODUCT_PUBLISH_OPTIONS = [
  { value: 'published', label: 'Nashr qilingan' },
  { value: 'draft', label: 'Qoralama' },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Eng yangi' },
  { value: 'priceDesc', label: 'Narx: Yuqori - Past' },
  { value: 'priceAsc', label: 'Narx: Past - Yuqori' },
];

export const PRODUCT_CATEGORY_GROUP_OPTIONS = [
  { group: 'Kiyim', classify: ['Ko\'ylaklar', 'T-ko\'ylak', 'Jeans', 'Charm', 'Aksessuarlar'] },
  { group: 'Tayyorlangan', classify: ['Kostyumlar', 'Blazerlar', 'Shim', 'Jiletka', 'Kiyim'] },
  { group: 'Aksessuarlar', classify: ['Tuflya', 'Sumkalar', 'Birgutlar', 'Yuz niqobi'] },
];

// ============================================================================
// MOCK PRODUCT DATA
// ============================================================================

const now = new Date();
const nowTimestamp = Math.floor(now.getTime() / 1000);

export const PRODUCT_MOCK_DATA: IProductItem[] = [
  {
    id: '1',
    sku: 'SKU-001',
    name: 'Oshxona',
    code: 'NK-2024-001',
    price: 120,
    taxes: 12,
    tags: ['shoes', 'premium', 'nike'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    publish: 'published',
    gender: ['Men'],
    coverUrl: 'https://shopcdnpro.grainajz.com/category/358773/1770/b2fb6a3d0513b533cb9650177f7df4c0/file_01725846449249.jpg',
    images: [
      'https://shopcdnpro.grainajz.com/category/358773/1770/b2fb6a3d0513b533cb9650177f7df4c0/file_01725846449249.jpg',
      'https://api-dev-minimal-v610.vercel.app/assets/images/products/product_2.jpg',
    ],
    colors: ['#000000', '#1890FF'],
    color: '#FF4842',
    quantity: 50,
    category: 'Shose',
    available: 50,
    totalSold: 120,
    description: 'High-quality premium Nike shoes for daily use and sports activities.',
    subDescription: 'Comfortable and durable',
    totalRatings: 4.5,
    totalReviews: 48,
    createdAt: nowTimestamp,
    inventoryType: 'in stock',
    priceSale: 99,
    reviews: [],
    ratings: [
      { name: '5', starCount: 5, reviewCount: 28 },
      { name: '4', starCount: 4, reviewCount: 15 },
      { name: '3', starCount: 3, reviewCount: 4 },
      { name: '2', starCount: 2, reviewCount: 1 },
      { name: '1', starCount: 1, reviewCount: 0 },
    ],
    newLabel: {
      content: 'NEW',
      enabled: true,
    },
    saleLabel: {
      content: 'SALE',
      enabled: true,
    },
  },
  {
    id: '2',
    sku: 'SKU-002',
    name: 'Bar',
    code: 'APR-2024-001',
    price: 85,
    taxes: 8.5,
    tags: ['jeans', 'classic', 'casual'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    publish: 'published',
    gender: ['Men', 'Women'],
    coverUrl: 'https://www.b21cocktailbar.com/wp-content/uploads/sites/197/2025/03/Sada-1.jpg',
    images: [
      'https://www.b21cocktailbar.com/wp-content/uploads/sites/197/2025/03/Sada-1.jpg',
      'https://api-dev-minimal-v610.vercel.app/assets/images/products/product_4.jpg',
    ],
    colors: ['#000000'],
    color: '#1890FF',
    quantity: 120,
    category: 'Apparel',
    available: 120,
    totalSold: 340,
    description: 'Stylish and comfortable classic blue jeans for everyday wear.',
    subDescription: 'Perfect fit and quality denim',
    totalRatings: 4.2,
    totalReviews: 92,
    createdAt: nowTimestamp - 7 * 24 * 60 * 60,
    inventoryType: 'in stock',
    priceSale: null,
    reviews: [],
    ratings: [
      { name: '5', starCount: 5, reviewCount: 45 },
      { name: '4', starCount: 4, reviewCount: 32 },
      { name: '3', starCount: 3, reviewCount: 10 },
      { name: '2', starCount: 2, reviewCount: 5 },
      { name: '1', starCount: 1, reviewCount: 0 },
    ],
    newLabel: {
      content: 'NEW',
      enabled: false,
    },
    saleLabel: {
      content: 'SALE',
      enabled: false,
    },
  },
];
