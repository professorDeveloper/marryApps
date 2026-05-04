/**
 * Standardized status color mapping for MUI Chip components
 * Provides consistent colors across all datatable status columns
 */

export type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/**
 * Common status color mapping - using deeper colors
 */
export const getStatusColor = (status: string): ChipColor => {
  const normalizedStatus = String(status || '').toLowerCase().trim();
  
  switch (normalizedStatus) {
    // Positive/Active statuses - use deep green
    case 'active':
    case 'completed':
    case 'ready':
    case 'served':
    case 'paid':
    case 'received':
    case 'success':
      return 'success';
    
    // Warning/Pending statuses - use deep orange  
    case 'draft':
    case 'pending':
    case 'reserved':
    case 'rescheduled':
    case 'cooking':
    case 'warning':
      return 'warning';
    
    // Negative/Inactive statuses - use deep red
    case 'cancelled':
    case 'deleted':
    case 'inactive':
    case 'error':
      return 'error';
    
    // Neutral/Info statuses - use deep blue
    case 'open':
    case 'processing':
    case 'info':
      return 'primary';
    
    // Default fallback - use deep gray
    default:
      return 'secondary';
  }
};

/**
 * Format status label for display (capitalize first letter)
 */
export const formatStatusLabel = (status: string): string => {
  if (!status) return '';
  return String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();
};
