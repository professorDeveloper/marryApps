/**
 * Unit Converter Utility
 * Converts between pixels, meters, and centimeters
 * Uses a configurable pixels-to-meter ratio
 */

import { CONVERSION_CONFIG } from './unit-config';

/**
 * Configuration for unit conversion
 */
export interface UnitConverterConfig {
    pxPerMeter: number; // How many pixels represent 1 meter
}

let config: UnitConverterConfig = {
    pxPerMeter: CONVERSION_CONFIG.PIXELS_PER_METER,
};

/**
 * Set the conversion configuration
 */
export const setUnitConverterConfig = (newConfig: Partial<UnitConverterConfig>) => {
    config = { ...config, ...newConfig };
};

/**
 * Get current conversion configuration
 */
export const getUnitConverterConfig = (): UnitConverterConfig => config;

/**
 * Convert pixels to meters
 * @param px - Value in pixels
 * @returns Value in meters (rounded to 2 decimal places)
 */
export const pxToMeters = (px: number): number => parseFloat((px / config.pxPerMeter).toFixed(2));

/**
 * Convert pixels to centimeters
 * @param px - Value in pixels
 * @returns Value in centimeters (rounded to 1 decimal place)
 */
export const pxToCentimeters = (px: number): number => parseFloat((px / (config.pxPerMeter / 100)).toFixed(1));

/**
 * Convert meters to pixels
 * @param meters - Value in meters
 * @returns Value in pixels (rounded to nearest integer)
 */
export const metersToPx = (meters: number): number => Math.round(meters * config.pxPerMeter);

/**
 * Convert centimeters to pixels
 * @param cm - Value in centimeters
 * @returns Value in pixels (rounded to nearest integer)
 */
export const centimetersToPx = (cm: number): number => Math.round(cm * (config.pxPerMeter / 100));

/**
 * Convert meters to centimeters
 * @param meters - Value in meters
 * @returns Value in centimeters
 */
export const metersToCentimeters = (meters: number): number => meters * 100;

/**
 * Convert centimeters to meters
 * @param cm - Value in centimeters
 * @returns Value in meters (rounded to 2 decimal places)
 */
export const centimetersToMeters = (cm: number): number => parseFloat((cm / 100).toFixed(2));

/**
 * Format a value for display with unit
 * @param value - The value to format
 * @param unit - The unit ('m' or 'cm')
 * @returns Formatted string (e.g., "5.5m", "550cm")
 */
export const formatWithUnit = (value: number, unit: 'm' | 'cm' = 'm'): string => {
    if (unit === 'm') {
        return `${value.toFixed(2)}m`;
    } else {
        return `${value.toFixed(1)}cm`;
    }
};

/**
 * Parse value with unit from string
 * @param str - String to parse (e.g., "5.5m" or "550cm")
 * @returns Value in meters
 */
export const parseUnitString = (str: string): number => {
    const match = str.trim().match(/^([\d.]+)\s*(m|cm)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || 'm';

    return unit === 'cm' ? centimetersToMeters(value) : value;
};

/**
 * Get dimensions in both units (meters and centimeters)
 * @param px - Value in pixels
 * @returns Object with meters and centimeters
 */
export const getPxInUnits = (px: number): { meters: number; centimeters: number; pixels: number } => ({
        pixels: px,
        meters: pxToMeters(px),
        centimeters: pxToCentimeters(px),
    });

/**
 * Get display string for dimensions
 * @param px - Value in pixels
 * @param unit - The unit to display ('m' or 'cm')
 * @returns Formatted string
 */
export const getDimensionDisplay = (px: number, unit: 'm' | 'cm' = 'm'): string => {
    if (unit === 'm') {
        return formatWithUnit(pxToMeters(px), 'm');
    } else {
        return formatWithUnit(pxToCentimeters(px), 'cm');
    }
};
