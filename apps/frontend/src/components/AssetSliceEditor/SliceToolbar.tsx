import { Button, Space, Switch, Tooltip, Upload } from 'antd';
import { EditOutlined, EyeOutlined, UploadOutlined, BlockOutlined, DeleteOutlined } from '@ant-design/icons';

interface SliceToolbarProps {
  isEditMode: boolean;
  isDrawingMode: boolean;
  onModeChange: (edit: boolean) => void;
  onDrawingModeChange: (drawing: boolean) => void;
  onSave: () => void;
  onBackgroundUpload: (file: File) => void;
}

const SliceToolbar = ({
  isEditMode,
  isDrawingMode,
  onModeChange,
  onDrawingModeChange,
  onSave,
  onBackgroundUpload,
}: SliceToolbarProps) => {
  return (
    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <Switch
          checkedChildren="编辑"
          unCheckedChildren="查看"
          checked={isEditMode}
          onChange={onModeChange}
        />
        {isEditMode && (
          <Switch
            checkedChildren="绘制"
            unCheckedChildren="移动"
            checked={isDrawingMode}
            onChange={onDrawingModeChange}
          />
        )}
        <Tooltip title={isDrawingMode ? '绘制模式：拖拽创建新切片' : '移动模式：拖拽调整切片位置'}>
          {isDrawingMode ? <BlockOutlined /> : <EditOutlined />}
        </Tooltip>
      </Space>

      <Space>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={file => {
            onBackgroundUpload(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>更换背景</Button>
        </Upload>
        {isEditMode && (
          <Button type="primary" onClick={onSave}>
            保存布局
          </Button>
        )}
      </Space>
    </div>
  );
};

export default SliceToolbar;
