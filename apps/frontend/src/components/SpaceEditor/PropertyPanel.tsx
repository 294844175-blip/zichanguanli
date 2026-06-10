import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Divider, Space, Tooltip, Upload } from 'antd';
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  UploadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Asset, Park } from '../../types';

interface PropertyPanelProps {
  space: Asset | null;
  parks: Park[];
  onUpdate: (id: string, data: Partial<Asset>) => void;
  onSave: () => void;
  onBackgroundUpload: (file: File) => void;
}

const PropertyPanel = ({ space, parks, onUpdate, onSave, onBackgroundUpload }: PropertyPanelProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (space) {
      form.setFieldsValue({
        code: space.code,
        name: space.name,
        type: space.type,
        area: space.area,
        buildingArea: space.buildingArea,
        rentableArea: space.rentableArea,
        unitPrice: space.unitPrice,
        status: space.status,
        x: space.sliceX,
        y: space.sliceY,
        width: space.sliceWidth,
        sliceHeight: space.sliceHeight,
        rotation: space.sliceRotation,
      });
    } else {
      form.resetFields();
    }
  }, [space]);

  const handleValuesChange = (changedValues: any) => {
    if (!space) return;
    const updates: any = {};
    
    // Map form fields to asset fields
    if (changedValues.code !== undefined) updates.code = changedValues.code;
    if (changedValues.name !== undefined) updates.name = changedValues.name;
    if (changedValues.type !== undefined) updates.type = changedValues.type;
    if (changedValues.area !== undefined) updates.area = changedValues.area;
    if (changedValues.buildingArea !== undefined) updates.buildingArea = changedValues.buildingArea;
    if (changedValues.rentableArea !== undefined) updates.rentableArea = changedValues.rentableArea;
    if (changedValues.unitPrice !== undefined) updates.unitPrice = changedValues.unitPrice;
    if (changedValues.status !== undefined) updates.status = changedValues.status;
    
    // Geometry fields
    if (changedValues.x !== undefined) updates.sliceX = changedValues.x;
    if (changedValues.y !== undefined) updates.sliceY = changedValues.y;
    if (changedValues.width !== undefined) updates.sliceWidth = changedValues.width;
    if (changedValues.sliceHeight !== undefined) updates.sliceHeight = changedValues.sliceHeight;
    if (changedValues.rotation !== undefined) updates.sliceRotation = changedValues.rotation;

    if (Object.keys(updates).length > 0) {
      onUpdate(space.id, updates);
    }
  };

  if (!space) {
    return (
      <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ color: '#999', fontSize: 14 }}>请选择一个空间进行编辑</div>
      </div>
    );
  }

  return (
    <div style={{ width: 320, background: '#fff', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
        <h4 style={{ margin: 0, fontSize: 14, color: '#333' }}>空间属性</h4>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange} size="small">
          <Form.Item name="code" label="空间编号">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="空间名称">
            <Input />
          </Form.Item>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Form.Item name="type" label="空间类型">
            <Select options={[
              { label: '冻库', value: '冻库' },
              { label: '冷藏库', value: '冷藏库' },
              { label: '常温库', value: '常温库' },
              { label: '办公', value: '办公' },
              { label: '配套', value: '配套' },
            ]} />
          </Form.Item>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Form.Item name="area" label="面积 (㎡)">
            <InputNumber style={{ width: '100%' }} precision={2} />
          </Form.Item>
          <Form.Item name="buildingArea" label="建筑面积 (㎡)">
            <InputNumber style={{ width: '100%' }} precision={2} />
          </Form.Item>
          <Form.Item name="rentableArea" label="可出租面积 (㎡)">
            <InputNumber style={{ width: '100%' }} precision={2} />
          </Form.Item>
          <Form.Item name="unitPrice" label="报价单价 (元/㎡)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="空间状态">
            <Select options={[
              { label: '空置', value: 'VACANT' },
              { label: '已出租', value: 'RENTED' },
              { label: '建设中', value: 'CONSTRUCTION' },
              { label: '即将到期', value: 'EXPIRING' },
              { label: '异常', value: 'RISK' },
            ]} />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />
          
          <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>位置和尺寸</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="x" label="X">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="y" label="Y">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="width" label="宽度">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="sliceHeight" label="高度">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="rotation" label="旋转">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e8e8e8', background: '#fafafa' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>对齐工具</div>
          <Space>
            <Tooltip title="左对齐"><Button size="small" icon={<AlignLeftOutlined />} /></Tooltip>
            <Tooltip title="水平居中"><Button size="small" icon={<AlignCenterOutlined />} /></Tooltip>
            <Tooltip title="右对齐"><Button size="small" icon={<AlignRightOutlined />} /></Tooltip>
            <Tooltip title="顶对齐"><Button size="small" icon={<VerticalAlignTopOutlined />} /></Tooltip>
            <Tooltip title="垂直居中"><Button size="small" icon={<VerticalAlignMiddleOutlined />} /></Tooltip>
            <Tooltip title="底对齐"><Button size="small" icon={<VerticalAlignBottomOutlined />} /></Tooltip>
          </Space>
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={file => { onBackgroundUpload(file); return false; }}
          >
            <Button block icon={<UploadOutlined />}>上传空间图片</Button>
          </Upload>
        </div>

        <Button type="primary" block icon={<SaveOutlined />} onClick={onSave}>
          保存布局
        </Button>
      </div>
    </div>
  );
};

export default PropertyPanel;
