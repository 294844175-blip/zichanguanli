import { useState, useEffect, useRef } from 'react';
import { Spin, message, Modal, Form, Input, InputNumber, Select, Button } from 'antd';
import { getAssetSlices, updateAssetSlices, createAsset } from '../../api/assets';
import { updateParkBackground, getParks } from '../../api/parks';
import { Asset, Park } from '../../types';
import SliceCanvas from './SliceCanvas';
import SliceToolbar from './SliceToolbar';
import AssetDetailModal from './AssetDetailModal';

interface AssetSliceEditorProps {
  parkId: string;
}

const AssetSliceEditor = ({ parkId }: AssetSliceEditorProps) => {
  const [slices, setSlices] = useState<Asset[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pendingSlice, setPendingSlice] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [createForm] = Form.useForm();

  useEffect(() => {
    loadParks();
    loadSlices();
  }, [parkId]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: Math.floor(width * 0.66) });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadParks = async () => {
    const data = await getParks();
    setParks(data);
  };

  const loadSlices = async () => {
    setLoading(true);
    try {
      const data = await getAssetSlices(parkId);
      setSlices(data);
    } catch {
      message.error('加载资产切片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSliceMove = (id: string, x: number, y: number) => {
    setSlices(prev => prev.map(s => s.id === id ? { ...s, sliceX: x, sliceY: y } : s));
  };

  const handleSliceResize = (id: string, width: number, height: number, rotation: number) => {
    setSlices(prev => prev.map(s => s.id === id ? { ...s, sliceWidth: width, sliceHeight: height, sliceRotation: rotation } : s));
  };

  const handleSliceDelete = (id: string) => {
    Modal.confirm({
      title: '删除切片',
      content: '确定要删除该资产切片吗？（不会删除资产数据）',
      onOk: () => {
        setSlices(prev => prev.filter(s => s.id !== id));
        message.success('切片已删除');
      },
    });
  };

  const handleCreateSlice = (x: number, y: number, width: number, height: number) => {
    setPendingSlice({ x, y, width, height });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (values: any) => {
    if (!pendingSlice) return;

    try {
      const newAsset = await createAsset({
        parkId,
        code: values.code,
        name: values.name,
        type: values.type,
        area: values.area || 0,
        rentableArea: values.rentableArea || 0,
        unitPrice: values.unitPrice || 0,
        sliceX: pendingSlice.x,
        sliceY: pendingSlice.y,
        sliceWidth: pendingSlice.width,
        sliceHeight: pendingSlice.height,
        sliceTitle: values.name,
        status: 'VACANT',
      });

      setSlices(prev => [...prev, newAsset]);
      setCreateModalOpen(false);
      createForm.resetFields();
      setPendingSlice(null);
      message.success('资产切片创建成功');
    } catch {
      message.error('创建失败');
    }
  };

  const handleSave = async () => {
    try {
      await updateAssetSlices(parkId, slices);
      message.success('布局已保存');
    } catch {
      message.error('保存失败');
    }
  };

  const handleBackgroundUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBackgroundImage(img);
      setCanvasSize({ width: img.width, height: img.height });
    };
    img.src = url;

    try {
      await updateParkBackground(parkId, url);
      message.success('背景已更新');
    } catch {
      message.error('背景更新失败');
    }
  };

  const handleSliceClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalOpen(true);
  };

  const handleModeChange = (edit: boolean) => {
    setIsEditMode(edit);
    if (!edit) setIsDrawingMode(false);
  };

  if (loading) return <Spin size="large" />;

  return (
    <div ref={containerRef}>
      <SliceToolbar
        isEditMode={isEditMode}
        isDrawingMode={isDrawingMode}
        onModeChange={handleModeChange}
        onDrawingModeChange={setIsDrawingMode}
        onSave={handleSave}
        onBackgroundUpload={handleBackgroundUpload}
      />

      {isEditMode && isDrawingMode && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6 }}>
          <strong>绘制模式：</strong>在画布上拖拽鼠标创建新的资产切片
        </div>
      )}

      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
        <SliceCanvas
          slices={slices}
          backgroundImage={backgroundImage}
          isEditMode={isEditMode}
          isDrawingMode={isDrawingMode}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          onSliceMove={handleSliceMove}
          onSliceResize={handleSliceResize}
          onSliceClick={handleSliceClick}
          onSliceDelete={handleSliceDelete}
          onCreateSlice={handleCreateSlice}
        />
      </div>

      <AssetDetailModal
        asset={selectedAsset}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <Modal
        title="创建资产切片"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); setPendingSlice(null); createForm.resetFields(); }}
        footer={null}
      >
        <Form form={createForm} onFinish={handleCreateSubmit} layout="vertical">
          <Form.Item name="code" label="资产编码" rules={[{ required: true }]}>
            <Input placeholder="如：A-001" />
          </Form.Item>
          <Form.Item name="name" label="资产名称" rules={[{ required: true }]}>
            <Input placeholder="如：1号厂房" />
          </Form.Item>
          <Form.Item name="type" label="资产类型" rules={[{ required: true }]}>
            <Select options={[
              { label: '冻库', value: '冻库' },
              { label: '冷藏库', value: '冷藏库' },
              { label: '常温库', value: '常温库' },
              { label: '办公', value: '办公' },
              { label: '配套', value: '配套' },
            ]} />
          </Form.Item>
          <Form.Item name="area" label="面积(㎡)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="rentableArea" label="可租面积(㎡)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="unitPrice" label="报价单价(元/㎡)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetSliceEditor;
