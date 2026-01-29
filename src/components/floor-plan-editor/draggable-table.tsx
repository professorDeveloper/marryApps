/**
 * Draggable Table Component for Floor Plan Editor with Dark Mode Support
 */

import { useRef, useState } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import { useTheme } from '@mui/material/styles';
import type { Table } from './types';
import { checkCollision, snapRotation, snapToGrid, clampPosition, findCollidingTable } from './utils';

interface DraggableTableProps {
    table: Table;
    isSelected: boolean;
    onSelect: (id: string, evt?: unknown) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
    onTransformEnd: (id: string, newTable: Partial<Table>) => void;
    hallWidth: number;
    hallHeight: number;
    allTables: Table[];
    snapToGrid: boolean;
    gridSize: number;
}

export const DraggableTable = ({
    table,
    isSelected,
    onSelect,
    onDragEnd,
    onTransformEnd,
    hallWidth,
    hallHeight,
    allTables,
    snapToGrid: shouldSnapToGrid,
    gridSize,
}: DraggableTableProps) => {
    const theme = useTheme();
    const groupRef = useRef<Konva.Group>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previousPosition, setPreviousPosition] = useState({ x: table.x, y: table.y });

    // Theme-aware colors
    const isDark = theme.palette.mode === 'dark';
    const selectedColor = theme.palette.error.main; // #FF6B6B or theme equivalent
    const defaultColor = isDark ? theme.palette.primary.light : theme.palette.info.main;
    const selectedBorderColor = theme.palette.error.light; // #FFB3B3 or theme equivalent
    const defaultBorderColor = isDark ? theme.palette.divider : theme.palette.grey[300];
    const frontIndicatorColor = theme.palette.error.main; // #FF6B6B or theme equivalent
    const textColor = theme.palette.primary.contrastText;

    const handleDragStart = () => {
        setIsDragging(true);
        setPreviousPosition({ x: table.x, y: table.y });
    };

    const handleDragEnd = (evt: Konva.KonvaEventObject<DragEvent>) => {
        setIsDragging(false);
        const node = evt.target;
        let newX = node.x();
        let newY = node.y();

        // Snap to grid
        if (shouldSnapToGrid) {
            newX = snapToGrid(newX, gridSize, true);
            newY = snapToGrid(newY, gridSize, true);
        }

        // Clamp to bounds
        const clamped = clampPosition(newX, newY, table.width, table.height, hallWidth, hallHeight);
        newX = clamped.x;
        newY = clamped.y;

        // Check collision with other tables
        const testTable = { ...table, x: newX, y: newY };
        const otherTables = allTables.filter((t) => t.id !== table.id);
        const collision = findCollidingTable(testTable, otherTables, 5);

        if (collision.isColliding) {
            // Snap back to previous position
            node.to({
                x: previousPosition.x,
                y: previousPosition.y,
                duration: 0.2,
            });
            onDragEnd(table.id, previousPosition.x, previousPosition.y);
        } else {
            node.to({
                x: newX,
                y: newY,
                duration: 0.1,
            });
            onDragEnd(table.id, newX, newY);
        }
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        const newWidth = Math.max(50, table.width * scaleX);
        const newHeight = Math.max(40, table.height * scaleY);
        const newRotation = snapRotation(node.rotation());

        node.scaleX(1);
        node.scaleY(1);
        node.rotation(newRotation);

        onTransformEnd(table.id, {
            width: newWidth,
            height: newHeight,
            rotation: newRotation,
        });
    };

    const tableColor = isSelected ? selectedColor : table.color || defaultColor;
    const borderColor = isSelected ? selectedBorderColor : defaultBorderColor;

    return (
        <>
            <Group
                ref={groupRef}
                x={table.x}
                y={table.y}
                rotation={table.rotation}
                id={`table-${table.id}`}
                name="table-group"
                draggable={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => {
                    const canvas = groupRef.current?.getLayer()?.getCanvas();
                    if (canvas && 'style' in canvas) {
                        (canvas.style as any).cursor = 'grab';
                    }
                }}
                onMouseLeave={() => {
                    const canvas = groupRef.current?.getLayer()?.getCanvas();
                    if (canvas && 'style' in canvas) {
                        (canvas.style as any).cursor = 'default';
                    }
                }}
                onClick={(evt) => {
                    onSelect(table.id, evt);
                }}
                onTap={(evt) => {
                    onSelect(table.id, evt);
                }}
            >
                {/* Table background */}
                <Rect
                    width={table.width}
                    height={table.height}
                    fill={'#f0f0f0'}
                    stroke={borderColor}
                    strokeWidth={isSelected ? 2 : 1}
                    cornerRadius={4}
                    opacity={0.8}
                />

                {/* Table front indicator (top line) */}
                {/* <Rect width={table.width} height={4} fill={frontIndicatorColor} opacity={0.9} cornerRadius={2} /> */}

                {/* Table number/label */}
                <Text
                    x={0}
                    y={table.height / 2 - 20}
                    text={`Table ${table.number}`}
                    fontSize={14}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={textColor}
                    width={table.width}
                    align="center"
                    verticalAlign="middle"
                />

                {/* Seats indicator */}
                <Text
                    x={0}
                    y={table.height / 2 + 5}
                    text={`${table.seats} seats`}
                    fontSize={11}
                    fontFamily="Arial"
                    fill={textColor}
                    width={table.width}
                    align="center"
                    verticalAlign="middle"
                />
            </Group>
        </>
    );
};
