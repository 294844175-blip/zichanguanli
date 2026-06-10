import { Button, Divider, Checkbox, InputNumber } from 'antd';
import { 
  SelectOutlined, 
  BorderOutlined, 
  FontSizeOutlined, 
  DeleteOutlined,
  VideoCameraOutlined,
  PictureOutlined
} from '@ant-design/icons';

interface ToolPanelProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  snapSettings: { grid: boolean; edge: boolean };
  onSnapChange: (settings: { grid: boolean; edge: boolean }) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onBackgroundUpload?: () => void;
  isLeftPanelOpen?: boolean;
}

const ToolPanel = ({
  activeTool,
  onToolChange,
  snapSettings,
  onSnapChange,
  gridSize,
  onGridSizeChange,
  onBackgroundUpload,
}: ToolPanelProps) => {
  const tools = [
    { id: 'select', icon: <SelectOutlined />, label: '选择/移动', shortcut: 'V' },
    { id: 'rect', icon: <BorderOutlined />, label: '矩形空间', shortcut: 'R' },
    { id: 'camera', icon: <VideoCameraOutlined />, label: '监控摄像头', shortcut: 'C' },
    { id: 'text', icon: <FontSizeOutlined />, label: '文字标注', shortcut: 'T' },
    { id: 'delete', icon: <DeleteOutlined />, label: '删除', shortcut: 'D' },
  ];

  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      background: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: 16,
      overflowY: 'auto',
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#333' }}>绘制工具</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tools.map(tool => (
            <div
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: 6,
                background: activeTool === tool.id ? '#e6f7ff' : 'transparent',
                border: activeTool === tool.id ? '1px solid #91d5ff' : '1px solid transparent',
                color: activeTool === tool.id ? '#1890ff' : '#666',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ marginRight: 8, width: 16, textAlign: 'center' }}>{tool.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{tool.label}</span>
              <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '2px 4px', borderRadius: 4 }}>{tool.shortcut}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#333' }}>吸附设置</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Checkbox checked={snapSettings.grid} onChange={e => onSnapChange({ ...snapSettings, grid: e.target.checked })}>
            <span style={{ fontSize: 13 }}>网格吸附</span>
          </Checkbox>
          <Checkbox checked={snapSettings.edge} onChange={e => onSnapChange({ ...snapSettings, edge: e.target.checked })}>
            <span style={{ fontSize: 13 }}>边缘吸附</span>
          </Checkbox>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666' }}>网格大小</span>
          <InputNumber
            size="small"
            value={gridSize}
            onChange={val => onGridSizeChange(val || 50)}
            min={10}
            max={200}
            style={{ width: 80 }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>px</span>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#333' }}>背景设置</div>
        <Button
          block
          icon={<PictureOutlined />}
          onClick={onBackgroundUpload}
        >
          上传背景图
        </Button>
      </div>

      <div style={{ marginTop: 'auto', padding: 12, background: '#f9f9f9', borderRadius: 6, fontSize: 12, color: '#666' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>快捷键提示:</p>
        <p style={{ margin: 0 }}>V: 选择 | R: 矩形</p>
      </div>
    </div>
  );
};

export default ToolPanel;
