import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Drawer,
  Tag,
  Form,
  Input,
  InputNumber,
  Select,
  Collapse,
  Timeline,
  Empty,
  Divider,
  message,
  Spin,
  Upload,
  Modal,
} from 'antd';
import {
  ComposedChart,
  BarChart,
  AreaChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  HomeOutlined,
  SnippetsOutlined,
  BuildOutlined,
  SwapOutlined,
  ZoomInOutlined,
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import Header from '../components/Header';
import SpaceEditor from '../components/SpaceEditor';
import { useParkStore } from '../store/useParkStore';
import { getOverview, getMonthlyTrends } from '../api/dashboard';
import { getLeases } from '../api/leases';
import { getCustomers, getFollowUps } from '../api/customers';
import { getAssetSlices, getAssets, updateAsset, getAssetImages, uploadAssetImage, deleteAssetImage } from '../api/assets';
import { Customer, Lease, Asset, MonthlyTrendItem, DashboardOverview as DashboardOverviewType, AssetTypeBreakdownItem } from '../types';

const { Content } = Layout;
const { Panel } = Collapse;

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedParkId: selectedPark } = useParkStore();
  const [overview, setOverview] = useState<DashboardOverviewType | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypeBreakdown, setAssetTypeBreakdown] = useState<AssetTypeBreakdownItem[]>([
    { name: '冻库', value: 0 },
    { name: '冷藏库', value: 0 },
    { name: '常温库', value: 0 },
    { name: '办公', value: 0 },
    { name: '配套', value: 0 },
  ]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedSpaceData, setSelectedSpaceData] = useState<any>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [spaceProspects, setSpaceProspects] = useState<any[]>([]);
  const [spaceImages, setSpaceImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 当选择园区变化时加载数据
  useEffect(() => {
    const loadData = async () => {
      // 如果没有选择园区，先不加载
      if (!selectedPark) {
        return;
      }
      setLoading(true);
      try {
        const [overviewData, trendsData, leasesData, customersData, assetsResult] = await Promise.all([
          getOverview(selectedPark),
          getMonthlyTrends({ parkId: selectedPark }),
          getLeases({ parkId: selectedPark }),
          getCustomers({ parkId: selectedPark }),
          getAssets({ parkId: selectedPark, page: 1, pageSize: 10000 }),
        ]);
        setOverview(overviewData);
        setMonthlyTrends(trendsData);
        setLeases(leasesData);
        setCustomers(customersData);

        // 基于资产列表计算资产结构分布（和资产管理列表同一套数据）
        const assetList = assetsResult.data || [];
        setAssets(assetList);

        // 按类型汇总资产面积（使用资产面积 assetArea）
        const typeMap: Record<string, number> = { '冻库': 0, '冷藏库': 0, '常温库': 0, '办公': 0, '配套': 0 };
        assetList.forEach((asset) => {
          const type = asset.type || '配套';
          const area = asset.assetArea || 0;
          if (type in typeMap) {
            typeMap[type] += area;
          } else {
            typeMap['配套'] += area;
          }
        });
        const breakdown: AssetTypeBreakdownItem[] = [
          { name: '冻库', value: typeMap['冻库'] },
          { name: '冷藏库', value: typeMap['冷藏库'] },
          { name: '常温库', value: typeMap['常温库'] },
          { name: '办公', value: typeMap['办公'] },
          { name: '配套', value: typeMap['配套'] },
        ];
        setAssetTypeBreakdown(breakdown);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedPark]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VACANT': return 'default';
      case 'RENTED': return 'blue';
      case 'EXPIRING': return 'orange';
      case 'RISK': return 'red';
      case 'CONSTRUCTION': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VACANT': return '空置';
      case 'RENTED': return '已出租';
      case 'EXPIRING': return '即将到期';
      case 'RISK': return '异常';
      case 'CONSTRUCTION': return '建设中';
      default: return '';
    }
  };

  const getCurrentSpaceData = () => selectedSpaceData;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartEdit = () => {
    const space = getCurrentSpaceData();
    if (!space) return;
    editForm.setFieldsValue({
      code: space.code,
      name: space.name,
      graphicArea: space.graphicArea || space.area,
      assetArea: space.assetArea || space.area,
      status: space.status,
      type: space.type || '标准仓库',
      floorHeight: space.floorHeight || 9.0,
      loadCapacity: space.loadCapacity || 3.0,
      passage: space.passage || '贯通',
      sliceX: space.sliceX || 0,
      sliceY: space.sliceY || 0,
      sliceWidth: space.sliceWidth || 0,
      sliceHeight: space.sliceHeight || 0,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    editForm.resetFields();
  };

  const handleSaveEdit = async (values: any) => {
    const isDuplicateName = spaces.some(space => space.id !== selectedSpaceId && space.name === values.name);
    if (isDuplicateName) {
      message.error('空间名称已存在，请使用其他名称');
      return;
    }
    try {
      if (selectedSpaceId) {
        await updateAsset(selectedSpaceId, values);
        message.success('保存成功');
        setIsEditing(false);
        await reloadSpaceData();
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.response?.data?.details || error?.message || '保存失败';
      message.error(errorMsg);
    }
  };

  const loadProspectsForSpace = async (space: any) => {
    if (!space || (space.status !== 'VACANT' && space.status !== 'CONSTRUCTION')) {
      setSpaceProspects([]);
      return;
    }
    try {
      const allCustomers = await getCustomers({ type: 'PROSPECT', parkId: selectedPark || undefined });
      const prospectsWithFollowUps = await Promise.all(
        allCustomers
          .filter((c: Customer) => c.intendedAssetId === space.id)
          .map(async (c: Customer) => {
            const followUps = await getFollowUps(c.id);
            return {
              id: c.id, name: c.name, contact: c.contact, phone: c.phone,
              email: c.email, industry: c.industry, intendedLeaseMode: c.intendedLeaseMode,
              intendedQuantity: c.intendedQuantity, followUps,
            };
          })
      );
      setSpaceProspects(prospectsWithFollowUps);
    } catch {
      setSpaceProspects([]);
    }
  };

  const loadSpaceImages = async (assetId: string) => {
    if (!assetId) { setSpaceImages([]); return; }
    setImagesLoading(true);
    try {
      const images = await getAssetImages(assetId);
      setSpaceImages(images);
    } catch {
      setSpaceImages([]);
    } finally { setImagesLoading(false); }
  };

  const handleUploadImage = async (file: File) => {
    if (!selectedSpaceId) return;
    try {
      const result = await uploadAssetImage(selectedSpaceId, file);
      setSpaceImages(prev => [...prev, result.url]);
      message.success('上传成功');
    } catch {
      message.error('上传失败');
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedSpaceId) return;
    try {
      await deleteAssetImage(selectedSpaceId, imageUrl);
      setSpaceImages(prev => prev.filter(url => url !== imageUrl));
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const reloadSpaceData = async () => {
    if (!selectedPark) return;
    try {
      const assetsData = await getAssetSlices(selectedPark);
      const transformed = assetsData.map((asset: any) => {
        const relatedLease = leases.find(lease => lease.assetId === asset.id);
        let customerInfo = null;
        if (relatedLease) customerInfo = customers.find(cust => cust.id === relatedLease.customerId);
        return {
          id: asset.id, code: asset.code, name: asset.name, graphicArea: asset.graphicArea,
          assetArea: asset.assetArea, area: asset.assetArea, status: asset.status,
          customer: customerInfo?.name || '', startDate: relatedLease?.startDate || asset.startDate,
          endDate: relatedLease?.endDate || asset.endDate, industry: customerInfo?.industry || '',
          phone: customerInfo?.phone || '', contractNo: relatedLease?.id || '', ...asset,
        };
      });
      setSpaces(transformed);
      const updatedSpace = transformed.find(s => s.id === selectedSpaceId);
      if (updatedSpace) {
        setSelectedSpaceData(updatedSpace);
        loadProspectsForSpace(updatedSpace);
      }
    } catch (error) {
      console.error('重新加载数据失败:', error);
    }
  };

  const handleSpaceDblClick = (id: string, space: any) => {
    setSelectedSpaceId(id);
    setSelectedSpaceData(space);
    loadProspectsForSpace(space);
    loadSpaceImages(id);
    setIsPropertyPanelOpen(true);
  };

  return (
    <Layout style={{ 
      height: '100vh', 
      background: '#fff', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />

      {/* Secondary Nav Bar */}
      <div style={{
        height: 48, 
        background: '#fafafa',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px', 
        borderBottom: '1px solid #e8e8e8',
        flexShrink: 0,
        minWidth: 0
      }}>
        <Menu 
          mode="horizontal" 
          selectedKeys={['dashboard']} 
          style={{ 
            background: 'transparent', 
            borderBottom: 'none', 
            flex: 1, 
            minWidth: 0
          }}
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
      <Content style={{ 
        padding: 12, 
        background: '#f5f5f5', 
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && (
          <>
            {/* 顶部统计卡片 */}
            <Row gutter={[12, 12]} style={{ marginBottom: 12, flexShrink: 0 }}>
              {[
                { 
                  title: "总资产面积", 
                  value: Math.round(overview?.occupancy.totalRentableArea || 0), 
                  suffix: "㎡" 
                },
                { 
                  title: "已出租面积", 
                  value: Math.round(overview?.occupancy.rentedArea || 0), 
                  suffix: "㎡", 
                  subText: `出租率 ${(() => {
                    const totalAssetArea = assets.reduce((sum, a) => sum + (a.assetArea || 0), 0);
                    if (totalAssetArea === 0) return '0.0';
                    const totalLeasedArea = leases
                      .filter(l => l.status === 'ACTIVE')
                      .reduce((sum, l) => sum + (l.quantity || 0), 0);
                    return ((totalLeasedArea / totalAssetArea) * 100).toFixed(1);
                  })()}%` 
                },
                { 
                  title: "空置面积", 
                  value: Math.round((overview?.occupancy.totalRentableArea || 0) - (overview?.occupancy.rentedArea || 0)), 
                  suffix: "㎡", 
                  subText: `空置率 ${(() => {
                    const totalAssetArea = assets.reduce((sum, a) => sum + (a.assetArea || 0), 0);
                    if (totalAssetArea === 0) return '0.0';
                    const totalLeasedArea = leases
                      .filter(l => l.status === 'ACTIVE')
                      .reduce((sum, l) => sum + (l.quantity || 0), 0);
                    return (((totalAssetArea - totalLeasedArea) / totalAssetArea) * 100).toFixed(1);
                  })()}%` 
                },
                { 
                  title: "在租客户", 
                  value: overview?.customers.tenantCustomers || 0, 
                  suffix: "家" 
                },
                { 
                  title: "合同即将到期", 
                  value: overview?.leases.expiringLeases || 0, 
                  suffix: "份", 
                  subText: "30天内到期" 
                },
                { 
                  title: "本月收入(含税)", 
                  value: overview?.revenue.actualRevenue || 0, 
                  prefix: "¥" 
                },
                { 
                  title: "本月毛利率", 
                  value: Number((overview?.revenue.grossMargin || 0).toFixed(1)), 
                  suffix: "%" 
                }
              ].map((item, index) => (
                <Col 
                  key={index} 
                  xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} flex={1}
                >
                  <Card 
                    size="small" 
                    style={{ 
                      borderRadius: 8,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '8px 12px'
                    }}
                    styles={{ body: { padding: '0' } }}
                  >
                    <Statistic
                      title={item.title}
                      value={item.value}
                      prefix={item.prefix}
                      suffix={item.suffix}
                      valueStyle={{ color: '#000', fontSize: 18, fontWeight: 'bold' }}
                    />
                    {item.subText && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>
                        {item.subText}
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>

        {/* 主要内容区域 */}
        <Row gutter={[12, 12]} style={{ flex: 1, minHeight: 0 }}>
          {/* 左侧：空间平面图 */}
          <Col xs={24} lg={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card 
              title="空间平面图" 
              size="small"
              extra={
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<ZoomInOutlined />}
                  onClick={() => navigate('/space-view')}
                >
                  放大
                </Button>
              }
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', minHeight: 0 } }}
            >
              {/* 图例 */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                <Space>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#1890ff', marginRight: 4 }} />
                  <span style={{ fontSize: 12 }}>已出租</span>
                </Space>
                <Space>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#8c8c8c', marginRight: 4 }} />
                  <span style={{ fontSize: 12 }}>建设中</span>
                </Space>
                <Space>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#52c41a', marginRight: 4 }} />
                  <span style={{ fontSize: 12 }}>空置</span>
                </Space>
                <Space>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#faad14', marginRight: 4 }} />
                  <span style={{ fontSize: 12 }}>即将到期</span>
                </Space>
                <Space>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#ff4d4f', marginRight: 4 }} />
                  <span style={{ fontSize: 12 }}>异常</span>
                </Space>
              </div>

              {/* 空间视图画板 */}
              <div style={{ 
                flex: 1,
                minHeight: 0,
                position: 'relative',
                overflow: 'hidden',
                width: '100%'
              }}>
                {selectedPark && (
                  <SpaceEditor 
                    parkId={selectedPark}
                    isViewMode={true}
                    leases={leases}
                    customers={customers}
                    onSpaceSelect={(id, space) => {
                      setSelectedSpaceId(id);
                      setSelectedSpaceData(space);
                      loadProspectsForSpace(space);
                      if (id) loadSpaceImages(id);
                    }}
                    onSpaceDblClick={handleSpaceDblClick}
                  />
                )}
              </div>
            </Card>
          </Col>

          {/* 右侧：经营概览 */}
          <Col xs={24} lg={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card 
              title="经营概览" 
              size="small" 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', overflow: 'auto', minHeight: 0 } }}
            >
              {/* 标签页 */}
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Space>
                  <Button type="primary" size="small">图表</Button>
                  <Button size="small">报表</Button>
                </Space>
                <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                  本月：2024-05-01 ~ 2024-05-31
                </span>
              </div>

              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                  {/* 出租率趋势图 */}
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: 12, 
                    padding: 16, 
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                      出租率趋势 <span style={{ color: '#1890ff', marginLeft: 8, fontSize: 12 }}>{(() => {
                        const totalAssetArea = assets.reduce((sum, a) => sum + (a.assetArea || 0), 0);
                        if (totalAssetArea === 0) return '0.0';
                        const totalLeasedArea = leases
                          .filter(l => l.status === 'ACTIVE')
                          .reduce((sum, l) => sum + (l.quantity || 0), 0);
                        return ((totalLeasedArea / totalAssetArea) * 100).toFixed(1);
                      })()}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart
                        data={monthlyTrends.length > 0 ? monthlyTrends : [
                          { month: '2024-01', name: '1月', occupancyRate: 65, revenue: 0, grossMargin: 0 },
                          { month: '2024-02', name: '2月', occupancyRate: 72, revenue: 0, grossMargin: 0 },
                          { month: '2024-03', name: '3月', occupancyRate: 68, revenue: 0, grossMargin: 0 },
                          { month: '2024-04', name: '4月', occupancyRate: 75, revenue: 0, grossMargin: 0 },
                          { month: '2024-05', name: '5月', occupancyRate: 78, revenue: 0, grossMargin: 0 },
                          { month: '2024-06', name: '6月', occupancyRate: 80, revenue: 0, grossMargin: 0 },
                          { month: '2024-07', name: '7月', occupancyRate: 82, revenue: 0, grossMargin: 0 },
                          { month: '2024-08', name: '8月', occupancyRate: 79, revenue: 0, grossMargin: 0 },
                          { month: '2024-09', name: '9月', occupancyRate: 76, revenue: 0, grossMargin: 0 },
                          { month: '2024-10', name: '10月', occupancyRate: 78, revenue: 0, grossMargin: 0 },
                          { month: '2024-11', name: '11月', occupancyRate: 80, revenue: 0, grossMargin: 0 },
                          { month: '2024-12', name: '12月', occupancyRate: 79.6, revenue: 0, grossMargin: 0 },
                        ]}
                        margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} width={35} domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px 12px' }}
                          itemStyle={{ color: '#333', fontSize: 12 }}
                          formatter={(value: any) => [`${(value as number).toFixed(1)}%`, '出租率']}
                        />
                        <Area type="monotone" dataKey="occupancyRate" stroke="#1890ff" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 收入趋势图 */}
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: 12, 
                    padding: 16, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                      收入趋势 <span style={{ color: '#52c41a', marginLeft: 8, fontSize: 12 }}>万元</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart
                        data={monthlyTrends.length > 0 ? monthlyTrends.map(t => ({ name: t.name, 收入: t.revenue / 10000 })) : [
                          { name: '1月', 收入: 80 },
                          { name: '2月', 收入: 95 },
                          { name: '3月', 收入: 88 },
                          { name: '4月', 收入: 100 },
                          { name: '5月', 收入: 110 },
                          { name: '6月', 收入: 115 },
                          { name: '7月', 收入: 120 },
                          { name: '8月', 收入: 118 },
                          { name: '9月', 收入: 125 },
                          { name: '10月', 收入: 130 },
                          { name: '11月', 收入: 128 },
                          { name: '12月', 收入: 132 },
                        ]}
                        margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#52c41a" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} width={35} />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px 12px' }}
                          itemStyle={{ color: '#333', fontSize: 12 }}
                          formatter={(value: any) => [`${(value as number).toFixed(1)}万元`, '收入']}
                        />
                        <Bar dataKey="收入" fill="url(#colorIncome)" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  {/* 资产结构饼图 */}
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: 12, 
                    padding: 16, 
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                      资产结构
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <defs>
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                          </filter>
                          <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7a9ffc"/>
                            <stop offset="100%" stopColor="#597ef7"/>
                          </linearGradient>
                          <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8cd0ff"/>
                            <stop offset="100%" stopColor="#69c0ff"/>
                          </linearGradient>
                          <linearGradient id="color3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#73d13d"/>
                            <stop offset="100%" stopColor="#52c41a"/>
                          </linearGradient>
                          <linearGradient id="color4" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffc069"/>
                            <stop offset="100%" stopColor="#ff9c6e"/>
                          </linearGradient>
                          <linearGradient id="color5" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff85c0"/>
                            <stop offset="100%" stopColor="#eb2f96"/>
                          </linearGradient>
                        </defs>
                        <Pie
                          data={assetTypeBreakdown}
                          cx="50%"
                          cy="45%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          filter="url(#shadow)"
                        >
                          {[
                            { color: 'url(#color1)' },
                            { color: 'url(#color2)' },
                            { color: 'url(#color3)' },
                            { color: 'url(#color4)' },
                            { color: 'url(#color5)' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [Math.round(value as number).toLocaleString() + '㎡', '面积']}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        />
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{ fontSize: '11px', marginTop: '4px', paddingTop: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 毛利率趋势图 */}
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: 12, 
                    padding: 16, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                      毛利率趋势 <span style={{ color: '#faad14', marginLeft: 8, fontSize: 12 }}>{(overview?.revenue.grossMargin || 0).toFixed(1)}%</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <ComposedChart
                        data={monthlyTrends.length > 0 ? monthlyTrends : [
                          { month: '2024-01', name: '1月', occupancyRate: 0, revenue: 0, grossMargin: 65 },
                          { month: '2024-02', name: '2月', occupancyRate: 0, revenue: 0, grossMargin: 68 },
                          { month: '2024-03', name: '3月', occupancyRate: 0, revenue: 0, grossMargin: 66 },
                          { month: '2024-04', name: '4月', occupancyRate: 0, revenue: 0, grossMargin: 70 },
                          { month: '2024-05', name: '5月', occupancyRate: 0, revenue: 0, grossMargin: 72 },
                          { month: '2024-06', name: '6月', occupancyRate: 0, revenue: 0, grossMargin: 75 },
                          { month: '2024-07', name: '7月', occupancyRate: 0, revenue: 0, grossMargin: 76 },
                          { month: '2024-08', name: '8月', occupancyRate: 0, revenue: 0, grossMargin: 78 },
                          { month: '2024-09', name: '9月', occupancyRate: 0, revenue: 0, grossMargin: 77 },
                          { month: '2024-10', name: '10月', occupancyRate: 0, revenue: 0, grossMargin: 79 },
                          { month: '2024-11', name: '11月', occupancyRate: 0, revenue: 0, grossMargin: 80 },
                          { month: '2024-12', name: '12月', occupancyRate: 0, revenue: 0, grossMargin: 81 },
                        ]}
                        margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#faad14" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#faad14" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} width={35} />
                        <Tooltip 
                          formatter={(value: any) => [`${(value as number).toFixed(1)}%`, '毛利率']}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px 12px' }}
                          itemStyle={{ color: '#333', fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="grossMargin" stroke="#faad14" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
              </Row>

              {/* 预警信息 */}
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ border: '1px solid #ffccc7', borderRadius: 12, height: '100%', background: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ff4d4f', marginBottom: 12 }}>
                      资产预警
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Space style={{ width: '100%', background: '#fff1f0', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1890ff', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>空置超30天资产</span>
                        <span style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginLeft: 'auto' }}>{overview?.alerts.vacantOver30Days || 0}个</span>
                      </Space>
                      <Space style={{ width: '100%', background: '#fff7e6', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#fa8c16', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>客户风险预警</span>
                        <span style={{ fontSize: 12, color: '#fa8c16', fontWeight: 600, marginLeft: 'auto' }}>{overview?.alerts.highRiskCustomers || 0}家</span>
                      </Space>
                      <Space style={{ width: '100%', background: '#fff1f0', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#ff4d4f', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>异常资产</span>
                        <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 600, marginLeft: 'auto' }}>0个</span>
                      </Space>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ border: '1px solid #91d5ff', borderRadius: 12, height: '100%', background: '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff', marginBottom: 12 }}>
                      客户预警
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Space style={{ width: '100%', background: '#e6f7ff', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1890ff', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>即将到期客户</span>
                        <span style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginLeft: 'auto' }}>{overview?.leases.expiringLeases || 0}家</span>
                      </Space>
                      <Space style={{ width: '100%', background: '#fffbe6', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#faad14', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>高风险客户</span>
                        <span style={{ fontSize: 12, color: '#faad14', fontWeight: 600, marginLeft: 'auto' }}>{overview?.alerts.highRiskCustomers || 0}家</span>
                      </Space>
                      <Space style={{ width: '100%', background: '#fff7e6', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#fa8c16', borderRadius: '50%' }} />
                        <span style={{ fontSize: 12, color: '#333' }}>租金逾期客户</span>
                        <span style={{ fontSize: 12, color: '#fa8c16', fontWeight: 600, marginLeft: 'auto' }}>{overview?.alerts.overdueRentCustomers || 0}家</span>
                      </Space>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        </>
        )}
      </Content>

      {/* Right Property Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, background: '#1890ff', borderRadius: '50%' }} />
            <span>{getCurrentSpaceData()?.name || '未选择'}</span>
            {getCurrentSpaceData() && (
              <Tag color={getStatusColor(getCurrentSpaceData()?.status)}>
                {getStatusText(getCurrentSpaceData()?.status)}
              </Tag>
            )}
          </div>
        }
        placement="right"
        onClose={() => {
          setIsPropertyPanelOpen(false);
          setIsEditing(false);
          setSelectedSpaceData(null);
          setSpaceProspects([]);
          setSpaceImages([]);
        }}
        open={!!(isPropertyPanelOpen && selectedSpaceId)}
        width={400}
        mask={false}
        maskClosable={false}
        extra={
          !isEditing ? (
            <Button type="primary" icon={<EditOutlined />} onClick={handleStartEdit}>
              编辑
            </Button>
          ) : (
            <Space>
              <Button onClick={handleCancelEdit}>取消</Button>
              <Button type="primary" onClick={() => editForm.submit()}>确认</Button>
            </Space>
          )
        }
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
          <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
            <div style={{ marginBottom: 16 }}>
              {isEditing ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="assetArea" label="资产面积(㎡)" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="type" label="空间类型">
                      <Select options={[
                        { label: '冻库', value: '冻库' },
                        { label: '冷藏库', value: '冷藏库' },
                        { label: '常温库', value: '常温库' },
                        { label: '办公', value: '办公' },
                        { label: '配套', value: '配套' },
                      ]} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : (
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  资产面积: {Math.round(getCurrentSpaceData()?.assetArea || getCurrentSpaceData()?.area || 0)} ㎡ | {getCurrentSpaceData()?.type || '标准仓库'}
                </div>
              )}
            </div>

            {(() => {
              const spaceStatus = getCurrentSpaceData()?.status;
              const isVacant = spaceStatus === 'VACANT' || spaceStatus === 'CONSTRUCTION';
              
              if (!isVacant) {
                return (
                  <>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={12}>
                        <Statistic 
                          title="月租金(含税)" 
                          value={(() => {
                            const spaceId = selectedSpaceId;
                            const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                            if (relatedLeases.length > 0) {
                              let totalMonthlyRent = 0;
                              relatedLeases.forEach(lease => { totalMonthlyRent += (lease.unitPrice || 0) * (lease.quantity || 1); });
                              return totalMonthlyRent;
                            }
                            return getCurrentSpaceData()?.unitPrice ? (getCurrentSpaceData()?.assetArea || getCurrentSpaceData()?.area || 0) * (getCurrentSpaceData()?.unitPrice || 0) : 0;
                          })()} 
                          precision={0} 
                          suffix="元" 
                          valueStyle={{ color: '#1890ff', fontSize: 20 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="月收入" 
                          value={(() => {
                            const spaceId = selectedSpaceId;
                            const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                            if (relatedLeases.length > 0) {
                              let totalMonthlyRevenue = 0;
                              relatedLeases.forEach(lease => {
                                const rent = (lease.unitPrice || 0) * (lease.quantity || 1);
                                const property = (lease.propertyFee || 0) * (lease.quantity || 1);
                                const water = (lease.waterFee || 0) * (lease.quantity || 1);
                                const electric = (lease.electricFee || 0) * (lease.quantity || 1);
                                totalMonthlyRevenue += rent + property + water + electric;
                              });
                              return totalMonthlyRevenue;
                            }
                            return getCurrentSpaceData()?.unitPrice ? (getCurrentSpaceData()?.assetArea || getCurrentSpaceData()?.area || 0) * (getCurrentSpaceData()?.unitPrice || 0) : 0;
                          })()} 
                          precision={0} 
                          suffix="元" 
                          valueStyle={{ color: '#52c41a', fontSize: 20 }}
                        />
                      </Col>
                    </Row>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>租户信息</div>
                      {(() => {
                        const spaceId = selectedSpaceId;
                        const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                        
                        if (relatedLeases.length > 0) {
                          return (
                            <div>
                              {relatedLeases.map((lease, index) => {
                                const customer = customers.find(c => c.id === lease.customerId);
                                const getStatusText = (status: string) => {
                                  const map: Record<string, string> = {
                                    ACTIVE: '租赁中',
                                    EXPIRING: '即将到期',
                                    EXPIRED: '已到期',
                                    OVERDUE: '逾期',
                                  };
                                  return map[status] || status;
                                };
                                const getStatusColor = (status: string) => {
                                  const map: Record<string, string> = {
                                    ACTIVE: '#52c41a',
                                    EXPIRING: '#faad14',
                                    EXPIRED: '#ff4d4f',
                                    OVERDUE: '#ff4d4f',
                                  };
                                  return map[status] || '#999';
                                };
                                return (
                                  <div key={lease.id} style={{ marginBottom: index < relatedLeases.length - 1 ? 16 : 0, paddingBottom: index < relatedLeases.length - 1 ? 16 : 0, borderBottom: index < relatedLeases.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                    <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>租户信息{index + 1}</span>
                                      <span style={{ color: getStatusColor(lease.status), fontWeight: 600 }}>{getStatusText(lease.status)}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>客户名称：</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer?.name || '-'}</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>所属行业：</span><span>{customer?.industry || '-'}</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>租期：</span><span>{formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>已租面积：</span><span>{Math.round(lease.quantity)} ㎡</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>月租金：</span><span>¥{((lease.unitPrice || 0) * (lease.quantity || 1)).toLocaleString()}</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>合同编号：</span><span>{lease.id}</span></div>
                                      <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>联系电话：</span><span>{customer?.phone || '-'}</span></div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>以上信息由客户经营自动同步，不可在此处修改</div>
                            </div>
                          );
                        }
                        
                        return (
                          <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                            <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>客户名称：</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getCurrentSpaceData()?.customer || '-'}</span></div>
                            <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>所属行业：</span><span>{getCurrentSpaceData()?.industry || '-'}</span></div>
                            <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>租期：</span><span>{getCurrentSpaceData()?.startDate && getCurrentSpaceData()?.endDate ? `${getCurrentSpaceData()?.startDate} ~ ${getCurrentSpaceData()?.endDate}` : '-'}</span></div>
                            <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>合同编号：</span><span>{getCurrentSpaceData()?.contractNo || '-'}</span></div>
                            <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>联系电话：</span><span>{getCurrentSpaceData()?.phone || '-'}</span></div>
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>经营趋势</div>
                      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={(() => {
                              const spaceId = selectedSpaceId;
                              const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                              const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                              return months.map((month) => {
                                let income = 0;
                                relatedLeases.forEach(lease => {
                                  if (lease.monthlyEstimate) { income += lease.monthlyEstimate * (0.9 + (Math.random() * 0.2)); }
                                });
                                if (relatedLeases.length === 0) { income = Math.floor(Math.random() * 50000) + 20000; }
                                return { name: month, 收入: Math.floor(income / 10000 * 100) / 100 };
                              });
                            })()}
                            margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorSpaceIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#52c41a" stopOpacity={0.4}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} width={35} />
                            <Tooltip 
                              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '8px 12px' }}
                              itemStyle={{ color: '#333', fontSize: 12 }}
                              formatter={(value: any) => [`${value as number}万元`, '收入']}
                            />
                            <Bar dataKey="收入" fill="url(#colorSpaceIncome)" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 8 }}>收入数据由客户经营的租赁信息自动同步</div>
                      </div>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>意向潜客 ({spaceProspects.length})</div>
                      {spaceProspects.length === 0 ? (
                        <Empty description="暂无意向潜客" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <Collapse>
                          {spaceProspects.map((prospect) => (
                            <Panel
                              header={
                                <Space>
                                  <Tag color="orange">潜客</Tag>
                                  <strong>{prospect.name}</strong>
                                  {prospect.industry && <Tag>{prospect.industry}</Tag>}
                                </Space>
                              }
                              key={prospect.id}
                            >
                              <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                                <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>联系人：</span><span>{prospect.contact || '-'}</span></div>
                                <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>联系电话：</span><span>{prospect.phone || '-'}</span></div>
                                <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>邮箱：</span><span>{prospect.email || '-'}</span></div>
                                <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>租赁模式：</span><span>{prospect.intendedLeaseMode || '-'}</span></div>
                                <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>意向数量：</span><span>{prospect.intendedQuantity != null ? `${prospect.intendedQuantity} ${prospect.intendedLeaseMode === '按板数' ? '板' : '㎡'}` : '-'}</span></div>
                              </div>
                              <Divider style={{ margin: '12px 0' }} />
                              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>跟进记录</div>
                              {prospect.followUps && prospect.followUps.length > 0 ? (
                                <Timeline
                                  items={prospect.followUps.map((fu: any) => ({
                                    color: 'blue',
                                    children: (
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                          <Space size={4}><UserOutlined /><span>{fu.createdBy}</span></Space>
                                          <Space size={4}><ClockCircleOutlined /><span>{new Date(fu.followUpDate).toLocaleString()}</span></Space>
                                        </div>
                                        <div style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{fu.content}</div>
                                        {fu.result && <div style={{ marginTop: 4, color: '#52c41a' }}>结果: {fu.result}</div>}
                                      </div>
                                    ),
                                  }))}
                                />
                              ) : (
                                <Empty description="暂无跟进记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                              )}
                            </Panel>
                          ))}
                        </Collapse>
                      )}
                    </div>
                  </>
                );
              }
            })()}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>空间属性</div>
              {isEditing ? (
                <div>
                  <Form.Item name="code" label="空间编号"><Input placeholder="系统自动生成" disabled /></Form.Item>
                  <Form.Item name="name" label="空间名称" rules={[{ required: true, message: '请输入空间名称' }]}><Input placeholder="请输入空间名称" /></Form.Item>
                  <Form.Item name="status" label="空间状态">
                    <Select options={[
                      { label: '空置', value: 'VACANT' },
                      { label: '已出租', value: 'RENTED' },
                      { label: '即将到期', value: 'EXPIRING' },
                      { label: '异常', value: 'RISK' },
                      { label: '建设中', value: 'CONSTRUCTION' },
                    ]} />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={8}><Form.Item name="floorHeight" label="层高(m)"><InputNumber style={{ width: '100%' }} min={0} step={0.1} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="loadCapacity" label="承重(t/㎡)"><InputNumber style={{ width: '100%' }} min={0} step={0.1} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="passage" label="通道">
                      <Select options={[{ label: '贯通', value: '贯通' }, { label: '单侧', value: '单侧' }, { label: '双侧', value: '双侧' }]} />
                    </Form.Item></Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="sliceX" label="画板 X 坐标"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    <Col span={12}><Form.Item name="sliceY" label="画板 Y 坐标"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="sliceWidth" label="画板宽度"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                    <Col span={12}><Form.Item name="sliceHeight" label="画板高度"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}><Form.Item name="graphicArea" label="图形面积(㎡)"><InputNumber style={{ width: '100%' }} min={0} precision={1} disabled /></Form.Item></Col>
                  </Row>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>空间编号：</span><span>{getCurrentSpaceData()?.code}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>空间名称：</span><span>{getCurrentSpaceData()?.name}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>空间状态：</span><span>{getStatusText(getCurrentSpaceData()?.status)}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>空间类型：</span><span>{getCurrentSpaceData()?.type || '-'}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>层高：</span><span>{getCurrentSpaceData()?.floorHeight ? `${getCurrentSpaceData()?.floorHeight} m` : '-'}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>承重：</span><span>{getCurrentSpaceData()?.loadCapacity ? `${getCurrentSpaceData()?.loadCapacity} t/㎡` : '-'}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>通道：</span><span>{getCurrentSpaceData()?.passage || '-'}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>画板坐标：</span><span>X: {getCurrentSpaceData()?.sliceX || 0}, Y: {getCurrentSpaceData()?.sliceY || 0}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>画板尺寸：</span><span>{getCurrentSpaceData()?.sliceWidth || 0} × {getCurrentSpaceData()?.sliceHeight || 0}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: 80, flexShrink: 0 }}>图形面积：</span><span>{Math.round(getCurrentSpaceData()?.graphicArea || getCurrentSpaceData()?.area || 0)} ㎡</span></div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>空间图片</div>
              <Spin spinning={imagesLoading}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {spaceImages.map((imgUrl, index) => (
                    <div key={index} style={{ aspectRatio: '1', background: '#f0f0f0', borderRadius: 8, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'transparent', cursor: 'pointer' }} onClick={() => { Modal.info({ content: <img src={imgUrl} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />, width: 800, maskClosable: true }); }} />
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14, zIndex: 1 }} onClick={(e) => { e.stopPropagation(); handleDeleteImage(imgUrl); }}>×</div>
                    </div>
                  ))}
                  <Upload accept="image/*" showUploadList={false} customRequest={({ file }) => handleUploadImage(file as File)}>
                    <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d0d5dd', cursor: 'pointer' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}><PlusOutlined style={{ fontSize: 16, color: '#1890ff' }} /></div>
                      <span style={{ color: '#666', fontSize: 11, fontWeight: 500 }}>添加图片</span>
                    </div>
                  </Upload>
                </div>
              </Spin>
            </div>
          </Form>
        </div>
      </Drawer>
    </Layout>
  );
};

export default Dashboard;
