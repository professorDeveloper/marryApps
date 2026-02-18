/**
 * Floor Plan Editor - Type Definitions
 */

export interface Table {
    id: string;
    number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color?: string;
    seats: number;
}

export interface FloorPlanState {
    hallWidth: number;
    hallHeight: number;
    tables: Table[];
    selectedTableId: string | null;
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
}

export interface TableDragPosition {
    x: number;
    y: number;
}

export interface CollisionCheckResult {
    isColliding: boolean;
    collidingTableId?: string;
}

// Default values in pixels (1 meter = 100 pixels)
export const DEFAULT_TABLE_WIDTH = 80; // 0.8m
export const DEFAULT_TABLE_HEIGHT = 60; // 0.6m
export const DEFAULT_TABLE_SEATS = 4;
export const GRID_SIZE = 20; // 0.2m grid
export const ROTATION_SNAP = 15; // degrees
export const HALL_WIDTH = 800; // 8m
export const HALL_HEIGHT = 600; // 6m

// Unit conversion constants (in pixels)
export const PIXELS_PER_METER = 100;
export const PIXELS_PER_CENTIMETER = 1;

