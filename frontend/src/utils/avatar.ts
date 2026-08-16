/**
 * Generate avatar color based on name
 * Odam nomiga qarab rangi yaratadi
 */
export function getAvatarColor(name: string): string {
    const colors = [
        '#FF6B00'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

/**
 * Get initials from name for avatar
 * Nomdan birinchi harfni oladi
 */
export function getInitials(name: string): string {
    if (!name || typeof name !== 'string') {
        return '?';
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return '?';
    }

    // Birinchi harfni oladi
    return trimmed.charAt(0).toUpperCase();
}

/**
 * Get avatar URL from picture_url only
 * Faqat yuklangan rasmni qaytaradi, bo'lmasa bo'sh string
 */
export function getAvatarUrl(name: string, pictureUrl?: string | null): string {
    if (pictureUrl) {
        return pictureUrl;
    }

    // Agar rasm bo'lmasa bo'sh string qaytaradi, initials avatarni avatarda ko'rsatadi
    return '';
}
