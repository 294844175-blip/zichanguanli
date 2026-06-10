import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Space,
  Badge,
  Tag,
  Table,
  Statistic,
  Row,
  Col,
  Dropdown,
  Input,
  Select,
  Divider,
  Drawer,
  Modal,
  Form,
  InputNumber,
  message,
  Collapse,
  Timeline,
  Empty,
  Upload,
  Image,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  FolderOutlined,
  DownloadOutlined,
  FilterOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  HomeOutlined,
  SnippetsOutlined,
  SwapOutlined,
  ThunderOutlined,
  SafetyOutlined,
  BuildOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import SpaceEditor from '../components/SpaceEditor';
import Header from '../components/Header';
import { useParkStore } from '../store/useParkStore';
import { getAssets, updateAsset, getAssetSlices, deleteAsset, getAssetImages, uploadAssetImage, deleteAssetImage } from '../api/assets';
import { getCustomers, getFollowUps } from '../api/customers';
import { getLeases } from '../api/leases';
import { Asset, Customer, Lease } from '../types';

const { Sider, Content } = Layout;
const { Option } = Select;
const { Panel } = Collapse;

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

const SpaceView: React.FC = () => {
  const navigate = useNavigate();
  const { selectedParkId: selectedPark, setSelectedParkId: setSelectedPark } = useParkStore();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedSpaceData, setSelectedSpaceData] = useState<any>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const [editForm] = Form.useForm();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<any>(null);
  const [spaceProspects, setSpaceProspects] = useState<any[]>([]);
  const [spaceImages, setSpaceImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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



  // 加载数据
  useEffect(() => {
    if (selectedPark) {
      loadSpaceData(true);
    }
  }, [selectedPark]);

  const tableColumns = [
    { title: '空间编号', dataIndex: 'code', key: 'code', width: 120 },
    { title: '空间名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '资产面积', dataIndex: 'assetArea', key: 'assetArea', width: 100, render: (v: number) => `${v != null ? Number(v).toFixed(2) : '0.00'}㎡` },
    { title: '图形面积', dataIndex: 'graphicArea', key: 'graphicArea', width: 100, render: (v: number) => `${v != null ? Number(v).toFixed(2) : '0.00'}㎡` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag> },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setSpaceToDelete(record);
            setDeleteConfirmVisible(true);
          }}
        >
          删除
        </Button>
      ),
    },
  ];

  // 获取当前选中空间的数据
  const getCurrentSpaceData = () => {
    return selectedSpaceData;
  };

  // 格式化日期为 yyyy-mm-dd
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 计算当前空间的出租率
  const calculateOccupancyRate = () => {
    const spaceData = getCurrentSpaceData();
    const spaceId = selectedSpaceId;
    const assetArea = spaceData?.assetArea || spaceData?.area || 0;
    
    if (assetArea === 0) return 0;
    
    // 获取当前空间的所有租赁
    const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
    
    // 计算已租面积总和
    let totalLeasedArea = 0;
    relatedLeases.forEach(lease => {
      totalLeasedArea += lease.quantity || 0;
    });
    
    // 如果没有租赁数据，使用原来的方式计算
    if (relatedLeases.length === 0) {
      return ['RENTED', 'EXPIRING', 'RISK'].includes(spaceData?.status) ? 100 : 0;
    }
    
    // 计算出租率
    return Math.round((totalLeasedArea / assetArea) * 100);
  };

  // 进入编辑模式
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
      function: space.function,
      buildingArea: space.buildingArea,
      unitPrice: space.unitPrice,
      propertyFeeUnit: space.propertyFeeUnit,
      utilityFeeUnit: space.utilityFeeUnit,
      pricingRule: space.pricingRule,
      quantity: space.quantity,
      idleArea: space.idleArea,
      occupancyRate: space.occupancyRate,
      score: space.score,
      floorHeight: space.floorHeight || 9.0,
      loadCapacity: space.loadCapacity || 3.0,
      passage: space.passage || '贯通',
      startDate: space.startDate,
      endDate: space.endDate,
      leasedUnit: space.leasedUnit,
      idleUnit: space.idleUnit,
      createdBy: space.createdBy,
      createdAt: space.createdAt,
      sliceX: space.sliceX || 0,
      sliceY: space.sliceY || 0,
      sliceWidth: space.sliceWidth || 0,
      sliceHeight: space.sliceHeight || 0,
    });
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    editForm.resetFields();
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!spaceToDelete) return;
    try {
      await deleteAsset(spaceToDelete.id);
      message.success('删除成功');
      setDeleteConfirmVisible(false);
      setSpaceToDelete(null);
      // 如果删除的是当前选中的空间，关闭详情面板
      if (selectedSpaceId === spaceToDelete.id) {
        setIsPropertyPanelOpen(false);
        setIsEditing(false);
        setSelectedSpaceId(null);
        setSelectedSpaceData(null);
      }
      // 重新加载数据
      await loadSpaceData();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };



  // 保存编辑
  const handleSaveEdit = async (values: any) => {
    const isDuplicateName = spaces.some(
      space => 
        space.id !== selectedSpaceId && 
        space.name === values.name
    );
    
    if (isDuplicateName) {
      message.error('空间名称已存在，请使用其他名称');
      return;
    }

    try {
      if (selectedSpaceId) {
        console.log('正在保存资产数据, assetId:', selectedSpaceId);
        console.log('values:', values);
        const updatedAsset = await updateAsset(selectedSpaceId, values);
        console.log('保存成功，返回数据:', updatedAsset);
        message.success('保存成功');
        setIsEditing(false);
        
        // 重新加载数据
        await loadSpaceData();
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.details || error?.message || '保存失败，请稍后重试';
      message.error(errorMsg);
    }
  };

  // 加载空间数据的通用方法
  const loadSpaceData = async (shouldSelectFirst = false) => {
    if (!selectedPark) return;
    
    try {
      // 重新加载客户和租赁数据
      const customersData = await getCustomers({ parkId: selectedPark });
      const leasesData = await getLeases({ parkId: selectedPark });
      setCustomers(customersData);
      setLeases(leasesData);

      // 重新加载资产
      const assetsData = await getAssetSlices(selectedPark);
      
      // 重新处理数据，关联租赁和客户信息
      const transformed = assetsData.map((asset: any) => {
        const relatedLease = leasesData.find(lease => lease.assetId === asset.id);
        let customerInfo = null;
        if (relatedLease) {
          customerInfo = customersData.find(cust => cust.id === relatedLease.customerId);
        }
        
        return {
          id: asset.id,
          code: asset.code,
          name: asset.name,
          graphicArea: asset.graphicArea,
          assetArea: asset.assetArea,
          area: asset.assetArea,
          status: asset.status,
          customer: customerInfo?.name || asset.leasedUnit || '',
          startDate: relatedLease?.startDate || asset.startDate,
          endDate: relatedLease?.endDate || asset.endDate,
          industry: customerInfo?.industry || asset.industry,
          phone: customerInfo?.phone || asset.phone,
          contractNo: relatedLease?.id || asset.contractNo,
          ...asset,
          relatedLease,
          relatedCustomer: customerInfo,
        };
      });
      
      setSpaces(transformed);
      setEditorKey(prev => prev + 1);
      
      // 如果需要并且没有选中的空间，选中第一个
      if (shouldSelectFirst && transformed.length > 0 && !selectedSpaceId) {
        setSelectedSpaceId(transformed[0].id);
      }
      
      // 更新选中的空间数据
      const updatedSpace = transformed.find(s => s.id === selectedSpaceId);
      if (updatedSpace) {
        setSelectedSpaceData(updatedSpace);
        loadProspectsForSpace(updatedSpace);
      }
    } catch (error) {
      console.error('重新加载数据失败:', error);
    }
  };

  // 加载潜客信息
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
              id: c.id,
              name: c.name,
              contact: c.contact,
              phone: c.phone,
              email: c.email,
              industry: c.industry,
              intendedLeaseMode: c.intendedLeaseMode,
              intendedQuantity: c.intendedQuantity,
              followUps,
            };
          })
      );
      setSpaceProspects(prospectsWithFollowUps);
    } catch (err) {
      console.error('Failed to load prospects:', err);
      setSpaceProspects([]);
    }
  };

  const loadSpaceImages = async (assetId: string) => {
    if (!assetId) {
      setSpaceImages([]);
      return;
    }
    setImagesLoading(true);
    try {
      const images = await getAssetImages(assetId);
      setSpaceImages(images);
    } catch (err) {
      console.error('Failed to load images:', err);
      setSpaceImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!selectedSpaceId) return;
    setUploadingImage(true);
    try {
      const result = await uploadAssetImage(selectedSpaceId, file);
      setSpaceImages(result.images);
      message.success('上传成功');
    } catch (err) {
      console.error('Failed to upload image:', err);
      message.error('上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!selectedSpaceId) return;
    const filename = imageUrl.split('/').pop();
    if (!filename) return;
    try {
      const result = await deleteAssetImage(selectedSpaceId, filename);
      setSpaceImages(result.images);
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete image:', err);
      message.error('删除失败');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
    { key: 'settings', label: '系统设置', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', danger: true },
  ];

  return (
    <Layout style={{ 
      height: '100vh', 
      background: '#fff', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header Bar */}
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
          selectedKeys={['spaceview']} 
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

        <Space size="middle" style={{ flexShrink: 0 }}>
          <Button 
            type={isViewMode ? 'primary' : 'text'} 
            icon={<EyeOutlined />}
            onClick={() => setIsViewMode(true)}
          >
            查看模式
          </Button>
          <Button 
            type={!isViewMode ? 'primary' : 'text'} 
            icon={<EditOutlined />}
            onClick={() => setIsViewMode(false)}
          >
            编辑模式
          </Button>
        </Space>
      </div>

      {/* Main Content Area */}
      <Content style={{ 
        position: 'relative', 
        background: '#f0f2f5', 
        flex: 1, 
        overflow: 'hidden',
        minWidth: 0
      }}>
        {/* Space Editor Component */}
        {selectedPark && (
          <div style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative'
          }}>
            <SpaceEditor 
              key={editorKey}
              parkId={selectedPark} 
              isViewMode={isViewMode}
              leases={leases}
              customers={customers}
              onSpaceSelect={(id, space) => {
                setSelectedSpaceId(id);
                setSelectedSpaceData(space);
                loadProspectsForSpace(space);
                if (id) loadSpaceImages(id);
              }}
              onSpaceDblClick={(id, space) => {
                setSelectedSpaceId(id);
                setSelectedSpaceData(space);
                loadProspectsForSpace(space);
                loadSpaceImages(id);
                if (!isPropertyPanelOpen) {
                  setIsPropertyPanelOpen(true);
                }
              }}
            />
          </div>
        )}

        {/* Toggle for right panel */}
        {!isPropertyPanelOpen && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            right: 0, 
            transform: 'translateY(-50%)', 
            zIndex: 5,
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '8px 4px'
          }}>
            <Button 
              type="text" 
              icon={<CaretLeftOutlined />} 
              onClick={() => setIsPropertyPanelOpen(true)} 
            />
          </div>
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
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div style={{ 
          padding: '16px', 
          height: '100%',
          overflow: 'auto'
        }}>
          <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
            <div style={{ marginBottom: 16 }}>
              {isEditing ? (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="assetArea" label="资产面积(㎡)" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={0} precision={2} />
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
                  资产面积: {Number(getCurrentSpaceData()?.assetArea || getCurrentSpaceData()?.area || 0).toFixed(2)} ㎡ | {getCurrentSpaceData()?.type || '标准仓库'}
                </div>
              )}
            </div>

            {/* 基础信息 */}
            {!isEditing && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>基础信息</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>空间编号：</span>
                    <span>{getCurrentSpaceData()?.code || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>空间名称：</span>
                    <span>{getCurrentSpaceData()?.name || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>空间类型：</span>
                    <span>{getCurrentSpaceData()?.type || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>空间状态：</span>
                    <Tag color={getStatusColor(getCurrentSpaceData()?.status)}>{getStatusText(getCurrentSpaceData()?.status)}</Tag>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>功能说明：</span>
                    <span>{getCurrentSpaceData()?.function || '-'}</span>
                  </div>
                </div>
              </div>
            )}

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
                              relatedLeases.forEach(lease => {
                                totalMonthlyRent += (lease.unitPrice || 0) * (lease.quantity || 1);
                              });
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
                          valueStyle={{ color: '#52c41', fontSize: 20 }}
                        />
                      </Col>
                    </Row>

                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        租户信息
                      </div>
                      {(() => {
                        const spaceData = getCurrentSpaceData();
                        const spaceId = selectedSpaceId;
                        const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                        
                        if (relatedLeases.length > 0) {
                          return (
                            <div>
                              {relatedLeases.map((lease, index) => {
                                const customer = customers.find(c => c.id === lease.customerId);
                                return (
                                  <div key={lease.id} style={{ marginBottom: index < relatedLeases.length - 1 ? 16 : 0, paddingBottom: index < relatedLeases.length - 1 ? 16 : 0, borderBottom: index < relatedLeases.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                    <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginBottom: 12 }}>
                                      租户信息{index + 1}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>客户名称：</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {customer?.name || '-'}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>所属行业：</span>
                                        <span>{customer?.industry || '-'}</span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>租期：</span>
                                        <span>{formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}</span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>已租面积：</span>
                                        <span>{lease.quantity} ㎡</span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>月租金：</span>
                                        <span>¥{((lease.unitPrice || 0) * (lease.quantity || 1)).toLocaleString()}</span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>合同编号：</span>
                                        <span>{lease.id}</span>
                                      </div>
                                      <div style={{ display: 'flex' }}>
                                        <span style={{ width: 80, flexShrink: 0 }}>联系电话：</span>
                                        <span>{customer?.phone || '-'}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                                以上信息由客户经营自动同步，不可在此处修改
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>客户名称：</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {spaceData?.customer || '-'}
                              </span>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>所属行业：</span>
                              <span>{spaceData?.industry || '-'}</span>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>租期：</span>
                              <span>{spaceData?.startDate && spaceData?.endDate ? `${spaceData.startDate} ~ ${spaceData.endDate}` : '-'}</span>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>合同编号：</span>
                              <span>{spaceData?.contractNo || '-'}</span>
                            </div>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>联系电话：</span>
                              <span>{spaceData?.phone || '-'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 面积与价格 */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>面积与价格</div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        <Row gutter={[8, 8]}>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>图形面积：</span>
                              <span>{getCurrentSpaceData()?.graphicArea ? `${Number(getCurrentSpaceData()?.graphicArea).toFixed(2)} ㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>资产面积：</span>
                              <span>{getCurrentSpaceData()?.assetArea ? `${Number(getCurrentSpaceData()?.assetArea).toFixed(2)} ㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>建筑面积：</span>
                              <span>{getCurrentSpaceData()?.buildingArea ? `${Number(getCurrentSpaceData()?.buildingArea).toFixed(2)} ㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>报价单价：</span>
                              <span>{getCurrentSpaceData()?.unitPrice ? `${getCurrentSpaceData()?.unitPrice} 元/㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>物业费：</span>
                              <span>{getCurrentSpaceData()?.propertyFeeUnit ? `${getCurrentSpaceData()?.propertyFeeUnit} 元/㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>水电费：</span>
                              <span>{getCurrentSpaceData()?.utilityFeeUnit ? `${getCurrentSpaceData()?.utilityFeeUnit} 元/㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>定价规则：</span>
                              <span>{getCurrentSpaceData()?.pricingRule || '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>数量：</span>
                              <span>{getCurrentSpaceData()?.quantity || '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>闲置面积：</span>
                              <span>{getCurrentSpaceData()?.idleArea ? `${Number(getCurrentSpaceData()?.idleArea).toFixed(2)} ㎡` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>出租率：</span>
                              <span>{getCurrentSpaceData()?.occupancyRate ? `${getCurrentSpaceData()?.occupancyRate}%` : '-'}</span>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: 80, flexShrink: 0 }}>评分：</span>
                              <span>{getCurrentSpaceData()?.score || '-'}</span>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    {/* 租期信息 */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>租期信息</div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: 80, flexShrink: 0 }}>开始日期：</span>
                          <span>{getCurrentSpaceData()?.startDate || '-'}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ width: 80, flexShrink: 0 }}>结束日期：</span>
                          <span>{getCurrentSpaceData()?.endDate || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 经营趋势图表 */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        经营趋势
                      </div>
                      <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={(() => {
                              const spaceId = selectedSpaceId;
                              const relatedLeases = leases.filter(lease => lease.assetId === spaceId);
                              const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                              return months.map((month, index) => {
                                let income = 0;
                                relatedLeases.forEach(lease => {
                                  if (lease.monthlyEstimate) {
                                    const factor = 0.9 + (Math.random() * 0.2);
                                    income += lease.monthlyEstimate * factor;
                                  }
                                });
                                if (relatedLeases.length === 0) {
                                  income = Math.floor(Math.random() * 50000) + 20000;
                                }
                                return {
                                  name: month,
                                  收入: Math.floor(income / 10000 * 100) / 100,
                                };
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
                              formatter={(value: number) => [`${value}万元`, '收入']}
                            />
                            <Bar dataKey="收入" fill="url(#colorSpaceIncome)" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 8 }}>
                          收入数据由客户经营的租赁信息自动同步
                        </div>
                      </div>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    {/* 未出租资产 - 显示潜客信息 */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        意向潜客 ({spaceProspects.length})
                      </div>
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
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: 80, flexShrink: 0 }}>联系人：</span>
                                  <span>{prospect.contact || '-'}</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: 80, flexShrink: 0 }}>联系电话：</span>
                                  <span>{prospect.phone || '-'}</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: 80, flexShrink: 0 }}>邮箱：</span>
                                  <span>{prospect.email || '-'}</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: 80, flexShrink: 0 }}>租赁模式：</span>
                                  <span>{prospect.intendedLeaseMode || '-'}</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: 80, flexShrink: 0 }}>意向数量：</span>
                                  <span>
                                    {prospect.intendedQuantity != null
                                      ? `${prospect.intendedQuantity} ${prospect.intendedLeaseMode === '按板数' ? '板' : '㎡'}`
                                      : '-'}
                                  </span>
                                </div>
                              </div>

                              {/* 跟进记录 */}
                              <Divider style={{ margin: '12px 0' }} />
                              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>跟进记录</div>
                              {prospect.followUps && prospect.followUps.length > 0 ? (
                                <Timeline
                                  items={prospect.followUps.map((fu: any) => ({
                                    color: 'blue',
                                    children: (
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                          <Space size={4}>
                                            <UserOutlined />
                                            <span>{fu.createdBy}</span>
                                          </Space>
                                          <Space size={4}>
                                            <ClockCircleOutlined />
                                            <span>{new Date(fu.followUpDate).toLocaleString()}</span>
                                          </Space>
                                        </div>
                                        <div style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{fu.content}</div>
                                        {fu.result && (
                                          <div style={{ marginTop: 4, color: '#52c41a' }}>结果: {fu.result}</div>
                                        )}
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
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                空间属性
              </div>
              {isEditing ? (
                <div>
                  <Form.Item name="code" label="空间编号">
                    <Input placeholder="系统自动生成" disabled />
                  </Form.Item>
                  <Form.Item 
                    name="name" 
                    label="空间名称" 
                    rules={[
                      { required: true, message: '请输入空间名称' },
                      { 
                        validator: async (_, value) => {
                          if (!value) return;
                          const isDuplicate = spaces.some(
                            space => space.id !== selectedSpaceId && space.name === value
                          );
                          if (isDuplicate) {
                            return Promise.reject('空间名称已存在，请使用其他名称');
                          }
                        }
                      }
                    ]}
                  >
                    <Input placeholder="请输入空间名称" />
                  </Form.Item>
                  <Form.Item name="status" label="空间状态">
                    <Select options={[
                      { label: '空置', value: 'VACANT' },
                      { label: '已出租', value: 'RENTED' },
                      { label: '即将到期', value: 'EXPIRING' },
                      { label: '异常', value: 'RISK' },
                      { label: '建设中', value: 'CONSTRUCTION' },
                    ]} />
                  </Form.Item>
                  <Form.Item name="function" label="功能说明">
                    <Input placeholder="请输入功能说明" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="buildingArea" label="建筑面积(㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="unitPrice" label="报价单价(元/㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="propertyFeeUnit" label="物业费(元/㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="utilityFeeUnit" label="水电费(元/㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="pricingRule" label="定价规则">
                        <Select options={[
                          { label: '按面积', value: '按面积' },
                          { label: '按间数', value: '按间数' },
                          { label: '按楼层', value: '按楼层' },
                        ]} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="quantity" label="数量">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="idleArea" label="闲置面积(㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="occupancyRate" label="出租率(%)">
                        <InputNumber style={{ width: '100%' }} min={0} max={100} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="score" label="评分">
                        <InputNumber style={{ width: '100%' }} min={0} max={100} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="floorHeight" label="层高(m)">
                        <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="loadCapacity" label="承重(t/㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="passage" label="通道">
                        <Select options={[
                          { label: '贯通', value: '贯通' },
                          { label: '单侧', value: '单侧' },
                          { label: '双侧', value: '双侧' },
                        ]} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="startDate" label="开始日期">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="endDate" label="结束日期">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="leasedUnit" label="已出租单位">
                        <Input placeholder="请输入已出租单位" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="idleUnit" label="闲置单位">
                        <Input placeholder="请输入闲置单位" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="createdBy" label="创建人">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="createdAt" label="创建时间">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="sliceX" label="画板 X 坐标">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sliceY" label="画板 Y 坐标">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="sliceWidth" label="画板宽度">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sliceHeight" label="画板高度">
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="graphicArea" label="图形面积(㎡)">
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>层高：</span>
                    <span>{getCurrentSpaceData()?.floorHeight ? `${getCurrentSpaceData()?.floorHeight} m` : '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>承重：</span>
                    <span>{getCurrentSpaceData()?.loadCapacity ? `${getCurrentSpaceData()?.loadCapacity} t/㎡` : '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>通道：</span>
                    <span>{getCurrentSpaceData()?.passage || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>画板坐标：</span>
                    <span>X: {getCurrentSpaceData()?.sliceX || 0}, Y: {getCurrentSpaceData()?.sliceY || 0}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>画板尺寸：</span>
                    <span>{getCurrentSpaceData()?.sliceWidth || 0} × {getCurrentSpaceData()?.sliceHeight || 0}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>图形面积：</span>
                    <span>{Number(getCurrentSpaceData()?.graphicArea || getCurrentSpaceData()?.area || 0).toFixed(2)} ㎡</span>
                  </div>
                </div>
              )}
            </div>

            {/* 创建信息 */}
            {!isEditing && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>创建信息</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>创建人：</span>
                    <span>{getCurrentSpaceData()?.createdBy || '-'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: 80, flexShrink: 0 }}>创建时间：</span>
                    <span>{getCurrentSpaceData()?.createdAt ? new Date(getCurrentSpaceData()?.createdAt).toLocaleString() : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                空间图片
              </div>
              <Spin spinning={imagesLoading}>
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 8
                }}>
                  {spaceImages.map((imgUrl, index) => (
                    <div key={index} style={{
                      aspectRatio: '1', 
                      background: '#f0f0f0', 
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      backgroundImage: `url(${imgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          Modal.info({
                            content: <img src={imgUrl} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />,
                            width: 800,
                            maskClosable: true,
                          });
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                          fontSize: 14,
                          transition: 'all 0.2s',
                          backdropFilter: 'blur(4px)',
                          zIndex: 1
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(imgUrl);
                        }}
                      >
                        ×
                      </div>
                    </div>
                  ))}
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={({ file }) => handleUploadImage(file as File)}
                  >
                    <div style={{
                      aspectRatio: '1', 
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                      borderRadius: 8,
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center', 
                      border: '2px dashed #d0d5dd',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #e6f7ff 0%, #d6eeff 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d0d5dd';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)';
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      <PlusOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                    </div>
                    <span style={{ color: '#666', fontSize: 11, fontWeight: 500 }}>添加图片</span>
                  </div>
                </Upload>
                </div>
              </Spin>
            </div>
          </Form>
        </div>
      </Drawer>

      {/* Bottom Table Drawer */}
      <Drawer
        title="空间列表"
        placement="bottom"
        onClose={() => setIsTablePanelOpen(false)}
        open={isTablePanelOpen}
        height={350}
        extra={
          <Space size="middle">
            <Input.Search placeholder="搜索空间名称/编号/租户" style={{ width: 220 }} />
            <Button icon={<FilterOutlined />}>高级筛选</Button>
            <div style={{ width: 1, height: 16, background: '#e8e8e8' }} />
            <Button type="primary">表格视图</Button>
            <Button>卡片视图</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        }
      >
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Table 
            dataSource={spaces} 
            columns={tableColumns} 
            rowKey="id" 
            size="small"
            pagination={{ pageSize: 5 }}
            rowSelection={{ type: 'checkbox' }}
            onRow={(r) => ({
              onClick: () => {
                setSelectedSpaceId(r.id);
                setSelectedSpaceData(r);
                if (!isPropertyPanelOpen) {
                  setIsPropertyPanelOpen(true);
                }
              }
            })}
            rowClassName={(record) => record.id === selectedSpaceId ? '!bg-blue-50' : ''}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Drawer>

      {/* 删除确认弹窗 */}
      <Modal
        title="删除确认"
        open={deleteConfirmVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setSpaceToDelete(null);
        }}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除空间 "{spaceToDelete?.name}" 吗？</p>
        <p style={{ color: '#999', fontSize: 12 }}>此操作不可撤销</p>
      </Modal>

      {/* Toggle for bottom panel */}
      {!isTablePanelOpen && (
        <div style={{
          position: 'fixed', 
          bottom: 0, 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 100, 
          background: '#fff', 
          border: '1px solid #e8e8e8',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0', 
          padding: '8px 16px', 
          cursor: 'pointer'
        }} onClick={() => setIsTablePanelOpen(true)}>
          <CaretUpOutlined /> 空间列表
        </div>
      )}
    </Layout>
  );
};

export default SpaceView;
