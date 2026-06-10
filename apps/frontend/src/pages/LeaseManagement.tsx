import { useState, useEffect } from 'react';
import { Table, Tag, Button, Tabs, message, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getLeases, getExpiringLeases, getOverdueLeases, exportLeases } from '../api/leases';
import { getAssets } from '../api/assets';
import { getCustomers } from '../api/customers';
import { Lease, Asset, Customer } from '../types';
import { ListToolbar } from '../components/ListToolbar';

const LeaseManagement = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [expiring, setExpiring] = useState<Lease[]>([]);
  const [overdue, setOverdue] = useState<Lease[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  useEffect(() => {
    fetchData();
  }, [searchKeyword, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { keyword: searchKeyword };
      const [all, exp, over, assetsData, customersData] = await Promise.all([
        getLeases(params),
        getExpiringLeases(),
        getOverdueLeases(),
        getAssets({ pageSize: 1000 }),
        getCustomers({}),
      ]);
      setLeases(all);
      setExpiring(exp);
      setOverdue(over);
      setAssets(assetsData.data || []);
      setCustomers(customersData);
    } catch {
      message.error('获取租赁数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const getAssetById = (id: string) => assets.find(a => a.id === id);
  const getCustomerById = (id: string) => customers.find(c => c.id === id);

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleExport = async () => {
    try {
      await exportLeases({ keyword: searchKeyword });
      message.success('导出成功');
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error('导出失败');
    }
  };

  const columns = [
    { title: '资产', key: 'asset', width: 150, render: (_: unknown, record: Lease) => getAssetById(record.assetId)?.name || '-' },
    { title: '客户', key: 'customer', width: 150, render: (_: unknown, record: Lease) => getCustomerById(record.customerId)?.name || '-' },
    { title: '租期', key: 'period', width: 220, render: (_: unknown, record: Lease) => `${new Date(record.startDate).toLocaleDateString()} ~ ${new Date(record.endDate).toLocaleDateString()}` },
    { title: '租赁方式', dataIndex: 'rentMethod', key: 'rentMethod', width: 100 },
    { title: '计费单位', dataIndex: 'billingUnit', key: 'billingUnit', width: 100 },
    { title: '租赁单价(元)', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '数量(㎡)', dataIndex: 'quantity', key: 'quantity', width: 90, render: (v: number) => v ? Math.round(v) : '-' },
    { title: '月租金(元)', key: 'monthlyRent', width: 120, render: (_: unknown, record: Lease) => `¥${((record.unitPrice || 0) * (record.quantity || 1)).toFixed(2)}` },
    { title: '物业费单价(元)', dataIndex: 'propertyFee', key: 'propertyFee', width: 120, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '水费单价(元)', dataIndex: 'waterFee', key: 'waterFee', width: 110, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '电费单价(元)', dataIndex: 'electricFee', key: 'electricFee', width: 110, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '押金(元)', dataIndex: 'deposit', key: 'deposit', width: 100, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          ACTIVE: { color: 'green', text: '租赁中' },
          EXPIRING: { color: 'orange', text: '即将到期' },
          EXPIRED: { color: 'red', text: '已到期' },
          OVERDUE: { color: 'red', text: '逾期' },
        };
        const { color, text } = map[s] || { color: 'default', text: s };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (r: string) => <Tag color={r === 'HIGH' ? 'red' : 'green'}>{r === 'HIGH' ? '高风险' : '正常'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: Lease) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          查看
        </Button>
      ),
    },
  ];
  
  const handleViewDetail = (lease: Lease) => {
    setSelectedLease(lease);
    setDetailModalVisible(true);
  };

  const items = [
    { key: 'all', label: '全部合同', children: <Table columns={columns} dataSource={leases} rowKey="id" loading={loading} scroll={{ x: 2000 }} /> },
    { key: 'expiring', label: `即将到期 (${expiring.length})`, children: <Table columns={columns} dataSource={expiring} rowKey="id" loading={loading} scroll={{ x: 2000 }} /> },
    { key: 'overdue', label: `逾期 (${overdue.length})`, children: <Table columns={columns} dataSource={overdue} rowKey="id" loading={loading} scroll={{ x: 2000 }} /> },
  ];

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 16 }}>租赁管理</h2>
      <ListToolbar
        searchPlaceholder="搜索资产名称、客户名称等"
        onSearch={handleSearch}
        onExport={handleExport}
      />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
      
      {/* 详情模态框 */}
      <Modal
        title="租赁详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedLease && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="资产" span={2}>
              {getAssetById(selectedLease.assetId)?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="客户" span={2}>
              {getCustomerById(selectedLease.customerId)?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {new Date(selectedLease.startDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {new Date(selectedLease.endDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="租赁方式">
              {selectedLease.rentMethod || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计费单位">
              {selectedLease.billingUnit || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="租赁单价(元)">
              {selectedLease.unitPrice ? `¥${selectedLease.unitPrice.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="数量(㎡)">
              {selectedLease.quantity ? Math.round(selectedLease.quantity) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="月租金(元)">
              ¥{((selectedLease.unitPrice || 0) * (selectedLease.quantity || 1)).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="物业费单价(元)">
              {selectedLease.propertyFee ? `¥${selectedLease.propertyFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="水费单价(元)">
              {selectedLease.waterFee ? `¥${selectedLease.waterFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电费单价(元)">
              {selectedLease.electricFee ? `¥${selectedLease.electricFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="押金(元)">
              {selectedLease.deposit ? `¥${selectedLease.deposit.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const map: Record<string, { color: string; text: string }> = {
                  ACTIVE: { color: 'green', text: '租赁中' },
                  EXPIRING: { color: 'orange', text: '即将到期' },
                  EXPIRED: { color: 'red', text: '已到期' },
                  OVERDUE: { color: 'red', text: '逾期' },
                };
                const { color, text } = map[selectedLease.status] || { color: 'default', text: selectedLease.status };
                return <Tag color={color}>{text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="风险等级">
              <Tag color={selectedLease.riskLevel === 'HIGH' ? 'red' : 'green'}>
                {selectedLease.riskLevel === 'HIGH' ? '高风险' : '正常'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LeaseManagement;
