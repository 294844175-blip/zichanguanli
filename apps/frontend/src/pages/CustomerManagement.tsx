import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Tabs, message, Modal, Form, Input, Select, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getCustomers, createCustomer, exportCustomers } from '../api/customers';
import { getAssets } from '../api/assets';
import { Customer, Asset } from '../types';
import { ListToolbar } from '../components/ListToolbar';

const { Option } = Select;

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, [searchKeyword, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const type = activeTab !== 'all' ? activeTab : undefined;
      const data = await getCustomers({ type, keyword: searchKeyword });
      setCustomers(data);
    } catch {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleExport = async () => {
    try {
      const type = activeTab !== 'all' ? activeTab : undefined;
      await exportCustomers({ type, keyword: searchKeyword });
      message.success('导出成功');
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error('导出失败');
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await getAssets({ pageSize: 1000 });
      setAssets(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createCustomer(values);
      message.success('新增成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('新增失败');
    }
  };

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color={t === 'TENANT' ? 'blue' : 'orange'}>{t === 'TENANT' ? '租赁客户' : '潜客'}</Tag>,
    },
  ];

  const items = [
    { key: 'all', label: '全部', children: <Table columns={columns} dataSource={customers} rowKey="id" loading={loading} /> },
    { key: 'TENANT', label: '租赁客户', children: <Table columns={columns} dataSource={customers.filter(c => c.type === 'TENANT')} rowKey="id" loading={loading} /> },
    { key: 'PROSPECT', label: '潜客', children: <Table columns={columns} dataSource={customers.filter(c => c.type === 'PROSPECT')} rowKey="id" loading={loading} /> },
  ];

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 16 }}>客户管理</h2>
      <ListToolbar
        searchPlaceholder="搜索客户名称、联系人、电话、邮箱、行业等"
        onSearch={handleSearch}
        onExport={handleExport}
        extraButtons={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新增客户
          </Button>
        }
      />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />

      <Modal
        title="新增客户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Input placeholder="请输入行业" />
          </Form.Item>
          <Form.Item name="type" label="客户类型" initialValue="PROSPECT">
            <Select>
              <Option value="PROSPECT">潜客</Option>
              <Option value="TENANT">租赁客户</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === 'PROSPECT' && (
                <>
                  <Form.Item name="intendedAssetId" label="意向资产">
                    <Select placeholder="请选择意向资产">
                      {assets.map(asset => (
                        <Option key={asset.id} value={asset.id}>{asset.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="intendedLeaseMode" label="意向租赁模式">
                    <Select placeholder="请选择模式">
                      <Option value="按面积">按面积</Option>
                      <Option value="按板数">按板数</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="intendedQuantity" label="意向租赁数量">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      addonAfter={
                        form.getFieldValue('intendedLeaseMode') === '按板数' ? '板' : '㎡'
                      }
                      placeholder="请输入数量"
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
