import type { IOrderItem } from "src/types/order";

    // Mock order data - production'da API'dan olasiz
 export const mockOrders: IOrderItem[] = [
        {
            id: '1',
            orderNumber: '#60100',
            createdAt: new Date().toISOString() as any,
            customer: {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                avatarUrl: 'https://api-dev-minimal-v6.vercel.app/images/avatars/avatar_1.jpg',
                ipAddress: '192.168.1.1',
            },
            items: [
                {
                    id: '1',
                    sku: '16H9UR0',
                    name: 'Product Item 1',
                    quantity: 1,
                    price: 100,
                    coverUrl: 'https://api-dev-minimal-v6.vercel.app/images/products/product_1.jpg',
                },
            ],
            delivery: {
                shipBy: 'DHL',
                speedy: 'Standard',
                trackingNumber: 'SPX037739199373',
            },
            shippingAddress: {
                fullAddress: '123 Main St, City, Country',
                phoneNumber: '123-456-7890',
            },
            payment: {
                cardType: 'mastercard',
                cardNumber: '**** **** **** 5678',
            },
            history: {
                orderTime: new Date().toISOString() as any,
                paymentTime: new Date().toISOString() as any,
                deliveryTime: new Date().toISOString() as any,
                completionTime: new Date().toISOString() as any,
                timeline: [],
            },
            subtotal: 100,
            shipping: 10,
            discount: 10,
            taxes: 10,
            totalAmount: 110,
            totalQuantity: 1,
            status: 'pending',
        },
        {
            id: '2',
            orderNumber: '#60101',
            createdAt: new Date().toISOString() as any,
            customer: {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                avatarUrl: 'https://api-dev-minimal-v6.vercel.app/images/avatars/avatar_2.jpg',
                ipAddress: '192.168.1.2',
            },
            items: [
                {
                    id: '1',
                    sku: '16H9UR1',
                    name: 'Product Item 2',
                    quantity: 2,
                    price: 200,
                    coverUrl: 'https://api-dev-minimal-v6.vercel.app/images/products/product_2.jpg',
                },
            ],
            delivery: {
                shipBy: 'FedEx',
                speedy: 'Express',
                trackingNumber: 'SPX037739199374',
            },
            shippingAddress: {
                fullAddress: '456 Oak Ave, Town, Country',
                phoneNumber: '098-765-4321',
            },
            payment: {
                cardType: 'visa',
                cardNumber: '**** **** **** 1234',
            },
            history: {
                orderTime: new Date().toISOString() as any,
                paymentTime: new Date().toISOString() as any,
                deliveryTime: new Date().toISOString() as any,
                completionTime: new Date().toISOString() as any,
                timeline: [],
            },
            subtotal: 400,
            shipping: 15,
            discount: 20,
            taxes: 39.5,
            totalAmount: 434.5,
            totalQuantity: 2,
            status: 'completed',
        },
    ];