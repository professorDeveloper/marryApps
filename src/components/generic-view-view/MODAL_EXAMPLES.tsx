/**
 * GenericViewModal - Table/List ma'lumotlari bilan ishlatish misollari
 * 
 * Bu faylda turli xil scenarios uchun misollar ko'rsatilgan:
 * 1. Products specifications (table)
 * 2. Drinks list (simple list)
 * 3. Orders (complex specifications)
 * 4. Meals (ingredients table)
 */

import { useState, useCallback } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { GenericViewModal, SpecificationsTable, type SpecificationRow } from 'src/components/generic-view-view';

// ============================================================================
// MOCK DATA
// ============================================================================

const DRINKS_DATA = [
    { id: '1', name: 'Coca-Cola', size: '2.0L', price: 20000, stock: 50 },
    { id: '2', name: 'Fanta', size: '1.5L', price: 15000, stock: 45 },
    { id: '3', name: 'Sprite', size: '1.5L', price: 15000, stock: 40 },
    { id: '4', name: 'Mirinda', size: '1.0L', price: 8000, stock: 60 },
    { id: '5', name: 'Juice', size: '0.5L', price: 5000, stock: 30 },
];

const PRODUCTS_DATA = [
    {
        id: '1',
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        price: 999,
        stock: 25,
        specs: [
            { label: 'Ekran', value: '6.7" Super Retina XDR' },
            { label: 'Processor', value: 'A17 Pro' },
            { label: 'RAM', value: '8GB' },
            { label: 'Storage', value: '256GB' },
            { label: 'Kamera', value: '48MP Main' },
        ]
    },
    {
        id: '2',
        name: 'MacBook Pro',
        category: 'Computers',
        price: 1999,
        stock: 10,
        specs: [
            { label: 'Processor', value: 'M3 Pro' },
            { label: 'RAM', value: '16GB' },
            { label: 'Storage', value: '512GB SSD' },
            { label: 'Display', value: '14" Liquid Retina' },
            { label: 'Battery', value: '18 saatga' },
        ]
    },
];

const MEALS_DATA = [
    {
        id: '1',
        name: 'Falafel Wrap',
        price: 8.99,
        ingredients: [
            { label: 'Falafel', value: '100g' },
            { label: 'Lettuce', value: 'Kamoq' },
            { label: 'Tomato', value: 'Salliq' },
            { label: 'Tahini', value: '30ml' },
            { label: 'Pita Bread', value: '1 dona' },
        ]
    },
    {
        id: '2',
        name: 'Caesar Salad',
        price: 9.99,
        ingredients: [
            { label: 'Romaine Lettuce', value: '200g' },
            { label: 'Parmesan', value: '50g' },
            { label: 'Croutons', value: '40g' },
            { label: 'Caesar Dressing', value: '50ml' },
            { label: 'Chicken Breast', value: '150g' },
        ]
    },
];

const ORDERS_DATA = [
    {
        id: 'ORD-001',
        customer: 'Ali Valiyev',
        status: 'Delivered',
        total: 45.99,
        items: 5,
        date: '2024-12-20',
        details: [
            { label: 'Order ID', value: 'ORD-001' },
            { label: 'Soni', value: '5 ta mahsulot' },
            { label: 'Jami narx', value: '$45.99' },
            { label: 'Status', value: 'Yetkazilgan' },
            { label: 'Yuborish sanasi', value: '2024-12-20' },
        ]
    },
    {
        id: 'ORD-002',
        customer: 'Gulnora Shodmonova',
        status: 'Processing',
        total: 78.50,
        items: 8,
        date: '2024-12-27',
        details: [
            { label: 'Order ID', value: 'ORD-002' },
            { label: 'Soni', value: '8 ta mahsulot' },
            { label: 'Jami narx', value: '$78.50' },
            { label: 'Status', value: 'Tayyorlanmoqda' },
            { label: 'Kutilayotgan sana', value: '2024-12-29' },
        ]
    },
];

// ============================================================================
// EXAMPLE COMPONENTS
// ============================================================================

/**
 * MISAL 1: Drinks (Ichimliklar) Modal
 */
export function DrinkModalExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDrink, setSelectedDrink] = useState<typeof DRINKS_DATA[0] | null>(null);

    const handleViewDrink = (drink: typeof DRINKS_DATA[0]) => {
        setSelectedDrink(drink);
        setIsOpen(true);
    };

    const renderDrinkSpecs = useCallback(() => {
        if (!selectedDrink) return null;
        const specs: SpecificationRow[] = [
            { label: 'Nomi', value: selectedDrink.name },
            { label: 'Hajmi', value: selectedDrink.size },
            { label: 'Narxi', value: `${selectedDrink.price} so'mlik` },
            { label: 'Zaxira', value: `${selectedDrink.stock} dona` },
        ];
        return <SpecificationsTable rows={specs} />;
    }, [selectedDrink]);

    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                {DRINKS_DATA.map((drink) => (
                    <Button
                        key={drink.id}
                        variant="outlined"
                        onClick={() => handleViewDrink(drink)}
                    >
                        {drink.name}
                    </Button>
                ))}
            </Stack>

            <GenericViewModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedDrink(null);
                }}
                title={selectedDrink?.name || 'Ichimlik'}
                data={selectedDrink}
                renderContent={renderDrinkSpecs}
                position="right"
                slideDirection="left"
                maxWidth="sm"
            />
        </Box>
    );
}

/**
 * MISAL 2: Products (Mahsulotlar) bilan Specifications
 */
export function ProductModalExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS_DATA[0] | null>(null);

    const handleViewProduct = (product: typeof PRODUCTS_DATA[0]) => {
        setSelectedProduct(product);
        setIsOpen(true);
    };

    const renderProductSpecs = useCallback(() => {
        if (!selectedProduct) return null;
        return <SpecificationsTable rows={selectedProduct.specs} />;
    }, [selectedProduct]);

    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                {PRODUCTS_DATA.map((product) => (
                    <Button
                        key={product.id}
                        variant="outlined"
                        onClick={() => handleViewProduct(product)}
                    >
                        {product.name}
                    </Button>
                ))}
            </Stack>

            <GenericViewModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedProduct(null);
                }}
                title={selectedProduct?.name || 'Mahsulot'}
                data={selectedProduct}
                renderContent={renderProductSpecs}
                position="right"
                slideDirection="left"
                maxWidth="md"
            />
        </Box>
    );
}

/**
 * MISAL 3: Meals (Ovqat) - Ingredients table bilan
 */
export function MealModalExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<typeof MEALS_DATA[0] | null>(null);

    const handleViewMeal = (meal: typeof MEALS_DATA[0]) => {
        setSelectedMeal(meal);
        setIsOpen(true);
    };

    const renderMealSpecs = useCallback(() => {
        if (!selectedMeal) return null;
        return <SpecificationsTable rows={selectedMeal.ingredients} />;
    }, [selectedMeal]);

    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                {MEALS_DATA.map((meal) => (
                    <Button
                        key={meal.id}
                        variant="outlined"
                        onClick={() => handleViewMeal(meal)}
                    >
                        {meal.name}
                    </Button>
                ))}
            </Stack>

            <GenericViewModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedMeal(null);
                }}
                title={selectedMeal?.name || 'Ovqat'}
                data={selectedMeal}
                renderContent={renderMealSpecs}
                position="right"
                slideDirection="left"
                maxWidth="sm"
            />
        </Box>
    );
}

/**
 * MISAL 4: Orders (Buyurtmalar) - Order details table bilan
 */
export function OrderModalExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<typeof ORDERS_DATA[0] | null>(null);

    const handleViewOrder = (order: typeof ORDERS_DATA[0]) => {
        setSelectedOrder(order);
        setIsOpen(true);
    };

    const renderOrderSpecs = useCallback(() => {
        if (!selectedOrder) return null;
        return <SpecificationsTable rows={selectedOrder.details} />;
    }, [selectedOrder]);

    return (
        <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                {ORDERS_DATA.map((order) => (
                    <Button
                        key={order.id}
                        variant="outlined"
                        onClick={() => handleViewOrder(order)}
                    >
                        {order.id}
                    </Button>
                ))}
            </Stack>

            <GenericViewModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setSelectedOrder(null);
                }}
                title={selectedOrder?.id || 'Buyurtma'}
                data={selectedOrder}
                renderContent={renderOrderSpecs}
                position="right"
                slideDirection="left"
                maxWidth="sm"
            />
        </Box>
    );
}

// ============================================================================
// CONSOLIDATED EXAMPLE - BARCHA BIRGA
// ============================================================================

export function ModalExamplesShowcase() {
    return (
        <Stack spacing={4}>
            <Box>
                <h3>Ichimliklar (Drinks)</h3>
                <DrinkModalExample />
            </Box>

            <Box>
                <h3>Mahsulotlar (Products)</h3>
                <ProductModalExample />
            </Box>

            <Box>
                <h3>Ovqatlar (Meals)</h3>
                <MealModalExample />
            </Box>

            <Box>
                <h3>Buyurtmalar (Orders)</h3>
                <OrderModalExample />
            </Box>
        </Stack>
    );
}
