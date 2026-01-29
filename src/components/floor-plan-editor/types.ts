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

export const DEFAULT_TABLE_WIDTH = 80;
export const DEFAULT_TABLE_HEIGHT = 60;
export const DEFAULT_TABLE_SEATS = 4;
export const GRID_SIZE = 20;
export const ROTATION_SNAP = 15; // degrees
export const HALL_WIDTH = 700;
export const HALL_HEIGHT = 500;
