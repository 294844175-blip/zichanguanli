import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer, Line, Circle, Path, Image as KonvaImage } from 'react-konva';
import { Asset, Camera, HikvisionConfig, Lease, Customer } from '../../types';
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button, Modal, Input, Menu, Form, Select, message, Row, Col } from 'antd';
const { Option } = Select;
import type { MenuProps } from 'antd';

interface CanvasAreaProps {
  spaces: Asset[];
  backgroundImage: HTMLImageElement | null;
  backgroundConfig?: {
    x: number;
    y: number;
    scale: number;
  };
  backgroundLocked?: boolean;
  onBackgroundLock?: (locked: boolean) => void;
  onBackgroundDelete?: () => void;
  onBackgroundConfigChange?: (config: { x: number; y: number; scale: number }) => void;
  canvasSize: { width: number; height: number };
  zoom: number;
  panOffset: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanOffsetChange?: (offset: { x: number; y: number }) => void;
  activeTool: string;
  snapSettings: { grid: boolean; edge: boolean };
  gridSize: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDblClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number, rotation: number) => void;
  onCreate: (data: Partial<Asset>, x: number, y: number, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  cameras: Camera[];
  selectedCameraId: string | null;
  onCameraSelect: (id: string | null) => void;
  onCameraUpdate: (id: string, data: Partial<Camera>) => void;
  onCameraCreate: (x: number, y: number) => void;
  onCameraDelete: (id: string) => void;
  onBackgroundDblClick?: () => void;
  leases?: Lease[];
  customers?: Customer[];
  isViewMode?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  VACANT: '#52c41a',
  RENTED: '#1890ff',
  EXPIRING: '#faad14',
  RISK: '#ff4d4f',
  CONSTRUCTION: '#8c8c8c',
};

const CanvasArea = ({
  spaces,
  backgroundImage,
  backgroundConfig = { x: 0, y: 0, scale: 1 },
  backgroundLocked = false,
  onBackgroundLock,
  onBackgroundDelete,
  onBackgroundConfigChange,
  canvasSize,
  zoom,
  panOffset,
  onZoomChange,
  onPanOffsetChange,
  activeTool,
  snapSettings,
  gridSize,
  selectedId,
  onSelect,
  onDblClick,
  onMove,
  onResize,
  onCreate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onMoveUp,
  onMoveDown,
  cameras,
  selectedCameraId,
  onCameraSelect,
  onCameraUpdate,
  onCameraCreate,
  onCameraDelete,
  onBackgroundDblClick,
  leases = [],
  customers = [],
  isViewMode = false,
}: CanvasAreaProps) => {
  
  // 计算出租率
  const calculateOccupancyRate = (space: Asset) => {
    const assetArea = space.assetArea !== undefined ? space.assetArea : (space.graphicArea || (space as any).area || (space.sliceWidth * space.sliceHeight) / 100);
    if (assetArea === 0) return 0;
    
    // 获取当前空间的所有租赁
    const relatedLeases = leases.filter(lease => lease.assetId === space.id);
    
    // 如果没有租赁数据，使用原来的方式计算
    if (relatedLeases.length === 0) {
      const isRented = ['RENTED', 'EXPIRING', 'RISK'].includes(space.status);
      return isRented ? 100 : 0;
    }
    
    // 计算已租面积总和
    let totalLeasedArea = 0;
    relatedLeases.forEach(lease => {
      totalLeasedArea += lease.quantity || 0;
    });
    
    // 计算出租率
    return Math.round((totalLeasedArea / assetArea) * 100);
  };
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const backgroundImageRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawRect, setDrawRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [textAnnotations, setTextAnnotations] = useState<any[]>([]);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [snapLines, setSnapLines] = useState<any[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    spaceId: string;
  } | null>(null);
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [cameraConfigModalVisible, setCameraConfigModalVisible] = useState(false);
  const [configuringCamera, setConfiguringCamera] = useState<Camera | null>(null);
  const [cameraForm] = Form.useForm();
  const [isBackgroundSelected, setIsBackgroundSelected] = useState(false);

  // 更新 Transformer 绑定
  useEffect(() => {
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      if (isBackgroundSelected && !backgroundLocked && backgroundImageRef.current) {
        // 如果选中了背景图且未锁定
        setTimeout(() => {
          if (transformerRef.current && backgroundImageRef.current) {
            transformerRef.current.nodes([backgroundImageRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
          }
        }, 0);
      } else if (selectedId && activeTool === 'select' && stageRef.current) {
        // 如果选中了空间
        const node = stageRef.current.findOne('#' + selectedId);
        if (node) {
          setTimeout(() => {
            if (transformerRef.current) {
              transformerRef.current.nodes([node]);
              transformerRef.current.getLayer()?.batchDraw();
            }
          }, 0);
        }
      } else if (selectedCameraId && activeTool === 'select' && stageRef.current) {
        // 如果选中了摄像头
        const node = stageRef.current.findOne('#' + selectedCameraId);
        if (node) {
          setTimeout(() => {
            if (transformerRef.current) {
              transformerRef.current.nodes([node]);
              transformerRef.current.getLayer()?.batchDraw();
            }
          }, 0);
        }
      }
    }
  }, [selectedId, selectedCameraId, isBackgroundSelected, backgroundLocked, activeTool, spaces]);

  // 同步panOffset到Stage
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.x(panOffset.x);
      stageRef.current.y(panOffset.y);
      stageRef.current.batchDraw();
    }
  }, [panOffset]);

  // 监听键盘方向键，移动选中的矩形
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== 'select') return;
      
      const moveDistance = e.shiftKey ? 50 : 10; // Shift键加速移动
      let newX = 0;
      let newY = 0;
      let shouldMove = false;
      
      // 移动空间
      if (selectedId) {
        const selectedSpace = spaces.find(s => s.id === selectedId);
        if (!selectedSpace) return;
        
        newX = selectedSpace.sliceX;
        newY = selectedSpace.sliceY;
        
        if (e.key === 'ArrowUp') { newY -= moveDistance; shouldMove = true; }
        if (e.key === 'ArrowDown') { newY += moveDistance; shouldMove = true; }
        if (e.key === 'ArrowLeft') { newX -= moveDistance; shouldMove = true; }
        if (e.key === 'ArrowRight') { newX += moveDistance; shouldMove = true; }
        
        if (shouldMove) {
          // 应用吸附
          const snapped = getSnapPosition(newX, newY, selectedId, selectedSpace.sliceWidth, selectedSpace.sliceHeight);
          onMove(selectedId, snapped.x, snapped.y);
        }
      }
      
      // 移动摄像头
      if (selectedCameraId) {
        const selectedCamera = cameras.find(c => c.id === selectedCameraId);
        if (!selectedCamera) return;
        
        newX = selectedCamera.x;
        newY = selectedCamera.y;
        
        if (e.key === 'ArrowUp') { newY -= moveDistance; shouldMove = true; }
        if (e.key === 'ArrowDown') { newY += moveDistance; shouldMove = true; }
        if (e.key === 'ArrowLeft') { newX -= moveDistance; shouldMove = true; }
        if (e.key === 'ArrowRight') { newX += moveDistance; shouldMove = true; }
        
        if (shouldMove) {
          // 应用吸附
          const snapped = getSnapPosition(newX, newY);
          onCameraUpdate(selectedCameraId, { x: snapped.x, y: snapped.y });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedCameraId, activeTool, spaces, cameras, onMove, onCameraUpdate]);

  const getSnapPosition = (x: number, y: number, currentSpaceId?: string, currentWidth?: number, currentHeight?: number) => {
    let snapped = { x, y };
    const newSnapLines: any[] = [];
    const snapThreshold = 10;

    // 获取当前空间的完整尺寸（如果没有提供，默认用一个小值）
    const width = currentWidth || 50;
    const height = currentHeight || 50;

    // 1. 网格吸附
    if (snapSettings.grid) {
      const gridX = Math.round(x / gridSize) * gridSize;
      const gridY = Math.round(y / gridSize) * gridSize;

      if (Math.abs(x - gridX) < snapThreshold) {
        snapped.x = gridX;
        if (!newSnapLines.some(line => line.type === 'vertical' && line.position === gridX)) {
          newSnapLines.push({ type: 'vertical', position: gridX });
        }
      }
      if (Math.abs(y - gridY) < snapThreshold) {
        snapped.y = gridY;
        if (!newSnapLines.some(line => line.type === 'horizontal' && line.position === gridY)) {
          newSnapLines.push({ type: 'horizontal', position: gridY });
        }
      }
    }

    // 2. 边缘吸附 - 吸附到其他空间的边缘
    if (snapSettings.edge) {
      // 获取除当前空间外的其他所有空间的边缘
      const otherSpaces = spaces.filter(s => s.id !== currentSpaceId);
      
      for (const space of otherSpaces) {
        const spaceLeft = space.sliceX;
        const spaceRight = space.sliceX + space.sliceWidth;
        const spaceTop = space.sliceY;
        const spaceBottom = space.sliceY + space.sliceHeight;

        // --- 水平位置吸附 ---
        // 左边缘对齐到目标空间的左边缘
        if (Math.abs(x - spaceLeft) < snapThreshold) {
          snapped.x = spaceLeft;
          if (!newSnapLines.some(line => line.type === 'vertical' && line.position === spaceLeft)) {
            newSnapLines.push({ type: 'vertical', position: spaceLeft });
          }
        }
        // 左边缘对齐到目标空间的右边缘（当前空间的左紧贴目标的右）
        if (Math.abs(x - spaceRight) < snapThreshold) {
          snapped.x = spaceRight;
          if (!newSnapLines.some(line => line.type === 'vertical' && line.position === spaceRight)) {
            newSnapLines.push({ type: 'vertical', position: spaceRight });
          }
        }
        // 右边缘对齐到目标空间的左边缘（当前空间的右紧贴目标的左）
        if (Math.abs(x + width - spaceLeft) < snapThreshold) {
          snapped.x = spaceLeft - width;
          if (!newSnapLines.some(line => line.type === 'vertical' && line.position === spaceLeft)) {
            newSnapLines.push({ type: 'vertical', position: spaceLeft });
          }
        }
        // 右边缘对齐到目标空间的右边缘
        if (Math.abs(x + width - spaceRight) < snapThreshold) {
          snapped.x = spaceRight - width;
          if (!newSnapLines.some(line => line.type === 'vertical' && line.position === spaceRight)) {
            newSnapLines.push({ type: 'vertical', position: spaceRight });
          }
        }

        // --- 垂直位置吸附 ---
        // 上边缘对齐到目标空间的上边缘
        if (Math.abs(y - spaceTop) < snapThreshold) {
          snapped.y = spaceTop;
          if (!newSnapLines.some(line => line.type === 'horizontal' && line.position === spaceTop)) {
            newSnapLines.push({ type: 'horizontal', position: spaceTop });
          }
        }
        // 上边缘对齐到目标空间的下边缘（当前空间的上紧贴目标的下）
        if (Math.abs(y - spaceBottom) < snapThreshold) {
          snapped.y = spaceBottom;
          if (!newSnapLines.some(line => line.type === 'horizontal' && line.position === spaceBottom)) {
            newSnapLines.push({ type: 'horizontal', position: spaceBottom });
          }
        }
        // 下边缘对齐到目标空间的上边缘（当前空间的下紧贴目标的上）
        if (Math.abs(y + height - spaceTop) < snapThreshold) {
          snapped.y = spaceTop - height;
          if (!newSnapLines.some(line => line.type === 'horizontal' && line.position === spaceTop)) {
            newSnapLines.push({ type: 'horizontal', position: spaceTop });
          }
        }
        // 下边缘对齐到目标空间的下边缘
        if (Math.abs(y + height - spaceBottom) < snapThreshold) {
          snapped.y = spaceBottom - height;
          if (!newSnapLines.some(line => line.type === 'horizontal' && line.position === spaceBottom)) {
            newSnapLines.push({ type: 'horizontal', position: spaceBottom });
          }
        }
      }
    }

    setSnapLines(newSnapLines);
    return snapped;
  };

  const handleStageMouseDown = (e: any) => {
    // 查看模式下，点击任意位置都可以开始平移
    if (isViewMode) {
      setIsPanning(true);
      const stage = e.target.getStage();
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          setPanStart({ x: pos.x - stage.x(), y: pos.y - stage.y() });
        }
      }
      return;
    }

    // 非查看模式下，只有点击在空白区域（即直接点击 stage）且工具为 select 时才可以平移
    if (e.target === e.target.getStage() && activeTool === 'select') {
      setIsPanning(true);
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) {
        setPanStart({ x: pos.x - stage.x(), y: pos.y - stage.y() });
      }
      return;
    }

    if (activeTool === 'select' || activeTool === 'delete') {
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scale = zoom;
    const offsetX = stage.x();
    const offsetY = stage.y();
    const actualPos = {
      x: (pos.x - offsetX) / scale,
      y: (pos.y - offsetY) / scale,
    };

    const snapped = getSnapPosition(actualPos.x, actualPos.y);

    if (activeTool === 'rect') {
      setIsDrawing(true);
      setDrawRect({ x: snapped.x, y: snapped.y, width: 0, height: 0 });
    } else if (activeTool === 'camera') {
      onCameraCreate(snapped.x, snapped.y);
    }
  };

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // 如果正在平移，处理平移逻辑
    if (isPanning) {
      const pos = stage.getPointerPosition();
      if (pos) {
        const newX = pos.x - panStart.x;
        const newY = pos.y - panStart.y;
        stage.x(newX);
        stage.y(newY);
        stage.batchDraw();
        // 直接通过onPanOffsetChange更新state
        if (onPanOffsetChange) {
          onPanOffsetChange({ x: newX, y: newY });
        }
      }
      return;
    }

    // 查看模式下不触发任何绘制功能
    if (isViewMode) {
      return;
    }

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scale = zoom;
    // 使用panOffset获取偏移，避免直接从stage.x()获取
    const offsetX = panOffset.x;
    const offsetY = panOffset.y;
    const actualPos = {
      x: (pos.x - offsetX) / scale,
      y: (pos.y - offsetY) / scale,
    };

    const snapped = getSnapPosition(actualPos.x, actualPos.y);

    if (activeTool === 'rect' && isDrawing) {
      const startX = drawRect.x;
      const startY = drawRect.y;
      const newX = Math.min(startX, snapped.x);
      const newY = Math.min(startY, snapped.y);
      const w = Math.abs(snapped.x - startX);
      const h = Math.abs(snapped.y - startY);
      setDrawRect({ x: newX, y: newY, width: w, height: h });
    }
  };

  const handleStageMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      // 这里不需要再单独更新panOffset，因为在handleStageMouseMove中已经更新了
      return;
    }

    // 查看模式下不触发任何绘制功能
    if (isViewMode) {
      return;
    }

    if (activeTool === 'rect' && isDrawing) {
      setIsDrawing(false);
      setSnapLines([]);
      if (drawRect.width > 30 && drawRect.height > 30) {
        onCreate({}, drawRect.x, drawRect.y, drawRect.width, drawRect.height);
      }
      setDrawRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - panOffset.x) / oldScale,
      y: (pointer.y - panOffset.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    onZoomChange(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    if (onPanOffsetChange) {
      onPanOffsetChange(newPos);
    }
  };

  const handleTextConfirm = () => {
    if (textInput.trim()) {
      setTextAnnotations([
        ...textAnnotations,
        { 
          id: 'text-' + Date.now(),
          x: textPosition.x,
          y: textPosition.y,
          text: textInput.trim(),
        }
      ]);
      setTextInput('');
      setTextModalVisible(false);
    }
  };

  // 右键菜单处理
  const handleContextMenuClick: MenuProps['onClick'] = (e) => {
    if (!contextMenu) return;
    const { spaceId } = contextMenu;
    
    switch (e.key) {
      case 'bringToFront':
        onBringToFront(spaceId);
        break;
      case 'sendToBack':
        onSendToBack(spaceId);
        break;
      case 'moveUp':
        onMoveUp(spaceId);
        break;
      case 'moveDown':
        onMoveDown(spaceId);
        break;
      case 'delete':
        onDelete(spaceId);
        break;
    }
    setContextMenu(null);
  };

  // 点击空白处关闭右键菜单
  const handleStageClick = () => {
    setContextMenu(null);
  };

  // 摄像头配置弹窗
  const openCameraConfig = (camera: Camera) => {
    setConfiguringCamera(camera);
    cameraForm.setFieldsValue(camera.hikvisionConfig || {
      protocol: 'rtsp',
      streamType: 'sub',
      port: '554',
    });
    setCameraConfigModalVisible(true);
  };

  const handleCameraConfigSave = async () => {
    try {
      const values = await cameraForm.validateFields();
      if (configuringCamera) {
        onCameraUpdate(configuringCamera.id, { hikvisionConfig: values as HikvisionConfig });
        message.success('配置已保存');
      }
      setCameraConfigModalVisible(false);
    } catch {
      message.error('配置保存失败');
    }
  };

  const getCameraStreamUrl = (config: HikvisionConfig): string => {
    if (config.protocol === 'rtsp') {
      return `rtsp://${config.ip}:${config.port}/Streaming/Channels/${config.cameraIndexCode}${config.streamType === 'main' ? '101' : '201'}`;
    } else if (config.protocol === 'hls') {
      return `http://${config.ip}:${config.port}/hls/${config.cameraIndexCode}/${config.streamType === 'main' ? 'main' : 'sub'}.m3u8`;
    } else {
      return `ws://${config.ip}:${config.port}/ws/${config.cameraIndexCode}`;
    }
  };

  // 监听 canvasSize 变化，确保画布正确渲染
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.width(canvasSize.width);
      stageRef.current.height(canvasSize.height);
      stageRef.current.batchDraw();
    }
  }, [canvasSize]);

  // 排序后的空间 - 按 zIndex 排序
  const sortedSpaces = [...spaces].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // 安全检查：确保 canvasSize 有有效的值
  if (!canvasSize || canvasSize.width <= 0 || canvasSize.height <= 0) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        draggable={false}
        onClick={() => {
          setContextMenu(null);
          setBackgroundContextMenu(null);
          setIsBackgroundSelected(false);
        }}
        onMouseDown={(e) => {
          // 检查是否点击在空白区域（即直接点击 stage）
          if (e.target === e.target.getStage()) {
            if (activeTool === 'select') {
              // 在 select 工具模式下，如果点击空白区域，先取消选择
              onSelect(null);
              onCameraSelect(null);
              setIsBackgroundSelected(false);
              setSnapLines([]);
              // 然后进入平移模式
              handleStageMouseDown(e);
            } else {
              // 其他工具模式下正常处理
              handleStageMouseDown(e);
            }
          } else {
            // 点击到其他元素，正常处理
            handleStageMouseDown(e);
          }
        }}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
      >
        {/* 背景图 Layer - 放在最底层 */}
        <Layer>
          {backgroundImage && (
            <Group
              ref={backgroundImageRef}
              id="background-image"
              x={backgroundConfig.x}
              y={backgroundConfig.y}
              scaleX={backgroundConfig.scale}
              scaleY={backgroundConfig.scale}
              draggable={!isViewMode && activeTool === 'select' && !backgroundLocked}
              onMouseDown={(e) => {
                // 查看模式下，点击背景图片时也开始平移
                if (isViewMode) {
                  setIsPanning(true);
                  const stage = e.target.getStage();
                  if (stage) {
                    const pos = stage.getPointerPosition();
                    if (pos) {
                      setPanStart({ x: pos.x - stage.x(), y: pos.y - stage.y() });
                    }
                  }
                }
              }}
              onClick={(e) => {
                // 查看模式下不触发选择
                if (isViewMode) {
                  return;
                }
                e.cancelBubble = true;
                if (activeTool === 'select' && !backgroundLocked) {
                  setIsBackgroundSelected(true);
                  onSelect(null);
                  onCameraSelect(null);
                }
              }}
              onDblClick={(e) => {
                // 查看模式下不触发选择
                if (isViewMode) {
                  return;
                }
                e.cancelBubble = true;
                if (!backgroundLocked) {
                  setIsBackgroundSelected(true);
                  onSelect(null);
                  onCameraSelect(null);
                }
              }}
              onContextMenu={(e) => {
                // 查看模式下不触发右键菜单
                if (isViewMode) {
                  return;
                }
                e.cancelBubble = true;
                e.evt.preventDefault();
                const pointerPosition = e.target.getStage()?.getPointerPosition();
                if (pointerPosition) {
                  setBackgroundContextMenu({
                    visible: true,
                    x: pointerPosition.x,
                    y: pointerPosition.y
                  });
                }
              }}
              onDragEnd={(e) => {
                if (isViewMode || backgroundLocked) return;
                const newX = e.target.x();
                const newY = e.target.y();
                if (onBackgroundConfigChange) {
                  onBackgroundConfigChange({
                    ...backgroundConfig,
                    x: newX,
                    y: newY
                  });
                }
              }}
              onTransformEnd={(e) => {
                if (isViewMode || backgroundLocked) return;
                const node = e.target;
                const newScaleX = node.scaleX() * backgroundConfig.scale;
                const newScaleY = node.scaleY() * backgroundConfig.scale;
                const newX = node.x();
                const newY = node.y();
                
                node.scaleX(1);
                node.scaleY(1);
                
                if (onBackgroundConfigChange) {
                  onBackgroundConfigChange({
                    x: newX,
                    y: newY,
                    scale: (newScaleX + newScaleY) / 2
                  });
                }
              }}
            >
              <KonvaImage
                image={backgroundImage}
              />
              {/* 锁定时显示锁图标 */}
              {backgroundLocked && (
                <Text
                  text="🔒"
                  fontSize={24}
                  x={-12}
                  y={-12}
                  width={24}
                  height={24}
                  align="center"
                />
              )}
            </Group>
          )}
        </Layer>

        <Layer>
          {/* 网格 - 仅在非查看模式且启用网格时显示 */}
          {!isViewMode && snapSettings.grid && (
            <Group>
              {/* 绘制足够多的垂直线，确保覆盖整个画布 */}
              {Array.from({ length: Math.ceil((canvasSize.width + 1000) / gridSize) + 2 }).map((_, i) => (
                <Line
                  key={'v-' + i}
                  points={[i * gridSize - 500, -1000, i * gridSize - 500, canvasSize.height + 1000]}
                  stroke="#e8e8e8"
                  strokeWidth={1 / zoom}
                />
              ))}
              {/* 绘制足够多的水平线，确保覆盖整个画布 */}
              {Array.from({ length: Math.ceil((canvasSize.height + 1000) / gridSize) + 2 }).map((_, i) => (
                <Line
                  key={'h-' + i}
                  points={[-1000, i * gridSize - 500, canvasSize.width + 1000, i * gridSize - 500]}
                  stroke="#e8e8e8"
                  strokeWidth={1 / zoom}
                />
              ))}
            </Group>
          )}

          {/* 文字 */}
          {textAnnotations.map((annotation) => (
            <Group key={annotation.id} id={annotation.id} draggable={!isViewMode && activeTool === 'select'}>
              <Text
                text={annotation.text}
                x={annotation.x}
                y={annotation.y}
                fontSize={14 / zoom}
                fill="#333"
                background="#fff"
                padding={4 / zoom}
              />
            </Group>
          ))}

          {/* 空间 */}
          {sortedSpaces.map((space) => {
            const widthStr = (space.sliceWidth / 10).toFixed(1) + 'm';
            const heightStr = (space.sliceHeight / 10).toFixed(1) + 'm';
            // 使用资产面积显示，如果没有则使用图形面积作为备选
            const displayArea = space.assetArea !== undefined ? space.assetArea : (space.graphicArea || (space as any).area || (space.sliceWidth * space.sliceHeight) / 100);
            const displayName = space.name || '未命名';
            const displayAreaText = displayArea.toFixed(1) + '㎡';
            // 计算出租率：已租面积总和 / 资产面积 * 100%
            const occupancyRate = calculateOccupancyRate(space);
            const occupancyRateText = occupancyRate + '%';
            
            return (
              <React.Fragment key={space.id}>
                {/* 尺寸标注 - 仅在选中且非查看模式时显示 */}
                {!isViewMode && selectedId === space.id && (
                  <Group x={space.sliceX} y={space.sliceY} listening={false}>
                    {/* 宽度标注 - 显示在顶部边线中间 */}
                    <Text
                      text={widthStr}
                      x={0}
                      y={3}
                      fontSize={10 / zoom}
                      fill="#333"
                      align="center"
                      width={space.sliceWidth}
                      background="rgba(255,255,255,0.95)"
                      padding={2 / zoom}
                    />
                    {/* 高度标注 - 显示在右侧边线中间 */}
                    <Text
                      text={heightStr}
                      x={space.sliceWidth - 3}
                      y={space.sliceHeight / 2}
                      fontSize={10 / zoom}
                      fill="#333"
                      rotation={90}
                      align="center"
                      verticalAlign="middle"
                      background="rgba(255,255,255,0.95)"
                      padding={2 / zoom}
                    />
                  </Group>
                )}

                {/* 空间主体 */}
                <Group
                  id={space.id}
                  x={space.sliceX}
                  y={space.sliceY}
                  rotation={space.sliceRotation}
                  draggable={!isViewMode && activeTool === 'select'}
                  onMouseDown={(e) => {
                    // 查看模式下，点击空间元素时也开始平移
                    if (isViewMode) {
                      setIsPanning(true);
                      const stage = e.target.getStage();
                      if (stage) {
                        const pos = stage.getPointerPosition();
                        if (pos) {
                          setPanStart({ x: pos.x - stage.x(), y: pos.y - stage.y() });
                        }
                      }
                    }
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (isViewMode || (!isViewMode && activeTool === 'select')) {
                      onSelect(space.id);
                    }
                  }}
                  onDblClick={(e) => {
                    e.cancelBubble = true;
                    if (isViewMode || (!isViewMode && activeTool === 'select')) {
                      onDblClick?.(space.id);
                    }
                  }}
                  onDragMove={(e) => {
                    if (isViewMode) return;
                    const pos = getSnapPosition(e.target.x(), e.target.y(), space.id, space.sliceWidth, space.sliceHeight);
                    e.target.x(pos.x);
                    e.target.y(pos.y);
                  }}
                  onDragEnd={(e) => {
                    if (isViewMode) return;
                    const pos = getSnapPosition(e.target.x(), e.target.y(), space.id, space.sliceWidth, space.sliceHeight);
                    onMove(space.id, pos.x, pos.y);
                    setSnapLines([]);
                  }}
                  onTransformEnd={(e) => {
                    if (isViewMode) return;
                    const node = e.target;
                    // 使用实际 Rect 的尺寸而不是 Group 的尺寸
                    let originalWidth = space.sliceWidth;
                    let originalHeight = space.sliceHeight;
                    
                    let newWidth = originalWidth * node.scaleX();
                    let newHeight = originalHeight * node.scaleY();

                    const minSize = 30;
                    if (newWidth < minSize) newWidth = minSize;
                    if (newHeight < minSize) newHeight = minSize;

                    const snappedPos = getSnapPosition(node.x(), node.y(), space.id, newWidth, newHeight);
                    onResize(space.id, newWidth, newHeight, node.rotation());
                    onMove(space.id, snappedPos.x, snappedPos.y);

                    node.scaleX(1);
                    node.scaleY(1);
                    node.x(snappedPos.x);
                    node.y(snappedPos.y);

                    setSnapLines([]);
                  }}
                  onContextMenu={(e) => {
                    if (isViewMode) return;
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    const pos = stage.getPointerPosition();
                    setContextMenu({
                      visible: true,
                      x: pos.x,
                      y: pos.y,
                      spaceId: space.id
                    });
                    onSelect(space.id); // 右键时也选中该元素
                  }}
                >
                  <Rect
                    width={space.sliceWidth}
                    height={space.sliceHeight}
                    fill={(function() {
                      // 转换颜色值为带20%透明度的格式
                      const color = STATUS_COLORS[space.status] || '#1890ff';
                      if (color.startsWith('#')) {
                        // 处理 hex 颜色
                        let r, g, b;
                        if (color.length === 7) {
                          r = parseInt(color.slice(1, 3), 16);
                          g = parseInt(color.slice(3, 5), 16);
                          b = parseInt(color.slice(5, 7), 16);
                        } else if (color.length === 4) {
                          r = parseInt(color.slice(1, 2) + color.slice(1, 2), 16);
                          g = parseInt(color.slice(2, 3) + color.slice(2, 3), 16);
                          b = parseInt(color.slice(3, 4) + color.slice(3, 4), 16);
                        }
                        return `rgba(${r}, ${g}, ${b}, 0.2)`;
                      }
                      return color;
                    })()}
                    stroke="#333"
                    strokeWidth={2 / zoom}
                    shadowBlur={selectedId === space.id ? 10 : 0}
                    shadowColor="black"
                  />
                  {/* 空间名称 - 整体居中的上部分 */}
                  <Text
                    text={displayName}
                    x={0}
                    y={space.sliceHeight / 2 - 11 / zoom}
                    fontSize={7 / zoom}
                    fill="rgba(0, 0, 0, 0.9)"
                    align="center"
                    width={space.sliceWidth}
                    verticalAlign="middle"
                  />
                  {/* 资产面积 - 整体居中的中间部分 */}
                  <Text
                    text={displayAreaText}
                    x={0}
                    y={space.sliceHeight / 2}
                    fontSize={6 / zoom}
                    fill="rgba(0, 0, 0, 0.9)"
                    align="center"
                    width={space.sliceWidth}
                    verticalAlign="middle"
                  />
                  {/* 出租率显示 - 整体居中的下部分 */}
                  <Text
                    text={occupancyRateText}
                    x={0}
                    y={space.sliceHeight / 2 + 11 / zoom}
                    fontSize={10 / zoom}
                    fill="rgba(0, 0, 0, 0.9)"
                    align="center"
                    width={space.sliceWidth}
                    fontStyle="bold"
                    verticalAlign="middle"
                  />
                </Group>
              </React.Fragment>
            );
          })}

          {/* 摄像头 */}
          {cameras.map((camera) => {
            const isSelected = selectedCameraId === camera.id;
            const color = isSelected ? '#1890ff' : '#515151';
            const scale = (camera.width / 1024) / 2;
            const iconHeight = 1024 * scale;
            const iconWidth = 1024 * scale;
            
            return (
              <React.Fragment key={camera.id}>
                <Group
                  id={camera.id}
                  x={camera.x}
                  y={camera.y}
                  rotation={camera.rotation}
                  draggable={!isViewMode && activeTool === 'select'}
                  onMouseDown={(e) => {
                    // 查看模式下，点击摄像头元素时也开始平移
                    if (isViewMode) {
                      setIsPanning(true);
                      const stage = e.target.getStage();
                      if (stage) {
                        const pos = stage.getPointerPosition();
                        if (pos) {
                          setPanStart({ x: pos.x - stage.x(), y: pos.y - stage.y() });
                        }
                      }
                    }
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (!isViewMode && activeTool === 'select') {
                      onCameraSelect(camera.id);
                    }
                  }}
                  onDblClick={() => {
                    if (!isViewMode) {
                      openCameraConfig(camera);
                    }
                  }}
                  onDragMove={(e) => {
                    if (isViewMode) return;
                    const pos = getSnapPosition(e.target.x(), e.target.y());
                    e.target.x(pos.x);
                    e.target.y(pos.y);
                  }}
                  onDragEnd={(e) => {
                    if (isViewMode) return;
                    const snappedPos = getSnapPosition(e.target.x(), e.target.y());
                    onCameraUpdate(camera.id, { x: snappedPos.x, y: snappedPos.y });
                  }}
                  onTransformEnd={(e) => {
                    if (isViewMode) return;
                    const node = e.target;
                    const newWidth = camera.width * node.scaleX();
                    const newHeight = camera.height * node.scaleY();
                    const minSize = 20;
                    const finalWidth = Math.max(newWidth, minSize);
                    const finalHeight = Math.max(newHeight, minSize);
                    node.scaleX(1);
                    node.scaleY(1);
                    onCameraUpdate(camera.id, { width: finalWidth, height: finalHeight, rotation: node.rotation() });
                  }}
                  onContextMenu={(e) => {
                    if (isViewMode) return;
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    onCameraSelect(camera.id);
                    if (window.confirm('确定删除此摄像头？')) {
                      onCameraDelete(camera.id);
                      onCameraSelect(null);
                    }
                  }}
                >
                  {/* 摄像头图标 - 新的 SVG 路径 */}
                  <Path
                    data="M157.44 670.72v-111.36c0-3.84-2.56-6.4-6.4-7.68l-78.08-15.36c-5.12-1.28-8.96 1.28-8.96 6.4v386.56c0 5.12 5.12 8.96 10.24 7.68l78.08-28.16c2.56-1.28 5.12-3.84 5.12-7.68v-128c0-3.84 3.84-7.68 7.68-7.68h139.52c2.56 0 5.12-1.28 6.4-2.56l75.52-106.24c2.56-3.84 1.28-8.96-2.56-10.24l-92.16-51.2c-3.84-2.56-8.96 0-10.24 3.84l-24.32 75.52c-1.28 2.56-3.84 5.12-7.68 5.12h-81.92c-6.4 0-10.24-3.84-10.24-8.96z m798.72-124.16L281.6 88.32c-1.28-1.28-2.56-1.28-3.84-1.28H204.8c-2.56 0-5.12 1.28-6.4 3.84L93.44 261.12c-1.28 1.28-1.28 2.56-1.28 3.84v53.76c0 2.56 1.28 5.12 3.84 6.4l596.48 376.32c1.28 1.28 2.56 1.28 3.84 1.28H742.4c1.28 0 2.56 0 3.84-1.28l209.92-142.08c5.12-3.84 5.12-10.24 0-12.8zM142.08 389.12l-43.52 49.92c-2.56 3.84-2.56 8.96 1.28 11.52l588.8 380.16c1.28 1.28 2.56 1.28 3.84 1.28H742.4c2.56 0 3.84-1.28 5.12-2.56l25.6-26.88c1.28-1.28 1.28-1.28 1.28-2.56l23.04-72.96c1.28-3.84-3.84-7.68-7.68-5.12-17.92 14.08-53.76 40.96-65.28 49.92-2.56 1.28-6.4 1.28-8.96 0-16.64-11.52-34.56-21.76-52.48-30.72h-1.28L152.32 387.84c-3.84-1.28-7.68-1.28-10.24 1.28z"
                    fill={color}
                    scale={{ x: scale, y: scale }}
                    x={(camera.width - iconWidth) / 2}
                    y={(camera.height - iconHeight) / 2}
                  />
                  {/* 摄像头编码标签 - C1, C2 等 */}
                  <Text
                    text={camera.code}
                    x={camera.width / 2}
                    y={(camera.height - iconHeight) / 2 + iconHeight + 2 / zoom}
                    fontSize={12 / zoom}
                    fill="#333"
                    align="center"
                    width={camera.width}
                    offsetX={camera.width / 2}
                  />
                  {/* 在线状态指示 */}
                  {camera.hikvisionConfig && (
                    <Circle
                      x={camera.width - 4}
                      y={4}
                      radius={4 / zoom}
                      fill="#52c41a"
                      stroke="#fff"
                      strokeWidth={1 / zoom}
                    />
                  )}
                </Group>
              </React.Fragment>
            );
          })}

          {/* 绘制中的矩形 - 仅在非查看模式下显示 */}
          {!isViewMode && activeTool === 'rect' && isDrawing && (
            <Rect
              x={drawRect.x}
              y={drawRect.y}
              width={drawRect.width}
              height={drawRect.height}
              stroke="#1890ff"
              strokeWidth={2 / zoom}
              dash={[5, 5]}
              fill="rgba(24, 144, 255, 0.1)"
            />
          )}

          {/* 吸附线 - 仅在非查看模式下显示 */}
          {!isViewMode && snapLines.map((line, index) => (
            line.type === 'vertical' ? (
              <Line
                key={'snap-v-' + index}
                points={[line.position, -1000, line.position, canvasSize.height + 1000]}
                stroke="#ff4d4f"
                strokeWidth={2 / zoom}
                dash={[10, 5]}
              />
            ) : (
              <Line
                key={'snap-h-' + index}
                points={[-1000, line.position, canvasSize.width + 1000, line.position]}
                stroke="#ff4d4f"
                strokeWidth={2 / zoom}
                dash={[10, 5]}
              />
            )
          ))}

          {/* 变换控制器 - 仅在非查看模式且选择工具激活时显示 */}
          {!isViewMode && activeTool === 'select' && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                const minSize = 30;
                if (newBox.width < minSize || newBox.height < minSize) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right']}
              anchorSize={10 / zoom}
              anchorFill="#fff"
              anchorStroke="#1890ff"
              anchorStrokeWidth={2 / zoom}
              borderStroke="#1890ff"
              borderWidth={2 / zoom}
              borderDash={[4, 4]}
              anchorCornerRadius={3 / zoom}
              keepRatio={false}
              centeredScaling={false}
            />
          )}
        </Layer>
      </Stage>

      {/* 缩放控制 */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
        <Button size="small" icon={<ZoomOutOutlined />} onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} />
        <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <Button size="small" icon={<ZoomInOutlined />} onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} />
        <Button size="small" icon={<ExpandOutlined />} onClick={() => onZoomChange(1)} />
      </div>

      {/* 文字输入模态框 */}
      <Modal
        title="添加文字标注"
        open={textModalVisible}
        onOk={handleTextConfirm}
        onCancel={() => setTextModalVisible(false)}
      >
        <Input
          placeholder="请输入文字内容"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
      </Modal>
      
      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
          }}
        >
          <Menu
            onClick={handleContextMenuClick}
            items={[
              {
                key: 'bringToFront',
                label: '置于顶层',
              },
              {
                key: 'sendToBack',
                label: '置于底层',
              },
              {
                key: 'moveUp',
                label: '上移一层',
              },
              {
                key: 'moveDown',
                label: '下移一层',
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                label: '删除',
                danger: true,
              },
            ]}
          />
        </div>
      )}

      {/* 背景图右键菜单 */}
      {backgroundContextMenu && (
        <div
          style={{
            position: 'absolute',
            left: backgroundContextMenu.x,
            top: backgroundContextMenu.y,
            zIndex: 9999,
          }}
        >
          <Menu
            onClick={({ key }) => {
              setBackgroundContextMenu(null);
              if (key === 'lock' && onBackgroundLock) {
                onBackgroundLock(true);
                setIsBackgroundSelected(false);
              } else if (key === 'unlock' && onBackgroundLock) {
                onBackgroundLock(false);
              } else if (key === 'delete' && onBackgroundDelete) {
                onBackgroundDelete();
              }
            }}
            items={[
              backgroundLocked ? {
                key: 'unlock',
                label: '解锁背景图',
              } : {
                key: 'lock',
                label: '锁定背景图',
              },
              !backgroundLocked && {
                type: 'divider',
              },
              !backgroundLocked && {
                key: 'delete',
                label: '删除背景图',
                danger: true,
              },
            ].filter(Boolean)}
          />
        </div>
      )}

      {/* 摄像头配置弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <VideoCameraOutlined style={{ color: '#1890ff' }} />
            <span>配置监控摄像头 - {configuringCamera?.name}</span>
          </div>
        }
        open={cameraConfigModalVisible}
        onOk={handleCameraConfigSave}
        onCancel={() => setCameraConfigModalVisible(false)}
        width={600}
        okText="保存配置"
        cancelText="取消"
      >
        <Form form={cameraForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ip" label="IP地址" rules={[{ required: true, message: '请输入IP地址' }]}>
                <Input placeholder="例如: 192.168.1.100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
                <Input placeholder="例如: 554" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appKey" label="AppKey" rules={[{ required: true, message: '请输入AppKey' }]}>
                <Input placeholder="海康开放平台AppKey" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appSecret" label="AppSecret" rules={[{ required: true, message: '请输入AppSecret' }]}>
                <Input.Password placeholder="海康开放平台AppSecret" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cameraIndexCode" label="监控点编号" rules={[{ required: true, message: '请输入监控点编号' }]}>
                <Input placeholder="海康平台中的监控点编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="protocol" label="协议类型">
                <Select>
                  <Option value="rtsp">RTSP</Option>
                  <Option value="hls">HLS</Option>
                  <Option value="ws">WebSocket</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="streamType" label="码流类型">
            <Select>
              <Option value="sub">子码流（流畅，适合预览）</Option>
              <Option value="main">主码流（高清，适合录像）</Option>
            </Select>
          </Form.Item>
        </Form>

        {/* 实时视频预览区域 */}
        {configuringCamera?.hikvisionConfig && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>实时预览</div>
            <div style={{
              background: '#000',
              borderRadius: 8,
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14
            }}>
              {configuringCamera.hikvisionConfig.protocol === 'hls' ? (
                <video
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  controls
                  autoPlay
                  src={getCameraStreamUrl(configuringCamera.hikvisionConfig)}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 12, display: 'block' }} />
                  <div>
                    {configuringCamera.hikvisionConfig.protocol === 'rtsp' ? 'RTSP 流需要后端代理或使用 VLC 播放器' : 'WebSocket 流需要额外配置'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    流地址: {getCameraStreamUrl(configuringCamera.hikvisionConfig)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CanvasArea;
