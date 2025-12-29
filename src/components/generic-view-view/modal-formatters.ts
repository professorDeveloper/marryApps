/**
 * Modal Formatters - Har xil data turlari uchun universal formatting utilitylar
 * Tarikh, raqam, status va boshqa ma'lumotlarni formatlash uchun
 */

// ============================================================================
// DATE FORMATTERS
// ============================================================================

export const formatDate = (date: any, locale: string = 'uz-UZ'): string => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(dateObj);
    } catch {
        return String(date);
    }
};

export const formatDateTime = (date: any, locale: string = 'uz-UZ'): string => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(dateObj);
    } catch {
        return String(date);
    }
};

export const formatTime = (date: any): string => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(dateObj);
    } catch {
        return String(date);
    }
};

// ============================================================================
// NUMBER FORMATTERS
// ============================================================================

export const formatPrice = (price: number | string, currency: string = 'UZS'): string => {
    if (!price && price !== 0) return '-';

    try {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
    } catch {
        return String(price);
    }
};

export const formatQuantity = (quantity: number | string): string => {
    if (!quantity && quantity !== 0) return '-';

    try {
        const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
        return new Intl.NumberFormat('uz-UZ').format(num);
    } catch {
        return String(quantity);
    }
};

export const formatNumber = (num: number | string, decimals: number = 2): string => {
    if (!num && num !== 0) return '-';

    try {
        const number = typeof num === 'string' ? parseFloat(num) : num;
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(number);
    } catch {
        return String(num);
    }
};

// ============================================================================
// STATUS FORMATTERS
// ============================================================================

export const statusMap = {
    // Order / Semifinished statuses
    pending: { label: 'Kutilmoqda', color: 'warning' as const },
    completed: { label: 'Tugatilgan', color: 'success' as const },
    cancelled: { label: 'Bekor qilindi', color: 'error' as const },
    refunded: { label: 'Qaytarilgan', color: 'info' as const },

    // Product statuses
    published: { label: 'Nashr qilindi', color: 'success' as const },
    draft: { label: 'Qoralama', color: 'warning' as const },

    // Category statuses
    active: { label: 'Faol', color: 'success' as const },
    inactive: { label: 'Nofaol', color: 'error' as const },

    // Stock statuses
    'in stock': { label: 'Zaxirada bor', color: 'success' as const },
    'low stock': { label: 'Kam zaxira', color: 'warning' as const },
    'out of stock': { label: 'Zaxirada yo\'q', color: 'error' as const },
};

export const formatStatus = (status: string): { label: string; color: 'success' | 'warning' | 'error' | 'info' } => {
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'info' as const };
};

// ============================================================================
// STRING FORMATTERS
// ============================================================================

export const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '-';

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
        return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10)}`;
    }
    return phone;
};

export const formatEmail = (email: string | undefined): string => {
    if (!email) return '-';
    return email;
};

export const formatAddress = (address: string | undefined): string => {
    if (!address) return '-';
    return address;
};

export const truncateText = (text: string | undefined, maxLength: number = 50): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
};

// ============================================================================
// ARRAY FORMATTERS
// ============================================================================

export const formatArray = (arr: any[] | undefined, separator: string = ', '): string => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '-';
    return arr.join(separator);
};

export const formatTag = (tag: string | undefined): string => {
    if (!tag) return '-';
    return tag;
};

// ============================================================================
// UNIT FORMATTERS
// ============================================================================

export const unitMap = {
    kg: 'kg',
    g: 'g',
    l: 'l',
    ml: 'ml',
    m: 'm',
    cm: 'cm',
    dona: 'dona',
    paket: 'paket',
};

export const formatUnit = (unit: string | undefined): string => {
    if (!unit) return '-';
    return unitMap[unit as keyof typeof unitMap] || unit;
};

// ============================================================================
// BATCH FORMATTER - SHU MA'LUMOTGA QO'LLANILADI
// ============================================================================

export const formatField = (value: any, type: 'price' | 'date' | 'datetime' | 'quantity' | 'status' | 'phone' | 'email' | 'text' | 'unit' | 'array' = 'text'): string => {
    switch (type) {
        case 'price':
            return formatPrice(value);
        case 'date':
            return formatDate(value);
        case 'datetime':
            return formatDateTime(value);
        case 'quantity':
            return formatQuantity(value);
        case 'status':
            return formatStatus(value).label;
        case 'phone':
            return formatPhoneNumber(value);
        case 'email':
            return formatEmail(value);
        case 'unit':
            return formatUnit(value);
        case 'array':
            return formatArray(value);
        default:
            return String(value ?? '-');
    }
};
