/**
 * Unit Conversion Configuration
 * This file contains all configuration related to unit conversion
 * between pixels, meters, and centimeters
 */

/**
 * Pixels per meter ratio
 * Default: 100 pixels = 1 meter
 * 
 * This can be adjusted based on your application's needs:
 * - 100px/m: 1 pixel = 1cm (easier calculations)
 * - 50px/m: 1 pixel = 2cm
 * - 200px/m: 1 pixel = 0.5cm (more precise)
 */
export const CONVERSION_CONFIG = {
    // Conversion ratios
    PIXELS_PER_METER: 100,
    PIXELS_PER_CENTIMETER: 1,

    // Default dimensions for halls (in meters)
    DEFAULT_HALL_WIDTH_METERS: 8,
    DEFAULT_HALL_HEIGHT_METERS: 6,

    // Default dimensions for cafe tables (in meters)
    DEFAULT_TABLE_WIDTH_METERS: 0.8,
    DEFAULT_TABLE_HEIGHT_METERS: 0.6,

    // Grid size (in centimeters)
    GRID_SIZE_CENTIMETERS: 20,

    // Minimum dimensions (in centimeters)
    MIN_TABLE_WIDTH_CM: 30,
    MIN_TABLE_HEIGHT_CM: 30,
    MIN_HALL_WIDTH_CM: 200,
    MIN_HALL_HEIGHT_CM: 200,

    // Maximum dimensions (in meters)
    MAX_TABLE_WIDTH_M: 3,
    MAX_TABLE_HEIGHT_M: 3,
    MAX_HALL_WIDTH_M: 50,
    MAX_HALL_HEIGHT_M: 50,
} as const;

/**
 * Unit display preferences
 */
export const UNIT_DISPLAY = {
    // Default unit for display
    DEFAULT_UNIT: 'm' as const,

    // Unit labels
    LABELS: {
        m: 'Meters',
        cm: 'Centimeters',
    },

    // Unit symbols
    SYMBOLS: {
        m: 'm',
        cm: 'cm',
    },

    // Decimal places for display
    DECIMAL_PLACES: {
        m: 2,
        cm: 1,
    },
} as const;
