import { Input, Button, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useCallback } from 'react';

interface ListToolbarProps {
  searchPlaceholder?: string;
  onSearch?: (keyword: string) => void;
  onExport?: () => void;
  extraButtons?: React.ReactNode;
}

export const ListToolbar: React.FC<ListToolbarProps> = ({
  searchPlaceholder = '搜索...',
  onSearch,
  onExport,
  extraButtons,
}) => {
  const handleSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      onSearch?.(trimmed);
    },
    [onSearch]
  );

  return (
    <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
      <Space>
        <Input.Search
          placeholder={searchPlaceholder}
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </Space>
      <Space>
        {extraButtons}
        {onExport && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onExport}
          >
            导出
          </Button>
        )}
      </Space>
    </Space>
  );
};
