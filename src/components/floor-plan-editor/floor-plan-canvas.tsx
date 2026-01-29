import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { Box, Tooltip } from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';
import type { Table } from './types';
import { DraggableTable } from './draggable-table';

interface FloorPlanCanvasProps {
    hallWidth: number;
    hallHeight: number;
    tables: Table[];
    selectedTableId: string | null;
    onTableSelect: (id: string) => void;
    onTableDragEnd: (id: string, x: number, y: number) => void;
    onTableTransformEnd: (id: string, newTable: Partial<Table>) => void;
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
    draggedTableCoords?: { x: number; y: number };
}

export const FloorPlanCanvas = ({
    hallWidth,
    hallHeight,
    tables,
    selectedTableId,
    onTableSelect,
    onTableDragEnd,
    onTableTransformEnd,
    showGrid,
    gridSize,
    snapToGrid,
    draggedTableCoords,
}: FloorPlanCanvasProps) => {
    const theme = useTheme();
    const { colorScheme } = useColorScheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const [stageScale, setStageScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ width: 1000, height: 400 });
    const [renderKey, setRenderKey] = useState(0);

    // Theme-aware colors
    const isDark = colorScheme === 'dark';
    const canvasBgColor = isDark ? '#333' : '#ffffff';
    const canvasBgOuterColor = isDark ? theme.vars.palette.background.paper : theme.vars.palette.grey[100];
    const borderColor = isDark ? theme.palette.divider : theme.palette.grey[300];
    const textColor = theme.palette.text.secondary;
    const gridColor = isDark ? theme.palette.divider : theme.palette.grey[300];

    // Handle container resize and calculate scale
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;
                setContainerSize({ width, height });

                const scaleX = width / hallWidth;
                const scaleY = height / hallHeight;
                const scale = Math.min(scaleX, scaleY);
                setStageScale(scale);

                if (stageRef.current) {
                    stageRef.current.width(width);
                    stageRef.current.height(height);
                }
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        handleResize();

        return () => {
            resizeObserver.disconnect();
        };
    }, [hallWidth, hallHeight, isDark]);

    // Render grid
    const renderGrid = () => {
        if (!showGrid) return null;

        const lines = [];
        // Vertical lines
        for (let x = 0; x <= hallWidth; x += gridSize) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    points={[x, 0, x, hallHeight]}
                    stroke={gridColor}
                    strokeWidth={0.5}
                    opacity={isDark ? 0.2 : 0.3}
                />
            );
        }

        // Horizontal lines
        for (let y = 0; y <= hallHeight; y += gridSize) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    points={[0, y, hallWidth, y]}
                    stroke={gridColor}
                    strokeWidth={0.5}
                    opacity={isDark ? 0.2 : 0.3}
                />
            );
        }

        return lines;
    };

    return (
        <Box
            key={isDark ? 'dark' : 'light'}
            ref={containerRef}
            sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canvasBgOuterColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 0 ,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 10,
                    fontSize: '12px',
                    color: textColor,
                    pointerEvents: 'none',
                    display: 'flex',
                    gap: 2,
                    transition: theme.transitions.create(['color'], {
                        duration: theme.transitions.duration.shorter,
                    }),
                }}
            >
                <div>Hall: {hallWidth} × {hallHeight}</div>
                {draggedTableCoords && (
                    <Tooltip title="Current drag position">
                        <div>Position: ({draggedTableCoords.x}, {draggedTableCoords.y})</div>
                    </Tooltip>
                )}
            </Box>

            <Stage
                ref={stageRef}
                width={containerSize.width}
                height={containerSize.height}
                scaleX={stageScale}
                scaleY={stageScale}
                onMouseDown={(evt) => {
                    // Deselect table when clicking on empty space
                    if (evt.target === evt.target.getStage()) {
                        onTableSelect('');
                    }
                }}
                onTouchStart={(evt) => {
                    if (evt.target === evt.target.getStage()) {
                        onTableSelect('');
                    }
                }}
            >
                <Layer key={isDark ? 'dark' : 'light'}>
                    {/* Background */}
                    <Rect
                        x={0}
                        y={0}
                        width={hallWidth}
                        height={hallHeight}
                        fill={canvasBgColor}
                        stroke={borderColor}
                        strokeWidth={3}
                    />

                    {/* Grid */}
                    {renderGrid()}

                    {/* Dimensions text */}
                    {/* <Text
                        x={hallWidth - 10}
                        y={hallHeight - 30}
                        text={`${hallWidth} × ${hallHeight} units`}
                        fontSize={12}
                        fill={textColor}
                        opacity={0.6}
                    /> */}

                    {/* Tables */}
                    {tables.map((table) => (
                        <DraggableTable
                            key={table.id}
                            table={table}
                            isSelected={table.id === selectedTableId}
                            onSelect={onTableSelect}
                            onDragEnd={onTableDragEnd}
                            onTransformEnd={onTableTransformEnd}
                            hallWidth={hallWidth}
                            hallHeight={hallHeight}
                            allTables={tables}
                            snapToGrid={snapToGrid}
                            gridSize={gridSize}
                        />
                    ))}
                </Layer>
            </Stage>
        </Box>
    );
};
