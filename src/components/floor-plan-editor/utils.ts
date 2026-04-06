/**
 * Floor Plan Editor - Utility Functions
 */

import type { Table, CollisionCheckResult } from './types';

import { GRID_SIZE, ROTATION_SNAP, DEFAULT_TABLE_WIDTH, DEFAULT_TABLE_HEIGHT } from './types';

/**
 * Generate unique ID for tables
 */
export const generateTableId = (): string => `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Collision detection using AABB (Axis-Aligned Bounding Box)
 */
export const checkCollision = (
    table1: Table,
    table2: Table,
    padding: number = 10
): boolean => {
    const p = padding;

    return (
        table1.x - p < table2.x + table2.width + p &&
        table1.x + table1.width + p > table2.x - p &&
        table1.y - p < table2.y + table2.height + p &&
        table1.y + table1.height + p > table2.y - p
    );
};

/**
 * Find colliding table
 */
export const findCollidingTable = (
    draggedTable: Table,
    otherTables: Table[],
    padding?: number
): CollisionCheckResult => {
    const collidingTable = otherTables.find(
        (table) => table.id !== draggedTable.id && checkCollision(draggedTable, table, padding)
    );

    return {
        isColliding: !!collidingTable,
        collidingTableId: collidingTable?.id,
    };
};

/**
 * Get nearest empty position for a new table
 */
export const findNearestEmptyPosition = (
    tables: Table[],
    hallWidth: number,
    hallHeight: number,
    tableWidth: number = DEFAULT_TABLE_WIDTH,
    tableHeight: number = DEFAULT_TABLE_HEIGHT
): { x: number; y: number } => {
    const padding = 40;
    // Calculate spacing as table size + 30 pixel gap between tables
    const gridSpacingX = tableWidth + 50;
    const gridSpacingY = tableHeight + 50;

    for (let y = padding; y < hallHeight - tableHeight - padding; y += gridSpacingY) {
        for (let x = padding; x < hallWidth - tableWidth - padding; x += gridSpacingX) {
            const testTable: Table = {
                id: 'test',
                number: 0,
                x,
                y,
                width: tableWidth,
                height: tableHeight,
                rotation: 0,
                seats: 4,
            };

            const collision = findCollidingTable(testTable, tables, 5);
            if (!collision.isColliding) {
                return { x, y };
            }
        }
    }

    return { x: padding, y: padding };
};

/**
 * Snap rotation to nearest value
 */
export const snapRotation = (rotation: number, snapDegrees: number = ROTATION_SNAP): number => Math.round(rotation / snapDegrees) * snapDegrees;

/**
 * Snap position to grid
 */
export const snapToGrid = (
    position: number,
    gridSize: number = GRID_SIZE,
    enabled: boolean = true
): number => {
    if (!enabled) return position;
    return Math.round(position / gridSize) * gridSize;
};

/**
 * Clamp position within bounds
 */
export const clampPosition = (
    x: number,
    y: number,
    width: number,
    height: number,
    maxX: number,
    maxY: number,
    padding: number = 10
): { x: number; y: number } => ({
        x: Math.max(padding, Math.min(x, maxX - width - padding)),
        y: Math.max(padding, Math.min(y, maxY - height - padding)),
    });

/**
 * Calculate next table number
 */
export const getNextTableNumber = (tables: Table[]): number => {
    if (tables.length === 0) return 1;
    return Math.max(...tables.map((t) => t.number)) + 1;
};

/**
 * Rotate point around center
 */
export const rotatePoint = (
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    angle: number // in degrees
): { x: number; y: number } => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = x - centerX;
    const dy = y - centerY;

    return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
    };
};

/**
 * Get rotated bounding box for collision detection
 */
export const getRotatedBounds = (table: Table): { minX: number; maxX: number; minY: number; maxY: number } => {
    if (table.rotation === 0) {
        return {
            minX: table.x,
            maxX: table.x + table.width,
            minY: table.y,
            maxY: table.y + table.height,
        };
    }

    const centerX = table.x + table.width / 2;
    const centerY = table.y + table.height / 2;

    const corners = [
        { x: table.x, y: table.y },
        { x: table.x + table.width, y: table.y },
        { x: table.x + table.width, y: table.y + table.height },
        { x: table.x, y: table.y + table.height },
    ];

    const rotated = corners.map((corner) => rotatePoint(corner.x, corner.y, centerX, centerY, table.rotation));

    const xs = rotated.map((p) => p.x);
    const ys = rotated.map((p) => p.y);

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
    };
};
