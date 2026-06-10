import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Select,
  Form,
  Input,
  InputNumber,
  Card,
  Row,
  Col,
  Divider,
  Badge,
  Dropdown,
  Spin,
  Descriptions,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  HomeOutlined,
  SnippetsOutlined,
  BuildOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  MoreOutlined,
  EyeOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { getAssets, deleteAsset, createAsset, updateAsset, exportAssets, getAssetImages, uploadAssetImage, deleteAssetImage } from '../api/assets';
import { ListToolbar } from '../components/ListToolbar';
import { getParkById, updatePark } from '../api/parks';
import { getCustomers, getFollowUps } from '../api/customers';
import { getLeases } from '../api/leases';
import { useParkStore } from '../store/useParkStore';
import Header from '../components/Header';
import { Asset, Park, Customer, Lease } from '../types';
import SpaceDetailModal from '../components/SpaceDetailModal';

const { Content } = Layout;

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  VACANT: { color: 'default', text: '闲置' },
  RENTED: { color: 'blue', text: '已出租' },
  EXPIRING: { color: 'orange', text: '即将到期' },
  RISK: { color: 'red', text: '异常' },
  CONSTRUCTION: { color: 'default', text: '建设中' },
};

const userMenuItems = [
  { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
  { key: 'settings', label: '系统设置', icon: <SettingOutlined /> },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
];

const AssetManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const { selectedParkId: selectedPark, parks } = useParkStore();
  const [selectedParkInfo, setSelectedParkInfo] = useState<Park | null>(null);
  const [parkLoading, setParkLoading] = useState(false);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [parkEditModalOpen, setParkEditModalOpen] = useState(false);
  const [assetForm] = Form.useForm();
  const [parkForm] = Form.useForm();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [spaceProspects, setSpaceProspects] = useState<any[]>([]);
  const [spaceImages, setSpaceImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

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

  useEffect(() => {
    if (parks.length > 0 && selectedPark) {
      loadParkInfo(selectedPark);
    }
  }, [parks, selectedPark]);

  useEffect(() => {
    fetchAssets();
  }, [page, pageSize, selectedPark, searchKeyword]);

  const loadParkInfo = async (parkId: string) => {
    setParkLoading(true);
    try {
      const park = await getParkById(parkId);
      setSelectedParkInfo(park);
      const leaseData = await getLeases({ parkId });
      setLeases(leaseData);
    } catch (err) {
      console.error('Failed to load park info:', err);
      message.error('加载园区信息失败');
    } finally {
      setParkLoading(false);
    }
  };

  const handleParkUpdate = async (values: any) => {
    if (!selectedParkInfo) return;
    try {
      const updated = await updatePark(selectedParkInfo.id, values);
      setSelectedParkInfo(updated);
      message.success('园区信息更新成功');
      setParkEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update park:', err);
      message.error('园区信息更新失败');
    }
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success('图片上传成功');
    } else if (info.file.status === 'error') {
      message.error('图片上传失败');
    }
  };

  const openParkEditModal = () => {
    if (selectedParkInfo) {
      parkForm.setFieldsValue(selectedParkInfo);
      setParkEditModalOpen(true);
    }
  };

  const fetchAssets = async () => {
    // 如果没有选择园区，先不加载
    if (!selectedPark) {
      return;
    }
    setLoading(true);
    try {
      const result = await getAssets({ page, pageSize, parkId: selectedPark, keyword: searchKeyword });
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      console.error('Fetch assets failed:', err);
      message.error('加载资产列表失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await exportAssets({ parkId: selectedPark || undefined, keyword: searchKeyword });
      message.success('导出成功');
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error('导出失败');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该资产吗？',
      onOk: async () => {
        try {
          await deleteAsset(id);
          message.success('删除成功');
          fetchAssets();
        } catch (err) {
          console.error('Delete failed:', err);
          message.error('删除失败');
        }
      },
    });
  };

  const handleCreate = async (values: any) => {
    try {
      await createAsset({
        ...values,
        parkId: selectedPark,
        status: 'VACANT',
      });
      message.success('创建成功');
      setAssetModalOpen(false);
      assetForm.resetFields();
      fetchAssets();
    } catch (err: any) {
      console.error('Create asset failed:', err);
      message.error('创建失败: ' + (err.message || '未知错误'));
    }
  };

  const handleViewDetail = async (record: any) => {
    setSelectedSpace(record);
    setDetailModalOpen(true);
    
    // 加载图片
    loadSpaceImages(record.id);
    
    // 如果是未出租资产，加载潜客信息
    if (record.status === 'VACANT' || record.status === 'CONSTRUCTION') {
      try {
        const allCustomers = await getCustomers({ type: 'PROSPECT', parkId: selectedPark || undefined });
        const prospectsWithFollowUps = await Promise.all(
          allCustomers
            .filter((c: Customer) => c.intendedAssetId === record.id)
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
    } else {
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
    if (!selectedSpace?.id) return;
    setUploadingImage(true);
    try {
      const result = await uploadAssetImage(selectedSpace.id, file);
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
    if (!selectedSpace?.id) return;
    const filename = imageUrl.split('/').pop();
    if (!filename) return;
    try {
      const result = await deleteAssetImage(selectedSpace.id, filename);
      setSpaceImages(result.images);
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete image:', err);
      message.error('删除失败');
    }
  };

  const handleSaveDetail = async (values: any) => {
    if (!selectedSpace) return;

    const updateData = {
      code: values.code,
      name: values.name,
      type: values.type,
      status: values.status,
      graphicArea: values.graphicArea,
      assetArea: values.assetArea,
      buildingArea: values.buildingArea,
      unitPrice: values.unitPrice,
      propertyFeeUnit: values.propertyFeeUnit,
      utilityFeeUnit: values.utilityFeeUnit,
      score: values.score,
      customer: values.customer,
      industry: values.industry,
      contractNo: values.contractNo,
      phone: values.phone,
      floorHeight: values.floorHeight,
      loadCapacity: values.loadCapacity,
      passage: values.passage,
      startDate: values.startDate,
      endDate: values.endDate,
    };
    
    try {
      await updateAsset(selectedSpace.id, updateData);
      
      await fetchAssets();
      setDetailModalOpen(false);
      setSelectedSpace(null);
      message.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const tableColumns = [
    { title: '资产名称', dataIndex: 'name', key: 'name', width: 140, fixed: 'left' },
    { title: '资产类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '资产状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={STATUS_MAP[status]?.color}>{STATUS_MAP[status]?.text}</Tag> },
    { title: '图形面积(㎡)', dataIndex: 'graphicArea', key: 'graphicArea', width: 120, render: (v: number) => v != null ? Number(v).toFixed(2) : '-' },
    { title: '资产面积(㎡)', dataIndex: 'assetArea', key: 'assetArea', width: 120, render: (v: number) => v != null ? Number(v).toFixed(2) : '-' },
    { title: '建筑面积(㎡)', dataIndex: 'buildingArea', key: 'buildingArea', width: 120, render: (v: number) => v != null ? Number(v).toFixed(2) : '-' },
    { title: '已出租面积(㎡)', dataIndex: 'rentedArea', key: 'rentedArea', width: 130, render: (v: number) => v != null ? Number(v).toFixed(2) : '-' },
    { title: '报价单价(元/㎡)', dataIndex: 'unitPrice', key: 'unitPrice', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    { 
      title: '操作', 
      key: 'action', 
      width: 150, 
      fixed: 'right',
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleViewDetail(record)}>编辑</Button>
          <Dropdown menu={{ items: [{ key: 'delete', label: '删除', danger: true, onClick: () => handleDelete(record.id) }] }}>
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    },
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
          selectedKeys={['assets']} 
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
        </Space>
      </div>

      {/* Main Content Area */}
      <Content style={{ 
        padding: 24, 
        background: '#f5f5f5', 
        flex: 1,
        overflow: 'auto'
      }}>
        {/* 园区基本信息 */}
        <Spin spinning={parkLoading}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ApartmentOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                <span>园区基本信息</span>
              </div>
            } 
            extra={
              <Button type="primary" icon={<EditOutlined />} onClick={openParkEditModal}>
                编辑园区信息
              </Button>
            }
          >
            {selectedParkInfo && (
              <div>
                {/* 核心指标 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" variant="borderless" style={{ background: '#f0f5ff' }}>
                      <Statistic 
                        title="园区总占地" 
                        value={selectedParkInfo.totalArea} 
                        precision={0} 
                        suffix="㎡" 
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" variant="borderless" style={{ background: '#e6f7ff' }}>
                      <Statistic 
                        title="建筑面积" 
                        value={selectedParkInfo.buildingArea} 
                        precision={0} 
                        suffix="㎡" 
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" variant="borderless" style={{ background: '#fff7e6' }}>
                      <Statistic 
                        title="可出租面积" 
                        value={selectedParkInfo.rentableArea} 
                        precision={0} 
                        suffix="㎡" 
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card size="small" variant="borderless" style={{ background: '#f6ffed' }}>
                      <Statistic 
                        title="出租率" 
                        value={(() => {
                          const totalAssetArea = data.reduce((sum, a) => sum + (a.assetArea || 0), 0);
                          if (totalAssetArea === 0) return 0;
                          const totalLeasedArea = leases
                            .filter(l => l.status === 'ACTIVE')
                            .reduce((sum, l) => sum + (l.quantity || 0), 0);
                          return Math.round((totalLeasedArea / totalAssetArea) * 100);
                        })()} 
                        precision={1} 
                        suffix="%" 
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                {/* 详细信息 */}
                <Descriptions 
                  column={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }} 
                  bordered 
                  size="small"
                >
                  <Descriptions.Item label="资产名称">{selectedParkInfo.name}</Descriptions.Item>
                  <Descriptions.Item label="资产类型">基地</Descriptions.Item>
                  <Descriptions.Item label="园区总绿化">{Math.round(selectedParkInfo.greenArea || 0)} ㎡</Descriptions.Item>
                  <Descriptions.Item label="硬化面积">{Math.round(selectedParkInfo.hardenedArea || 0)} ㎡</Descriptions.Item>
                  <Descriptions.Item label="停车位">{selectedParkInfo.parkingSpaces || 0} 个</Descriptions.Item>
                  <Descriptions.Item label="广告牌位">{selectedParkInfo.boardSpaces || 0} 个</Descriptions.Item>
                  <Descriptions.Item label="已出租面积">
                    {(() => {
                      const activeLeases = leases.filter(l => l.status === 'ACTIVE');
                      const total = activeLeases.reduce((sum, l) => sum + (l.quantity || 0), 0);
                      return `${Math.round(total)} ㎡`;
                    })()}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        </Spin>

        <Divider style={{ margin: '24px 0' }} />

        {/* 空间资产列表 */}
        <h3 style={{ margin: 0, marginBottom: 16 }}>空间资产列表</h3>
        <ListToolbar
          searchPlaceholder="搜索资产编号、名称、类型、客户等"
          onSearch={handleSearch}
          onExport={handleExport}
          extraButtons={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              assetForm.resetFields();
              setAssetModalOpen(true);
            }}>
              新增空间资产
            </Button>
          }
        />

        <Card>
          <Table
            columns={tableColumns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            scroll={{ x: 2500 }}
            pagination={{
              current: page,
              pageSize,
              total: total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); fetchAssets(); },
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
          />
        </Card>
      </Content>

      <Modal
        title="新增空间资产"
        open={assetModalOpen}
        onCancel={() => setAssetModalOpen(false)}
        footer={null}
        width={800}
      >
        <Form form={assetForm} onFinish={handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="资产名称" rules={[{ required: true }]}>
                <Input placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="资产类型" rules={[{ required: true }]}>
                <Select placeholder="请选择资产类型" options={[
                  { label: '冻库', value: '冻库' },
                  { label: '冷藏库', value: '冷藏库' },
                  { label: '常温库', value: '常温库' },
                  { label: '办公', value: '办公' },
                  { label: '配套', value: '配套' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="graphicWidth" label="图形长度(m)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入图形长度" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="graphicHeight" label="图形宽度(m)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入图形宽度" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="graphicArea" label="图形面积(㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled placeholder="根据长宽自动计算" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assetArea" label="资产面积(㎡)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入资产面积" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buildingArea" label="建筑面积(㎡)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入建筑面积" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="function" label="功能说明">
                <Input placeholder="请输入功能说明" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="报价单价(元/㎡)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入报价单价" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑园区信息弹窗 */}
      <Modal
        title="编辑园区信息"
        open={parkEditModalOpen}
        onCancel={() => setParkEditModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={parkForm} onFinish={handleParkUpdate} layout="vertical">
          <Form.Item name="name" label="园区名称" rules={[{ required: true }]}>
            <Input placeholder="请输入园区名称" />
          </Form.Item>
          <Form.Item name="code" label="园区编码" rules={[{ required: true }]}>
            <Input placeholder="请输入园区编码" />
          </Form.Item>
          <Form.Item name="status" label="资产状态" rules={[{ required: true }]}>
            <Select placeholder="请选择资产状态" options={[
              { label: '运营中', value: '运营中' },
              { label: '建设中', value: '建设中' },
              { label: '规划中', value: '规划中' }
            ]} />
          </Form.Item>
          <Form.Item name="totalArea" label="园区总占地面积" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入总占地面积" />
          </Form.Item>
          <Form.Item name="buildingArea" label="建筑面积" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入建筑面积" />
          </Form.Item>
          <Form.Item name="rentableArea" label="可出租面积" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入可出租面积" />
          </Form.Item>
          <Form.Item name="greenArea" label="绿化面积">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入绿化面积" />
          </Form.Item>
          <Form.Item name="hardenedArea" label="硬化面积">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入硬化面积" />
          </Form.Item>
          <Form.Item name="parkingSpaces" label="停车位">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入停车位数量" />
          </Form.Item>
          <Form.Item name="boardSpaces" label="广告牌位">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入广告牌位数量" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 空间详情弹窗 */}
      <SpaceDetailModal
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedSpace(null);
          setSpaceProspects([]);
          setSpaceImages([]);
        }}
        space={selectedSpace}
        onSave={handleSaveDetail}
        spaces={data}
        prospects={spaceProspects}
        images={spaceImages}
        imagesLoading={imagesLoading}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
      />
    </Layout>
  );
};

export default AssetManagement;
