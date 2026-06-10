import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAssets, deleteAsset } from '../api/assets';
import { Asset } from '../types';

const AssetList = () => {
  const [data, setData] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getAssets({ page, pageSize });
      setData(result.data);
      setTotal(result.total);
    } catch {
      message.error('获取资产列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该资产吗？',
      onOk: async () => {
        try {
          await deleteAsset(id);
          message.success('删除成功');
          fetchData();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    AVAILABLE: { color: 'green', text: '可用' },
    IN_USE: { color: 'blue', text: '使用中' },
    MAINTENANCE: { color: 'orange', text: '维修中' },
    RETIRED: { color: 'red', text: '已报废' },
  };

  const columns = [
    { title: '资产名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
    { title: '位置', dataIndex: 'location', key: 'location' },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Asset) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>资产列表</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          新增资产
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default AssetList;
