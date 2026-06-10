import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/es/date-picker/locale/zh_CN';
dayjs.locale('zh-cn');
import {
  Layout,
  Menu,
  Table,
  Button,
  Tag,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Drawer,
  message,
  Descriptions,
  Divider,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  SnippetsOutlined,
  BuildOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import Header from '../components/Header';
import { useParkStore } from '../store/useParkStore';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getFollowUps, createFollowUp, updateFollowUp } from '../api/customers';
import { getLeases, createLease, updateLease } from '../api/leases';
import { getAlerts, markAsRead } from '../api/alerts';
import { getAssets } from '../api/assets';
import { getRevenueRecords, createRevenueRecord, updateRevenueRecord } from '../api/revenue';
import { Customer, Lease, Asset, Alert, RevenueRecord, FollowUp } from '../types';

const { Content } = Layout;
const { Option } = Select;

const CustomerBusiness = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 数据状态
  const { selectedParkId: selectedPark } = useParkStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // 模态框和抽屉状态
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [leaseModalVisible, setLeaseModalVisible] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);

  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueRecord | null>(null);

  const [customerForm] = Form.useForm();
  const [leaseForm] = Form.useForm();
  const [revenueForm] = Form.useForm();
  const [followUpForm] = Form.useForm();

  // 跟进记录状态
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  // 加载跟进记录
  const loadFollowUps = async (customerId: string) => {
    if (!customerId) return;
    setFollowUpLoading(true);
    try {
      const data = await getFollowUps(customerId);
      setFollowUps(data);
    } catch {
      message.error('加载跟进记录失败');
    } finally {
      setFollowUpLoading(false);
    }
  };

  // 当选中客户变化且抽屉打开时加载跟进记录
  useEffect(() => {
    if (customerDetailVisible && selectedCustomer) {
      loadFollowUps(selectedCustomer.id);
    }
  }, [customerDetailVisible, selectedCustomer]);

  // 保存跟进记录
  const handleSaveFollowUp = async (values: any) => {
    if (!selectedCustomer) return;
    try {
      if (editingFollowUp) {
        // 检查是否是当天的记录
        const createdDate = new Date(editingFollowUp.createdAt).toDateString();
        const today = new Date().toDateString();
        if (createdDate !== today) {
          message.error('只能修改当天的跟进记录');
          return;
        }
        await updateFollowUp(selectedCustomer.id, editingFollowUp.id, values);
        message.success('更新成功');
      } else {
        await createFollowUp(selectedCustomer.id, values);
        message.success('新增成功');
      }
      setFollowUpModalVisible(false);
      setEditingFollowUp(null);
      followUpForm.resetFields();
      loadFollowUps(selectedCustomer.id);
    } catch {
      message.error('保存失败');
    }
  };

  // 打开新增跟进弹窗
  const handleAddFollowUp = () => {
    setEditingFollowUp(null);
    followUpForm.resetFields();
    followUpForm.setFieldsValue({ followUpDate: dayjs(), createdBy: '管理员' });
    setFollowUpModalVisible(true);
  };

  // 打开编辑跟进弹窗
  const handleEditFollowUp = (record: FollowUp) => {
    // 检查是否是当天的记录
    const createdDate = new Date(record.createdAt).toDateString();
    const today = new Date().toDateString();
    if (createdDate !== today) {
      message.warning('只能修改当天的跟进记录');
      return;
    }
    setEditingFollowUp(record);
    followUpForm.setFieldsValue({
      ...record,
      followUpDate: record.followUpDate ? dayjs(record.followUpDate) : undefined,
      createdBy: record.createdBy,
    });
    setFollowUpModalVisible(true);
  };

  // 加载数据
  useEffect(() => {
    loadInitialData();
  }, [selectedPark]);

  const loadInitialData = async () => {
    // 如果没有选择园区，先不加载
    if (!selectedPark) {
      return;
    }
    setLoading(true);
    try {
      const [customersData, leasesData, assetsResponse, revenueData, alertsData] = await Promise.all([
        getCustomers({ parkId: selectedPark }),
        getLeases({ parkId: selectedPark }),
        getAssets({ pageSize: 1000, parkId: selectedPark }),
        getRevenueRecords({ parkId: selectedPark }),
        getAlerts(),
      ]);

      setCustomers(customersData);
      setLeases(leasesData);
      setAssets(assetsResponse.data || []);
      setRevenueRecords(revenueData);
      setAlerts(alertsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'spaceview':
        navigate('/space-view');
        break;
      case 'assets':
        navigate('/assets');
        break;
      case 'customer-business':
        navigate('/customer-business');
        break;
      default:
        break;
    }
  };

  // 客户管理
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    customerForm.resetFields();
    setCustomerModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    customerForm.setFieldsValue(customer);
    setCustomerModalVisible(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailVisible(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除客户「${customer.name}」吗？`,
      onOk: async () => {
        try {
          await deleteCustomer(customer.id);
          setCustomers(customers.filter((c) => c.id !== customer.id));
          message.success('删除成功');
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSaveCustomer = async (values: any) => {
    try {
      console.log('保存客户数据:', values);
      
      const saveData = {
        ...values,
        parkId: selectedPark
      };
      
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, saveData);
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? updated : c)));
        message.success('更新成功');
      } else {
        const newCustomer = await createCustomer(saveData);
        setCustomers([...customers, newCustomer]);
        message.success('创建成功');
      }
      setCustomerModalVisible(false);
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 租赁管理
  const handleAddLease = () => {
    setEditingLease(null);
    leaseForm.resetFields();
    setLeaseModalVisible(true);
  };

  const handleEditLease = (lease: Lease) => {
    setEditingLease(lease);
    leaseForm.setFieldsValue({
      ...lease,
      startDate: lease.startDate ? dayjs(lease.startDate) : undefined,
      endDate: lease.endDate ? dayjs(lease.endDate) : undefined,
    });
    setLeaseModalVisible(true);
  };

  const handleSaveLease = async (values: any) => {
    try {
      const parkId = values.parkId || selectedPark;
      if (!parkId) {
        message.error('请先选择园区');
        return;
      }

      if (!values.startDate) {
        message.error('请选择开始日期');
        return;
      }
      if (!values.endDate) {
        message.error('请选择结束日期');
        return;
      }

      const saveData = {
        ...values,
        parkId,
        billingUnit: values.billingUnit || '月',
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        // 月租金 = 租赁单价 × 数量
        monthlyEstimate: (values.unitPrice || 0) * (values.quantity || 1),
        waterFee: values.waterFee || 0,
        electricFee: values.electricFee || 0,
      };

      console.log('保存租约数据:', saveData);

      if (editingLease) {
        const updated = await updateLease(editingLease.id, saveData);
        setLeases(leases.map((l) => (l.id === editingLease.id ? updated : l)));
        message.success('更新成功');
      } else {
        const newLease = await createLease(saveData);
        setLeases([...leases, newLease]);
        message.success('创建成功');
      }
      setLeaseModalVisible(false);
    } catch (error: any) {
      console.error('保存失败:', error);
      const errorMsg = error.response?.data?.error || error.message || '未知错误';
      message.error('保存失败: ' + errorMsg);
    }
  };

  // 收入管理
  const handleAddRevenue = () => {
    setEditingRevenue(null);
    revenueForm.resetFields();
    setRevenueModalVisible(true);
  };

  const handleEditRevenue = (record: RevenueRecord) => {
    setEditingRevenue(record);
    revenueForm.setFieldsValue(record);
    setRevenueModalVisible(true);
  };

  const handleSaveRevenue = async (values: any) => {
    try {
      // 确保 parkId 存在
      const saveData = {
        ...values,
        parkId: values.parkId || selectedPark
      };
      
      console.log('保存收入数据:', saveData);
      
      if (editingRevenue) {
        const updated = await updateRevenueRecord(editingRevenue.id, saveData);
        setRevenueRecords(revenueRecords.map((r) => (r.id === editingRevenue.id ? updated : r)));
        message.success('更新成功');
      } else {
        const newRevenue = await createRevenueRecord(saveData);
        setRevenueRecords([...revenueRecords, newRevenue]);
        message.success('创建成功');
      }
      setRevenueModalVisible(false);
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 预警管理
  const handleMarkAsRead = async (alert: Alert) => {
    try {
      await markAsRead(alert.id);
      setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, status: 'READ' } : a)));
      message.success('已标记为已读');
    } catch {
      message.error('操作失败');
    }
  };

  const getCustomerById = (id: string) => customers.find((c) => c.id === id);
  const getAssetById = (id: string) => assets.find((a) => a.id === id);

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      ACTIVE: { color: 'green', text: '租赁中' },
      EXPIRING: { color: 'orange', text: '即将到期' },
      EXPIRED: { color: 'red', text: '已到期' },
      OVERDUE: { color: 'red', text: '逾期' },
      VACANT: { color: 'default', text: '空置' },
      RENTED: { color: 'blue', text: '已出租' },
      RISK: { color: 'red', text: '风险' },
    };
    const { color, text } = map[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getSeverityTag = (severity: string) => {
    const map: Record<string, string> = {
      LOW: 'default',
      MEDIUM: 'orange',
      HIGH: 'red',
      CRITICAL: 'red',
    };
    return <Tag color={map[severity] || 'default'}>{severity}</Tag>;
  };

  const customerColumns = [
    { title: '客户名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 120 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 150 },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 150 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={type === 'TENANT' ? 'blue' : 'orange'}>{type === 'TENANT' ? '租赁客户' : '潜客'}</Tag>,
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewCustomer(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCustomer(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCustomer(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const [leaseDetailModalVisible, setLeaseDetailModalVisible] = useState(false);
  const [selectedLeaseDetail, setSelectedLeaseDetail] = useState<Lease | null>(null);
  
  const handleViewLeaseDetail = (lease: Lease) => {
    setSelectedLeaseDetail(lease);
    setLeaseDetailModalVisible(true);
  };

  const leaseColumns = [
    {
      title: '空间',
      key: 'asset',
      width: 150,
      render: (_: unknown, record: Lease) => {
        const asset = getAssetById(record.assetId);
        return asset?.name || '-';
      },
    },
    {
      title: '客户',
      key: 'customer',
      width: 200,
      render: (_: unknown, record: Lease) => {
        const customer = getCustomerById(record.customerId);
        return customer?.name || '-';
      },
    },
    {
      title: '租期',
      key: 'period',
      width: 220,
      render: (_: unknown, record: Lease) => `${new Date(record.startDate).toLocaleDateString()} 至 ${new Date(record.endDate).toLocaleDateString()}`,
    },
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
      render: getStatusTag,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => <Tag color={level === 'HIGH' ? 'red' : 'green'}>{level === 'HIGH' ? '高风险' : '正常'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Lease) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewLeaseDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditLease(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const revenueColumns = [
    { title: '周期', dataIndex: 'period', key: 'period', width: 120 },
    { title: '目标收入(元)', dataIndex: 'targetRevenue', key: 'targetRevenue', width: 140 },
    { title: '实际收入(元)', dataIndex: 'actualRevenue', key: 'actualRevenue', width: 140 },
    { title: '完成率(%)', dataIndex: 'completionRate', key: 'completionRate', width: 120 },
    { title: '毛利率(%)', dataIndex: 'grossMargin', key: 'grossMargin', width: 120 },
    { title: '应收账款(元)', dataIndex: 'receivable', key: 'receivable', width: 140 },
    { title: '逾期金额(元)', dataIndex: 'overdue', key: 'overdue', width: 140 },
    { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: RevenueRecord) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRevenue(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const alertColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '消息', dataIndex: 'message', key: 'message', width: 400 },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 120, render: getSeverityTag },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={status === 'UNREAD' ? 'red' : 'default'}>{status === 'UNREAD' ? '未读' : '已读'}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Alert) => (
        <Space size="small">
          {record.status === 'UNREAD' && (
            <Button type="link" size="small" onClick={() => handleMarkAsRead(record)}>
              标为已读
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 计算未读预警
  const unreadCount = alerts.filter((a) => a.status === 'UNREAD').length;

  const tabItems = [
    {
      key: 'customers',
      label: '客户管理',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>客户管理</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomer}>
              新增客户
            </Button>
          </div>
          <Table
            columns={customerColumns}
            dataSource={customers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
    {
      key: 'leases',
      label: '租赁管理',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>租赁管理</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLease}>
              新增租赁
            </Button>
          </div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic title="总客户数" value={new Set(leases.map(l => l.customerId)).size} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="即将到期"
                  value={(() => {
                    const now = new Date();
                    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    const expiringCustomerIds = new Set(
                      leases
                        .filter(l => {
                          const endDate = new Date(l.endDate);
                          return endDate >= now && endDate <= thirtyDaysLater;
                        })
                        .map(l => l.customerId)
                    );
                    return expiringCustomerIds.size;
                  })()}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="出租率"
                  value={(() => {
                    const totalAssetArea = assets.reduce((sum, a) => sum + (a.assetArea || 0), 0);
                    if (totalAssetArea === 0) return 0;
                    const totalLeasedArea = leases
                      .filter(l => l.status === 'ACTIVE')
                      .reduce((sum, l) => sum + (l.quantity || 0), 0);
                    return Math.round((totalLeasedArea / totalAssetArea) * 100);
                  })()}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={leaseColumns}
            dataSource={leases}
            rowKey="id"
            loading={loading}
            scroll={{ x: 2000 }}
          />
        </div>
      ),
    },
    {
      key: 'revenue',
      label: '收入管理',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>收入管理</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRevenue}>
              新增收入
            </Button>
          </div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="目标收入" value={revenueRecords[0]?.targetRevenue || 0} prefix="¥" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="实际收入"
                  value={revenueRecords[0]?.actualRevenue || 0}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="完成率" value={revenueRecords[0]?.completionRate || 0} suffix="%" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="逾期金额"
                  value={revenueRecords[0]?.overdue || 0}
                  prefix="¥"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={revenueColumns}
            dataSource={revenueRecords}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
    {
      key: 'alerts',
      label: `预警监控 (${unreadCount})`,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>预警监控</h3>
          </div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="总预警" value={alerts.length} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="未读" value={unreadCount} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="高风险"
                  value={alerts.filter((a) => a.severity === 'HIGH' || a.severity === 'CRITICAL').length}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已处理"
                  value={alerts.filter((a) => a.status === 'RESOLVED').length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={alertColumns}
            dataSource={alerts}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ height: '100vh', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Secondary Nav Bar */}
      <div
        style={{
          height: 48,
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid #e8e8e8',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={['customer-business']}
          style={{ background: 'transparent', borderBottom: 'none', flex: 1, minWidth: 0 }}
          onClick={handleMenuClick}
          items={[
            { key: 'dashboard', label: '资产总览', icon: <HomeOutlined /> },
            { key: 'spaceview', label: '空间视图', icon: <SnippetsOutlined /> },
            { key: 'assets', label: '资产管理', icon: <BuildOutlined /> },
            { key: 'customer-business', label: '客户经营', icon: <SwapOutlined /> },
          ]}
        />
      </div>

      {/* Main Content Area */}
      <Content style={{ padding: 24, background: '#f5f5f5', flex: 1, overflow: 'auto' }}>
        {!selectedPark ? (
          <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>
            请先在顶部导航栏选择园区
          </div>
        ) : (
          <Spin spinning={loading}>
            <Tabs defaultActiveKey="customers" items={tabItems} />
          </Spin>
        )}
      </Content>

      {/* Customer Edit Modal */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={customerModalVisible}
        onCancel={() => setCustomerModalVisible(false)}
        onOk={() => customerForm.submit()}
        width={600}
      >
        <Form form={customerForm} layout="vertical" onFinish={handleSaveCustomer} initialValues={{ type: 'TENANT', status: 'ACTIVE' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="客户类型" rules={[{ required: true }]}>
                <Select placeholder="请选择客户类型">
                  <Option value="TENANT">租赁客户</Option>
                  <Option value="PROSPECT">潜客</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业">
                <Input placeholder="请输入行业" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="needs" label="需求">
            <Input.TextArea placeholder="请输入客户需求" rows={3} />
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
                        customerForm.getFieldValue('intendedLeaseMode') === '按板数' ? '板' : '㎡'
                      }
                      placeholder="请输入数量"
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Input placeholder="请输入状态" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Detail Drawer */}
      <Drawer
        title={selectedCustomer?.name}
        placement="right"
        onClose={() => setCustomerDetailVisible(false)}
        open={customerDetailVisible}
        width={600}
      >
        {selectedCustomer && (
          <div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="客户名称">{selectedCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="客户类型">
                <Tag color={selectedCustomer.type === 'TENANT' ? 'blue' : 'orange'}>
                  {selectedCustomer.type === 'TENANT' ? '租赁客户' : '潜客'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{selectedCustomer.contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{selectedCustomer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedCustomer.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="行业">{selectedCustomer.industry || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{selectedCustomer.status}</Descriptions.Item>
              <Descriptions.Item label="需求">{selectedCustomer.needs || '-'}</Descriptions.Item>
            </Descriptions>
            {selectedCustomer.type === 'PROSPECT' && (
              <>
                <Divider>意向信息</Divider>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="意向资产">
                    {(() => {
                      const asset = getAssetById(selectedCustomer.intendedAssetId || '');
                      return asset?.name || selectedCustomer.intendedAssetId || '-';
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="意向租赁模式">
                    {selectedCustomer.intendedLeaseMode || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="意向租赁数量">
                    {selectedCustomer.intendedQuantity != null
                      ? `${selectedCustomer.intendedQuantity} ${selectedCustomer.intendedLeaseMode === '按板数' ? '板' : '㎡'}`
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
            <Divider />
            <Button
              type="primary"
              icon={<EditOutlined />}
              block
              style={{ marginBottom: 24 }}
              onClick={() => {
                setCustomerDetailVisible(false);
                handleEditCustomer(selectedCustomer);
              }}
            >
              编辑客户
            </Button>

            {/* 租赁订单区域 */}
            <Divider orientation="left">租赁订单</Divider>
            {(() => {
              const customerLeases = leases.filter(l => l.customerId === selectedCustomer.id);
              if (customerLeases.length === 0) {
                return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无租赁订单</div>;
              }
              return (
                <div style={{ marginBottom: 24 }}>
                  {customerLeases.map(lease => {
                    const asset = getAssetById(lease.assetId);
                    return (
                      <div
                        key={lease.id}
                        style={{
                          padding: '12px',
                          marginBottom: '12px',
                          background: '#fafafa',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#333' }}>{asset?.name || '未知空间'}</span>
                          {getStatusTag(lease.status)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          租期：{lease.startDate} 至 {lease.endDate}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          租赁数量：{Math.round(lease.quantity || 0)} ㎡
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          月租金：¥{((lease.unitPrice || 0) * (lease.quantity || 1)).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* 跟进记录区域 */}
            <Divider orientation="left">跟进记录</Divider>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFollowUp}>
                新增跟进
              </Button>
            </div>
            <Spin spinning={followUpLoading}>
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {followUps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无跟进记录</div>
                ) : (
                  followUps.map((record) => {
                    const isToday = new Date(record.createdAt).toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={record.id}
                        style={{
                          padding: '12px',
                          marginBottom: '12px',
                          background: '#fafafa',
                          borderRadius: '8px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 600, color: '#333' }}>{record.createdBy}</span>
                            <span style={{ fontSize: '12px', color: '#999' }}>
                              {new Date(record.followUpDate).toLocaleString()}
                            </span>
                          </div>
                          {isToday && (
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleEditFollowUp(record)}
                            >
                              编辑
                            </Button>
                          )}
                        </div>
                        <div style={{ color: '#666', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                          {record.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Spin>
          </div>
        )}
      </Drawer>

      {/* Lease Edit Modal */}
      <Modal
        title={editingLease ? '编辑租赁' : '新增租赁'}
        open={leaseModalVisible}
        onCancel={() => setLeaseModalVisible(false)}
        onOk={() => leaseForm.submit()}
        width={800}
      >
        <Form
          form={leaseForm}
          layout="vertical"
          onFinish={handleSaveLease}
          initialValues={{ rentMethod: '按面积', billingUnit: '月', status: 'ACTIVE', riskLevel: 'NORMAL', parkId: selectedPark }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
                <Select placeholder="请选择客户">
                  {customers.map((customer) => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assetId" label="空间" rules={[{ required: true }]}>
                <Select placeholder="请选择空间">
                  {assets.map((asset) => (
                    <Option key={asset.id} value={asset.id}>
                      {asset.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rentMethod" label="租赁方式">
                <Select placeholder="请选择租赁方式">
                  <Option value="按面积">按面积</Option>
                  <Option value="按间数">按间数</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unitPrice" label="租赁单价(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="quantity" label="数量(㎡)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.unitPrice !== cur.unitPrice || prev.quantity !== cur.quantity}>
                {({ getFieldValue }) => {
                  const price = getFieldValue('unitPrice') || 0;
                  const qty = getFieldValue('quantity') || 0;
                  const rent = price * qty;
                  return (
                    <Form.Item name="monthlyEstimate" label="月租金(元)">
                      <InputNumber style={{ width: '100%' }} min={0} readOnly value={rent} />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="propertyFee" label="物业费单价(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="waterFee" label="水费单价(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="electricFee" label="电费单价(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deposit" label="押金(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">正常</Option>
                  <Option value="EXPIRING">即将到期</Option>
                  <Option value="EXPIRED">已到期</Option>
                  <Option value="OVERDUE">逾期</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="riskLevel" label="风险等级">
                <Select placeholder="请选择风险等级">
                  <Option value="NORMAL">正常</Option>
                  <Option value="HIGH">高风险</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Revenue Edit Modal */}
      <Modal
        title={editingRevenue ? '编辑收入' : '新增收入'}
        open={revenueModalVisible}
        onCancel={() => setRevenueModalVisible(false)}
        onOk={() => revenueForm.submit()}
        width={800}
      >
        <Form
          form={revenueForm}
          layout="vertical"
          onFinish={handleSaveRevenue}
          initialValues={{ source: '租赁收入', parkId: selectedPark }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="period" label="周期" rules={[{ required: true }]} getValueFromEvent={(date: any) => date ? date.format('YYYY-MM') : ''} getValueProps={(value: any) => ({ value: value ? dayjs(value, 'YYYY-MM') : undefined })}>
                <DatePicker picker="month" style={{ width: '100%' }} placeholder="请选择年月" locale={zhCN} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="来源">
                <Select placeholder="请选择来源">
                  <Option value="租赁收入">租赁收入</Option>
                  <Option value="物业费">物业费</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="targetRevenue" label="目标收入(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualRevenue" label="实际收入(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedRevenue" label="预计收入(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="totalCost" label="总成本(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="grossProfit" label="毛利润(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="grossMargin" label="毛利率(%)">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="receivable" label="应收账款(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="overdue" label="逾期金额(元)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="overdueRate" label="逾期率(%)">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Follow Up Modal */}
      <Modal
        title={editingFollowUp ? '编辑跟进记录' : '新增跟进记录'}
        open={followUpModalVisible}
        onCancel={() => setFollowUpModalVisible(false)}
        onOk={() => followUpForm.submit()}
        width={600}
      >
        <Form form={followUpForm} layout="vertical" onFinish={handleSaveFollowUp}>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="followUpDate" label="跟进时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="createdBy" label="跟进人" rules={[{ required: true }]}>
                <Input placeholder="请输入跟进人" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Lease Detail Modal */}
      <Modal
        title="租赁详情"
        open={leaseDetailModalVisible}
        onCancel={() => setLeaseDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLeaseDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedLeaseDetail && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="空间" span={2}>
              {getAssetById(selectedLeaseDetail.assetId)?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="客户" span={2}>
              {getCustomerById(selectedLeaseDetail.customerId)?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {new Date(selectedLeaseDetail.startDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {new Date(selectedLeaseDetail.endDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="租赁方式">
              {selectedLeaseDetail.rentMethod || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计费单位">
              {selectedLeaseDetail.billingUnit || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="租赁单价(元)">
              {selectedLeaseDetail.unitPrice ? `¥${selectedLeaseDetail.unitPrice.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="数量(㎡)">
              {selectedLeaseDetail.quantity ? Math.round(selectedLeaseDetail.quantity) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="月租金(元)">
              ¥{((selectedLeaseDetail.unitPrice || 0) * (selectedLeaseDetail.quantity || 1)).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="物业费单价(元)">
              {selectedLeaseDetail.propertyFee ? `¥${selectedLeaseDetail.propertyFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="水费单价(元)">
              {selectedLeaseDetail.waterFee ? `¥${selectedLeaseDetail.waterFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电费单价(元)">
              {selectedLeaseDetail.electricFee ? `¥${selectedLeaseDetail.electricFee.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="押金(元)">
              {selectedLeaseDetail.deposit ? `¥${selectedLeaseDetail.deposit.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const statusMap: Record<string, { color: string; text: string }> = {
                  ACTIVE: { color: 'green', text: '租赁中' },
                  EXPIRING: { color: 'orange', text: '即将到期' },
                  EXPIRED: { color: 'red', text: '已到期' },
                  OVERDUE: { color: 'red', text: '逾期' },
                };
                const { color, text } = statusMap[selectedLeaseDetail.status] || { color: 'default', text: selectedLeaseDetail.status };
                return <Tag color={color}>{text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="风险等级">
              <Tag color={selectedLeaseDetail.riskLevel === 'HIGH' ? 'red' : 'green'}>
                {selectedLeaseDetail.riskLevel === 'HIGH' ? '高风险' : '正常'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Layout>
  );
};

export default CustomerBusiness;
