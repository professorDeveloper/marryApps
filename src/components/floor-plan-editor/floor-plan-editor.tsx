import type { Table } from './types';

import { useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { FloorPlanCanvas } from './floor-plan-canvas';
import { FloorPlanSidebar } from './floor-plan-sidebar';
import { generateTableId, findNearestEmptyPosition } from './utils';
import {
    GRID_SIZE,
    HALL_WIDTH,
    HALL_HEIGHT,
    DEFAULT_TABLE_WIDTH,
    DEFAULT_TABLE_SEATS,
    DEFAULT_TABLE_HEIGHT,
} from './types';

interface FloorPlanEditorProps {
    hallWidth?: number;
    hallHeight?: number;
    hallId?: string;
    cafeTables?: any[];
}

export const FloorPlanEditor = ({ hallWidth, hallHeight, hallId, cafeTables }: FloorPlanEditorProps) => {
    const theme = useTheme();
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [draggedTableCoords, setDraggedTableCoords] = useState<{ x: number; y: number } | undefined>();
    const [changedTables, setChangedTables] = useState<Set<string>>(new Set()); // Track changed table IDs
    const [originalTables, setOriginalTables] = useState<Map<string, Table>>(new Map()); // Store original state

    // Use hall dimensions if provided, otherwise use defaults
    const effectiveHallWidth = hallWidth || HALL_WIDTH;
    const effectiveHallHeight = hallHeight || HALL_HEIGHT;

    // Initialize tables from API data when cafeTables prop changes
    useEffect(() => {
        if (cafeTables && cafeTables.length > 0) {
            const importedTables: Table[] = cafeTables.map((cafeTable: any) => ({
                id: cafeTable.id,
                number: cafeTable.number,
                x: cafeTable.pos_x || 0,
                y: cafeTable.pos_y || 0,
                width: cafeTable.width || DEFAULT_TABLE_WIDTH,
                height: cafeTable.height || DEFAULT_TABLE_HEIGHT,
                rotation: cafeTable.rotation || 0,
                color: `hsl(${Math.random() * 360}, 70%, 70%)`,
                seats: cafeTable.capacity || DEFAULT_TABLE_SEATS,
                table_type: cafeTable.table_type || 'simple',
            }));
            setTables(importedTables);

            // Store original state for comparison
            const originalMap = new Map<string, Table>();
            importedTables.forEach(table => {
                originalMap.set(table.id, { ...table });
            });
            setOriginalTables(originalMap);
            setChangedTables(new Set()); // Reset changed tables on initial load
        } else if (cafeTables && cafeTables.length === 0) {
            // Clear tables when API returns empty array
            setTables([]);
            setSelectedTableId(null);
            setOriginalTables(new Map());
            setChangedTables(new Set());
        }
    }, [cafeTables]);

    // Create a new table
    const handleCreateTable = useCallback(() => {
        const newTable: Table = {
            id: generateTableId(),
            number: tables.length + 1,
            x: 0,
            y: 0,
            width: DEFAULT_TABLE_WIDTH,
            height: DEFAULT_TABLE_HEIGHT,
            rotation: 0,
            color: `hsl(${Math.random() * 360}, 70%, 70%)`,
            seats: DEFAULT_TABLE_SEATS,
        };

        // Find nearest empty position
        const position = findNearestEmptyPosition(tables, effectiveHallWidth, effectiveHallHeight);
        newTable.x = position.x;
        newTable.y = position.y;

        setTables((prev) => [...prev, newTable]);
        setSelectedTableId(newTable.id);
    }, [tables, effectiveHallWidth, effectiveHallHeight]);

    // Update table position (after drag)
    const handleTableDragEnd = useCallback((tableId: string, x: number, y: number) => {
        setTables((prev) =>
            prev.map((table) => (table.id === tableId ? { ...table, x, y } : table))
        );
        // Mark table as changed
        setChangedTables((prev) => new Set([...prev, tableId]));
        setDraggedTableCoords(undefined);
    }, []);

    // Update table (rotation, size)
    const handleTableTransformEnd = useCallback((tableId: string, updates: Partial<Table>) => {
        setTables((prev) =>
            prev.map((table) => (table.id === tableId ? { ...table, ...updates } : table))
        );
        // Mark table as changed
        setChangedTables((prev) => new Set([...prev, tableId]));
    }, []);

    // Select/deselect table
    const handleTableSelect = useCallback((tableId: string) => {
        setSelectedTableId(tableId || null);
    }, []);

    // Delete table
    const handleTableDelete = useCallback((tableId: string) => {
        setTables((prev) => prev.filter((t) => t.id !== tableId));
        if (selectedTableId === tableId) {
            setSelectedTableId(null);
        }
    }, [selectedTableId]);

    // Update table properties
    const handleTableUpdate = useCallback((tableId: string, updates: Partial<Table>) => {
        setTables((prev) =>
            prev.map((table) => (table.id === tableId ? { ...table, ...updates } : table))
        );
    }, []);

    // Get changed tables data for API
    const getChangedTablesData = useCallback(() => {
        const changedData: Array<{ id: string; pos_x: number; pos_y: number; width: number; height: number; rotation: number }> = [];

        changedTables.forEach((tableId) => {
            const currentTable = tables.find(t => t.id === tableId);
            if (currentTable) {
                changedData.push({
                    id: tableId,
                    pos_x: Math.round(currentTable.x),
                    pos_y: Math.round(currentTable.y),
                    width: Math.round(currentTable.width),
                    height: Math.round(currentTable.height),
                    rotation: Math.round(currentTable.rotation),
                });
            }
        });

        return changedData;
    }, [changedTables, tables]);

    // Reset changes after save
    const resetChanges = useCallback(() => {
        setChangedTables(new Set());
    }, []);

    return (
        <Box
            key={theme.palette.mode}
            sx={{
                display: 'flex',
                height: '100%',
                gap: 0,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            {/* Sidebar */}
            <FloorPlanSidebar
                tables={tables}
                selectedTableId={selectedTableId}
                onTableCreate={handleCreateTable}
                onTableSelect={handleTableSelect}
                onTableDelete={handleTableDelete}
                onTableUpdate={handleTableUpdate}
                showGrid={showGrid}
                onGridToggle={() => setShowGrid((prev) => !prev)}
                snapToGrid={snapToGrid}
                onSnapToggle={() => setSnapToGrid((prev) => !prev)}
                hallId={hallId}
                hallWidth={effectiveHallWidth}
                hallHeight={effectiveHallHeight}
                changedTablesCount={changedTables.size}
                onGetChangedTables={getChangedTablesData}
                onResetChanges={resetChanges}
            />

            {/* Canvas */}
            <FloorPlanCanvas
                hallWidth={effectiveHallWidth}
                hallHeight={effectiveHallHeight}
                tables={tables}
                selectedTableId={selectedTableId}
                onTableSelect={handleTableSelect}
                onTableDragEnd={handleTableDragEnd}
                onTableTransformEnd={handleTableTransformEnd}
                showGrid={showGrid}
                gridSize={GRID_SIZE}
                snapToGrid={snapToGrid}
                draggedTableCoords={draggedTableCoords}
            />
        </Box>
    );
};
