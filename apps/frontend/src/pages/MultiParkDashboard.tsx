import { useState, useEffect } from 'react';
import { Table, Card, Statistic, Row, Col, message } from 'antd';
import { DollarOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getMultiParkSummary } from '../api/dashboard';

const MultiParkDashboard = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getMultiParkSummary();
      setSummary(data);
    } catch {
      message.error('获取多园区汇总失败');
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = summary.reduce((acc, s) => acc + s.assetCount, 0);
  const totalRevenue = summary.reduce((acc, s) => acc + (s.latestRevenue?.actualRevenue || 0), 0);

  const columns = [
    { title: '园区名称', dataIndex: 'name', key: 'name' },
    { title: '资产数量', dataIndex: 'assetCount', key: 'assetCount' },
    { title: '租赁数量', dataIndex: 'leaseCount', key: 'leaseCount' },
    {
      title: '最新收入',
      key: 'revenue',
      render: (_: unknown, record: any) =>
        record.latestRevenue ? `¥${record.latestRevenue.actualRevenue.toFixed(2)}` : '-',
    },
    {
      title: '完成比例',
      key: 'completion',
      render: (_: unknown, record: any) =>
        record.latestRevenue ? `${record.latestRevenue.completionRate.toFixed(1)}%` : '-',
    },
  ];

  return (
    <div>
      <h2>多园区经营汇总</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic title="总资产数" value={totalAssets} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="总收入" value={totalRevenue} precision={2} prefix={<DollarOutlined />} />
          </Card>
        </Col>
      </Row>
      <Table columns={columns} dataSource={summary} rowKey="id" loading={loading} />
    </div>
  );
};

export default MultiParkDashboard;
