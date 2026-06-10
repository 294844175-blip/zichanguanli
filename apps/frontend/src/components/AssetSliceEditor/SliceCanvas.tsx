import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Transformer } from 'react-konva';
import { Asset } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  VACANT: '#ff4d4f',
  RENTED: '#52c41a',
  EXPIRING: '#faad14',
  RISK: '#ff4d4f',
};

interface SliceCanvasProps {
  slices: Asset[];
  backgroundImage?: HTMLImageElement | null;
  isEditMode: boolean;
  isDrawingMode: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSliceMove: (id: string, x: number, y: number) => void;
  onSliceResize: (id: string, width: number, height: number, rotation: number) => void;
  onSliceClick: (asset: Asset) => void;
  onSliceDelete: (id: string) => void;
  onCreateSlice: (x: number, y: number, width: number, height: number) => void;
}

const SliceCanvas = ({
  slices,
  backgroundImage,
  isEditMode,
  isDrawingMode,
  canvasWidth,
  canvasHeight,
  onSliceMove,
  onSliceResize,
  onSliceClick,
  onSliceDelete,
  onCreateSlice,
}: SliceCanvasProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawRect, setDrawRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const selectedNodeRef = useRef<any>(null);

  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        selectedNodeRef.current = node;
      }
    }
  }, [selectedId, slices]);

  const handleStageMouseDown = (e: any) => {
    if (!isDrawingMode) {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    if (e.target === e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      setIsDrawing(true);
      setDrawStart(pos);
      setDrawRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isDrawing) return;
    const pos = e.target.getStage().getPointerPosition();
    setDrawRect({
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      width: Math.abs(pos.x - drawStart.x),
      height: Math.abs(pos.y - drawStart.y),
    });
  };

  const handleStageMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (drawRect.width > 20 && drawRect.height > 20) {
      onCreateSlice(drawRect.x, drawRect.y, drawRect.width, drawRect.height);
    }
    setDrawRect({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handleSliceContextMenu = (e: any, id: string) => {
    e.evt.preventDefault();
    if (isEditMode) {
      onSliceDelete(id);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={canvasWidth}
      height={canvasHeight}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
    >
      <Layer>
        {backgroundImage && (
          <KonvaImage
            image={backgroundImage}
            width={canvasWidth}
            height={canvasHeight}
          />
        )}

        {slices.map(slice => (
          <Group
            key={slice.id}
            id={slice.id}
            x={slice.sliceX}
            y={slice.sliceY}
            rotation={slice.sliceRotation}
            draggable={isEditMode && !isDrawingMode}
            onClick={() => !isEditMode && onSliceClick(slice)}
            onTap={() => !isEditMode && onSliceClick(slice)}
            onDragEnd={e => {
              onSliceMove(slice.id, e.target.x(), e.target.y());
            }}
            onTransformEnd={e => {
              const node = e.target;
              onSliceResize(slice.id, node.width() * node.scaleX(), node.height() * node.scaleY(), node.rotation());
              node.scaleX(1);
              node.scaleY(1);
            }}
            onContextMenu={e => handleSliceContextMenu(e, slice.id)}
          >
            <Rect
              width={slice.sliceWidth}
              height={slice.sliceHeight}
              fill={STATUS_COLORS[slice.status] || '#1890ff'}
              stroke={selectedId === slice.id ? '#fff' : 'transparent'}
              strokeWidth={2}
              cornerRadius={4}
              opacity={0.85}
            />

            {slice.sliceIcon && (
              <Text
                text={slice.sliceIcon}
                x={8}
                y={4}
                fontSize={14}
              />
            )}

            <Text
              text={slice.sliceTitle || slice.name}
              x={slice.sliceIcon ? 28 : 8}
              y={4}
              fontSize={12}
              fill="#fff"
              width={slice.sliceWidth - 16}
              ellipsis
            />

            <Text
              text={`${slice.score}分`}
              x={8}
              y={slice.sliceHeight - 20}
              fontSize={10}
              fill="#fff"
            />
          </Group>
        ))}

        {isDrawing && drawRect.width > 0 && (
          <Rect
            x={drawRect.x}
            y={drawRect.y}
            width={drawRect.width}
            height={drawRect.height}
            stroke="#1890ff"
            strokeWidth={2}
            dash={[5, 5]}
            fill="rgba(24, 144, 255, 0.2)"
          />
        )}

        {isEditMode && !isDrawingMode && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 30 || newBox.height < 30) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};

export default SliceCanvas;
