import type { IDateValue } from './common';

// ============================================================================
// ORDER TYPES
// ============================================================================

export type IOrderTableFilters = {
    status: string[];
};

export type IOrderItem = {
    id: string;
    orderNumber: string;
    createdAt: IDateValue;
    customer: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string;
        ipAddress: string;
    };
    items: Array<{
        id: string;
        sku: string;
        name: string;
        quantity: number;
        price: number;
        coverUrl: string;
    }>;
    delivery: {
        shipBy: string;
        speedy: string;
        trackingNumber: string;
    };
    shippingAddress: {
        fullAddress: string;
        phoneNumber: string;
    };
    payment: {
        cardType: string;
        cardNumber: string;
    };
    history: {
        orderTime: IDateValue;
        paymentTime: IDateValue;
        deliveryTime: IDateValue;
        completionTime: IDateValue;
        timeline: Array<{
            title: string;
            time: IDateValue;
        }>;
    };
    subtotal: number;
    shipping: number;
    discount: number;
    taxes: number;
    totalAmount: number;
    totalQuantity: number;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
};
