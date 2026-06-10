import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Spin, message, Button, Space, Tag, Upload, Modal, InputNumber, Row, Col } from 'antd';
import { UndoOutlined, RedoOutlined, PictureOutlined } from '@ant-design/icons';
import { getAssetSlices, updateAssetSlices, createAsset, updateAsset } from '../../api/assets';
import { updateParkBackground, getParks, getParkById, uploadParkBackground, deleteParkBackground, updateParkBackgroundConfig } from '../../api/parks';
import { createCamera as createCameraApi, updateCamera as updateCameraApi, getCameras, deleteCamera as deleteCameraApi } from '../../api/cameras';
import { Asset, Park, Camera, Customer, Lease } from '../../types';
import ToolPanel from './ToolPanel';
import CanvasArea from './CanvasArea';
import DraggablePanel from './DraggablePanel';
import type { UploadProps } from 'antd';

interface SpaceEditorProps {
  parkId: string;
  onSpaceSelect?: (id: string | null, space: Asset | null) => void;
  onSpaceDblClick?: (id: string, space: Asset) => void;
  onSpaceDataChange?: (space: Asset) => void;
  isViewMode?: boolean;
  leases?: Lease[];
  customers?: Customer[];
}

const SpaceEditor = (props: SpaceEditorProps) => {
  const { parkId, onSpaceSelect, onSpaceDblClick, isViewMode = false, leases = [], customers = [] } = props;
  const [spaces, setSpaces] = useState<Asset[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundConfig, setBackgroundConfig] = useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const [backgroundLocked, setBackgroundLocked] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('select');
  const [snapSettings, setSnapSettings] = useState({ grid: true, edge: true });
  const [gridSize, setGridSize] = useState(50);
  const [historyPosition, setHistoryPosition] = useState({ right: 16, y: 16 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [componentReady, setComponentReady] = useState(false);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // 撤销/重做功能
  const [history, setHistory] = useState<Asset[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY = 5;

  // 保存当前状态到历史记录
  const saveToHistory = useCallback((newSpaces: Asset[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newSpaces)));
    if (newHistory.length > MAX_HISTORY + 1) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSpaces(JSON.parse(JSON.stringify(history[newIndex])));
      message.info('已撤销');
    } else {
      message.warning('无法撤销');
    }
  }, [historyIndex, history]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSpaces(JSON.parse(JSON.stringify(history[newIndex])));
      message.info('已重做');
    } else {
      message.warning('无法重做');
    }
  }, [historyIndex, history]);

  useEffect(() => {
    loadParks();
    loadSpaces();
    loadCameras();
    loadBackgroundImage();
  }, [parkId]);

  // 使用 ResizeObserver 精确监听容器尺寸变化，确保画布始终填满可用区域
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateCanvasSize = () => {
      const width = container.clientWidth || 1200;
      const height = container.clientHeight || 800;
      setCanvasSize(prev => {
        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) return prev;
        return { width, height };
      });
      setViewModePosition({ x: width / 2 - 200, y: 16 });
    };

    // 初始更新
    updateCanvasSize();

    const observer = new ResizeObserver(entries => {
      updateCanvasSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  // 确保组件完全挂载后设置 ready 状态
  useEffect(() => {
    const timer = setTimeout(() => {
      setComponentReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadParks = async () => {
    try {
      const data = await getParks();
      setParks(data);
    } catch {
      // API失败时使用模拟数据
      setParks([
        {
          id: 'park-1',
          name: '东北运营中心',
          code: 'PARK-001',
          status: '运营中',
          totalArea: 53010,
          buildingArea: 27770.94,
          rentableArea: 9000,
          greenArea: 0,
          hardenedArea: 0,
          parkingSpaces: 0,
          boardSpaces: 0,
          orgId: '',
          createdAt: '',
          updatedAt: ''
        }
      ]);
    }
  };

  const loadCameras = async () => {
    try {
      const data = await getCameras(parkId);
      setCameras(data);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  };

  // 计算合适的缩放比例和偏移，确保所有空间都在一屏内
  const calculateFitView = useCallback((spacesList: Asset[]) => {
    if (spacesList.length === 0) {
      return { zoom: 1, offsetX: 0, offsetY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    spacesList.forEach(space => {
      const x1 = space.sliceX;
      const y1 = space.sliceY;
      const x2 = space.sliceX + space.sliceWidth;
      const y2 = space.sliceY + space.sliceHeight;
      
      minX = Math.min(minX, x1);
      minY = Math.min(minY, y1);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y2);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // 计算边距，确保四周均匀少量留白
    // 固定较小的padding值，避免局部留白过大
    const padding = Math.min(
      Math.max(15, canvasSize.width * 0.03),
      Math.max(15, canvasSize.height * 0.03),
      30
    );
    const availableWidth = canvasSize.width - padding * 2;
    const availableHeight = canvasSize.height - padding * 2;

    // 计算缩放比例
    const widthRatio = availableWidth / contentWidth;
    const heightRatio = availableHeight / contentHeight;
    
    // 使用较小的比例，确保能完整显示，同时限制最大/最小缩放值
    const fitZoom = Math.min(widthRatio, heightRatio, 2); // 最大放大到2倍
    const finalZoom = Math.max(fitZoom, 0.05); // 最小缩小到0.05倍

    // 始终居中显示：确保整张图纸在画布内部水平+垂直居中完整展示
    const scaledContentWidth = contentWidth * finalZoom;
    const scaledContentHeight = contentHeight * finalZoom;
    const offsetX = (canvasSize.width - scaledContentWidth) / 2 - minX * finalZoom;
    const offsetY = (canvasSize.height - scaledContentHeight) / 2 - minY * finalZoom;

    return { zoom: finalZoom, offsetX, offsetY };
  }, [canvasSize]);

  const [initialFitViewDone, setInitialFitViewDone] = useState(false);

  const loadSpaces = useCallback(async () => {
    setLoading(true);
    setInitialFitViewDone(false);
    try {
      const data = await getAssetSlices(parkId);
      const spacesWithZIndex = data.map((space, index) => ({
        ...space,
        zIndex: space.zIndex !== undefined ? space.zIndex : index
      }));
      setSpaces(spacesWithZIndex);
      setHistory([JSON.parse(JSON.stringify(spacesWithZIndex))]);
      setHistoryIndex(0);
      
      // 暂时禁用自动居中，避免加载后图形跳动
      // 如果需要居中，可以通过交互触发
      setInitialFitViewDone(true);
    } catch {
      // API失败时初始化为空数组，避免使用无效ID的Mock数据导致保存失败
      setSpaces([]);
      setHistory([[]]);
      setHistoryIndex(0);
    } finally {
      setLoading(false);
    }
  }, [parkId, calculateFitView]);

  const loadBackgroundImage = async () => {
    try {
      const park = await getParkById(parkId);
      // 加载背景图配置
      setBackgroundConfig({
        x: park.backgroundX || 0,
        y: park.backgroundY || 0,
        scale: park.backgroundScale || 1
      });
      setBackgroundLocked(park.backgroundLocked || false);
      
      // 加载背景图
      if (park.backgroundUrl) {
        const img = new Image();
        const apiUrl = import.meta.env.VITE_API_URL || '';
        // 如果 API URL 以 /api 结尾，需要去掉 /api 来访问上传的文件
        const baseUrl = apiUrl.replace(/\/api$/, '') || 'http://localhost:8000';
        const fullUrl = `${baseUrl}${park.backgroundUrl}`;
        img.onload = () => {
          setBackgroundImage(img);
          setBackgroundImageUrl(fullUrl);
        };
        img.src = fullUrl;
      }
    } catch {
      console.error('Failed to load background image');
    }
  };

  const handleSpaceMove = async (id: string, x: number, y: number) => {
    let movedSpace: Asset | null = null;
    setSpaces(prev => {
      const newSpaces = prev.map(s => {
        if (s.id === id) {
          movedSpace = { ...s, sliceX: x, sliceY: y };
          return movedSpace;
        }
        return s;
      });
      saveToHistory(newSpaces);
      return newSpaces;
    });
    if (movedSpace && parkId) {
      try {
        await updateAssetSlices(parkId, [{
          id: movedSpace.id,
          sliceX: x,
          sliceY: y,
        }]);
      } catch (err) {
        console.error('Failed to save position:', err);
      }
    }
  };

  const handleSpaceResize = async (id: string, width: number, height: number, rotation: number) => {
    const graphicArea = (width * height) / 100;
    let resizedSpace: Asset | null = null;
    setSpaces(prev => {
      const newSpaces = prev.map(s => {
        if (s.id === id) {
          resizedSpace = { ...s, sliceWidth: width, sliceHeight: height, sliceRotation: rotation, graphicArea };
          return resizedSpace;
        }
        return s;
      });
      saveToHistory(newSpaces);
      return newSpaces;
    });
    if (resizedSpace && parkId) {
      try {
        await updateAssetSlices(parkId, [{
          id: resizedSpace.id,
          sliceWidth: width,
          sliceHeight: height,
          sliceRotation: rotation,
          graphicArea,
        }]);
        await updateAsset(id, { graphicArea });
      } catch (err) {
        console.error('Failed to save resize:', err);
      }
    }
  };

  const handleSpaceSelect = (id: string | null) => {
    setSelectedId(id);
    const space = id ? spaces.find(s => s.id === id) || null : null;
    if (onSpaceSelect) {
      onSpaceSelect(id, space);
    }
    if (id && activeTool !== 'select') {
      setActiveTool('select');
    }
  };

  const handleSpaceDblClick = (id: string) => {
    const space = spaces.find(s => s.id === id);
    if (space && onSpaceDblClick) {
      onSpaceDblClick(id, space);
    }
  };

  const handleSpaceUpdate = async (id: string, data: Partial<Asset>) => {
    try {
      await updateAsset(id, data);
      setSpaces(prev => {
        const newSpaces = prev.map(s => s.id === id ? { ...s, ...data } : s);
        saveToHistory(newSpaces);
        return newSpaces;
      });
      message.success('更新成功');
    } catch {
      message.error('更新失败');
    }
  };

  const handleCreateSpace = async (data: Partial<Asset>, x: number, y: number, width: number, height: number) => {
    const newCode = `ASSET-${Date.now()}`;
    const graphicArea = (width * height) / 100;
    const assetArea = graphicArea; // 资产面积默认为图形面积
    const maxZIndex = spaces.length > 0 ? Math.max(...spaces.map(s => s.zIndex || 0)) : 0;
    
    // 先尝试调用API创建
    try {
      const createdAsset = await createAsset({
        parkId,
        ...data,
        code: newCode,
        name: `空间 ${spaces.length + 1}`,
        type: '冻库',
        status: 'VACANT',
        graphicArea,
        assetArea,
        rentableArea: graphicArea,
        buildingArea: graphicArea,
        projectionArea: graphicArea,
        sliceX: x,
        sliceY: y,
        sliceWidth: width,
        sliceHeight: height,
        sliceRotation: 0,
        zIndex: maxZIndex + 1,
        unitPrice: 0,
        propertyFeeUnit: 0,
        utilityFeeUnit: 0,
        score: 0,
      });
      
      // API成功，使用返回的真实ID
      const newSpace = {
        ...createdAsset,
        zIndex: maxZIndex + 1,
      };
      
      setSpaces(prev => {
        const newSpaces = [...prev, newSpace];
        saveToHistory(newSpaces);
        return newSpaces;
      });
      setSelectedId(newSpace.id);
      setActiveTool('select');
      message.success('空间创建成功');
    } catch {
      // API失败，不显示任何临时创建的空间，只提示失败
      message.error('空间创建失败，请重试');
    }
  };

  const handleDeleteSpace = async (id: string) => {
    try {
      setSpaces(prev => {
        const newSpaces = prev.filter(s => s.id !== id);
        saveToHistory(newSpaces);
        return newSpaces;
      });
      setSelectedId(null);
      message.success('已删除 (需后端支持)');
    } catch {
      message.error('删除失败');
    }
  };

  // 层级操作
  const handleBringToFront = (id: string) => {
    setSpaces(prev => {
      const maxZIndex = Math.max(...prev.map(s => s.zIndex || 0));
      const newSpaces = prev.map(s => 
        s.id === id ? { ...s, zIndex: maxZIndex + 1 } : s
      );
      saveToHistory(newSpaces);
      return newSpaces;
    });
    message.success('已置于顶层');
  };

  const handleSendToBack = (id: string) => {
    setSpaces(prev => {
      const minZIndex = Math.min(...prev.map(s => s.zIndex || 0));
      const newSpaces = prev.map(s => 
        s.id === id ? { ...s, zIndex: minZIndex - 1 } : s
      );
      saveToHistory(newSpaces);
      return newSpaces;
    });
    message.success('已置于底层');
  };

  const handleMoveUp = (id: string) => {
    setSpaces(prev => {
      const sorted = [...prev].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const currentIndex = sorted.findIndex(s => s.id === id);
      
      if (currentIndex < sorted.length - 1) {
        const nextSpace = sorted[currentIndex + 1];
        const currentSpace = sorted[currentIndex];
        
        const newSpaces = prev.map(s => {
          if (s.id === id) {
            return { ...s, zIndex: nextSpace.zIndex || 0 };
          }
          if (s.id === nextSpace.id) {
            return { ...s, zIndex: currentSpace.zIndex || 0 };
          }
          return s;
        });
        
        saveToHistory(newSpaces);
        return newSpaces;
      }
      return prev;
    });
    message.success('已上移一层');
  };

  const handleMoveDown = (id: string) => {
    setSpaces(prev => {
      const sorted = [...prev].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const currentIndex = sorted.findIndex(s => s.id === id);
      
      if (currentIndex > 0) {
        const prevSpace = sorted[currentIndex - 1];
        const currentSpace = sorted[currentIndex];
        
        const newSpaces = prev.map(s => {
          if (s.id === id) {
            return { ...s, zIndex: prevSpace.zIndex || 0 };
          }
          if (s.id === prevSpace.id) {
            return { ...s, zIndex: currentSpace.zIndex || 0 };
          }
          return s;
        });
        
        saveToHistory(newSpaces);
        return newSpaces;
      }
      return prev;
    });
    message.success('已下移一层');
  };

  const handleSave = async () => {
    try {
      await updateAssetSlices(parkId, spaces);
      message.success('布局已保存');
    } catch {
      message.error('保存失败');
    }
  };

  // 摄像头管理
  const handleCameraCreate = async (x: number, y: number) => {
    const tempId = `camera-${Date.now()}`;
    const newCamera: Camera = {
      id: tempId,
      code: `C${cameras.length + 1}`,
      x,
      y,
      width: 40,
      height: 40,
      rotation: 0,
      name: `摄像头 ${cameras.length + 1}`,
    };
    setCameras(prev => [...prev, newCamera]);
    setSelectedCameraId(newCamera.id);
    setActiveTool('select');
    try {
      const savedCamera = await createCameraApi(parkId, newCamera);
      // 用后端返回的真实 ID 替换临时 ID
      setCameras(prev => prev.map(c => c.id === tempId ? savedCamera : c));
      if (selectedCameraId === tempId) {
        setSelectedCameraId(savedCamera.id);
      }
    } catch (err) {
      console.error('Failed to save camera:', err);
      // 保存失败时移除临时添加的摄像头
      setCameras(prev => prev.filter(c => c.id !== tempId));
      if (selectedCameraId === tempId) {
        setSelectedCameraId(null);
      }
    }
    message.success('摄像头已添加');
  };

  const handleCameraUpdate = async (id: string, data: Partial<Camera>) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      await updateCameraApi(id, data);
    } catch (err) {
      console.error('Failed to update camera:', err);
    }
  };

  const handleCameraDelete = async (id: string) => {
    try {
      await deleteCameraApi(id);
      setCameras(prev => prev.filter(c => c.id !== id));
      if (selectedCameraId === id) {
        setSelectedCameraId(null);
      }
      message.success('摄像头已删除');
    } catch (err) {
      console.error('Failed to delete camera:', err);
      message.error('删除摄像头失败');
    }
  };

  // 防抖保存背景图配置
  const saveBackgroundConfigDebounced = useRef<NodeJS.Timeout | null>(null);

  const saveBackgroundConfig = useCallback(async (config: {
    backgroundX?: number;
    backgroundY?: number;
    backgroundScale?: number;
    backgroundLocked?: boolean;
  }) => {
    if (saveBackgroundConfigDebounced.current) {
      clearTimeout(saveBackgroundConfigDebounced.current);
    }
    
    saveBackgroundConfigDebounced.current = setTimeout(async () => {
      try {
        await updateParkBackgroundConfig(parkId, config);
      } catch (err) {
        console.error('Failed to save background config:', err);
      }
    }, 500);
  }, [parkId]);

  const handleBackgroundLock = useCallback((locked: boolean) => {
    setBackgroundLocked(locked);
    saveBackgroundConfig({ backgroundLocked: locked });
  }, [saveBackgroundConfig]);

  const handleBackgroundConfigChange = useCallback((config: { x: number; y: number; scale: number }) => {
    setBackgroundConfig(config);
    saveBackgroundConfig({
      backgroundX: config.x,
      backgroundY: config.y,
      backgroundScale: config.scale,
    });
  }, [saveBackgroundConfig]);

  const handleBackgroundUpload = async (file: File) => {
    try {
      // 上传到服务器
      const park = await uploadParkBackground(parkId, file);
      
      // 加载图片 - 构建正确的URL
      const img = new Image();
      const apiUrl = import.meta.env.VITE_API_URL || '';
      // 如果 API URL 以 /api 结尾，需要去掉 /api 来访问上传的文件
      const baseUrl = apiUrl.replace(/\/api$/, '') || 'http://localhost:8000';
      const fullUrl = `${baseUrl}${park.backgroundUrl}`;
      img.onload = () => {
        setBackgroundImage(img);
        setBackgroundImageUrl(fullUrl);
        // 重置背景图配置
        setBackgroundConfig({ x: 0, y: 0, scale: 1 });
      };
      img.src = fullUrl;
      
      message.success('背景图已保存');
    } catch {
      message.error('背景图上传失败');
    }
  };

  const handleBackgroundDelete = async () => {
    try {
      await deleteParkBackground(parkId);
      setBackgroundImage(null);
      setBackgroundImageUrl(null);
      setBackgroundConfig({ x: 0, y: 0, scale: 1 });
      message.success('背景图已删除');
    } catch {
      message.error('背景图删除失败');
    }
  };

  const handleOpenUploadModal = () => {
    setUploadModalVisible(true);
  };

  const selectedSpace = spaces.find(s => s.id === selectedId) || null;

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Canvas Area - 放在最底层 */}
        <CanvasArea
          spaces={spaces}
          backgroundImage={backgroundImage}
          backgroundConfig={backgroundConfig}
          backgroundLocked={backgroundLocked}
          onBackgroundLock={handleBackgroundLock}
          onBackgroundDelete={handleBackgroundDelete}
          onBackgroundConfigChange={handleBackgroundConfigChange}
          canvasSize={canvasSize}
          zoom={zoom}
          panOffset={panOffset}
          onZoomChange={setZoom}
          onPanOffsetChange={setPanOffset}
          activeTool={activeTool}
          snapSettings={snapSettings}
          gridSize={gridSize}
          selectedId={selectedId}
          onSelect={handleSpaceSelect}
          onDblClick={handleSpaceDblClick}
          onMove={handleSpaceMove}
          onResize={handleSpaceResize}
          onCreate={handleCreateSpace}
          onDelete={handleDeleteSpace}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          cameras={cameras}
          selectedCameraId={selectedCameraId}
          onCameraSelect={setSelectedCameraId}
          onCameraUpdate={handleCameraUpdate}
          onCameraCreate={handleCameraCreate}
          onCameraDelete={handleCameraDelete}
          leases={leases}
          customers={customers}
          isViewMode={isViewMode}
        />

      {/* 工具箱 - 可拖动卡片，放在左上角（仅编辑模式显示） */}
      {!isViewMode && (
        <DraggablePanel
          title="工具箱"
          defaultPosition={{ x: 16, y: 16 }}
        >
          <ToolPanel
            activeTool={activeTool}
            onToolChange={setActiveTool}
            snapSettings={snapSettings}
            onSnapChange={setSnapSettings}
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            onBackgroundUpload={handleOpenUploadModal}
          />
        </DraggablePanel>
      )}
      
      {/* 历史操作 - 可拖动卡片，放在右上角（仅编辑模式显示） */}
      {!isViewMode && (
        <DraggablePanel
          title="历史操作"
          defaultPosition={historyPosition}
        >
          <div style={{ 
            background: 'white',
            padding: '12px',
            borderRadius: '0 0 8px 8px',
            display: 'flex', 
            gap: 8,
          }}>
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              撤销
            </Button>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              重做
            </Button>
          </div>
        </DraggablePanel>
      )}

      {/* 背景图上传弹窗 */}
      <Modal
        title="上传背景图"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".png,.jpg,.jpeg,.gif,.bmp,.svg"
          showUploadList={false}
          beforeUpload={(file) => {
            handleBackgroundUpload(file);
            setUploadModalVisible(false);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 PNG, JPG, JPEG, GIF, BMP, SVG 格式</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default SpaceEditor;
