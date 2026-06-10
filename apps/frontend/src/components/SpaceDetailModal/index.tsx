import React, { useState } from 'react';
import {
  Modal,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Divider,
  Collapse,
  Timeline,
  Empty,
  Upload,
  Spin
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  WalletOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FileTextOutlined,
  BuildOutlined,
  CalendarOutlined,
  UserOutlined,
  FormOutlined,
  ClockCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Panel } = Collapse;

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  VACANT: { color: 'default', text: '空置' },
  RENTED: { color: 'blue', text: '已出租' },
  EXPIRING: { color: 'orange', text: '即将到期' },
  RISK: { color: 'red', text: '异常' },
  CONSTRUCTION: { color: 'default', text: '建设中' },
};

interface FollowUpRecord {
  id: string;
  content: string;
  followUpDate: string;
  nextFollowUp?: string;
  result?: string;
  createdBy: string;
  createdAt: string;
}

interface ProspectData {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  industry?: string;
  intendedLeaseMode?: string;
  intendedQuantity?: number;
  followUps?: FollowUpRecord[];
}

interface SpaceData {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  graphicArea?: number;
  assetArea?: number;
  area?: number;
  buildingArea?: number;
  projectionArea?: number;
  rentableArea?: number;
  unitPrice?: number;
  propertyFeeUnit?: number;
  utilityFeeUnit?: number;
  score?: number;
  occupancyRate?: number;
  function?: string;
  pricingRule?: string;
  quantity?: number;
  idleArea?: number;
  leasedUnit?: string;
  idleUnit?: string;
  createdBy?: string;
  createdAt?: string;
  customer?: string;
  industry?: string;
  contractNo?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  floorHeight?: number;
  loadCapacity?: number;
  passage?: string;
  sliceX?: number;
  sliceY?: number;
  sliceWidth?: number;
  sliceHeight?: number;
}

interface SpaceDetailModalProps {
  open: boolean;
  onCancel: () => void;
  space?: SpaceData;
  onSave?: (data: any) => Promise<void>;
  spaces?: SpaceData[];
  prospects?: ProspectData[];
  images?: string[];
  imagesLoading?: boolean;
  onUploadImage?: (file: File) => void;
  onDeleteImage?: (imageUrl: string) => void;
}

// 信息分组卡片组件
const InfoGroup: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <Card
    style={{ marginBottom: 16 }}
    title={
      <Space>
        {icon}
        <span>{title}</span>
      </Space>
    }
    size="small"
  >
    {children}
  </Card>
);

// 信息行组件
const InfoRow: React.FC<{ label: string; children?: React.ReactNode; value?: string | number | null; suffix?: string }> = ({
  label,
  children,
  value,
  suffix,
}) => {
  // 如果是面积（suffix 包含 ㎡），则四舍五入到个位
  const displayValue = suffix?.includes('㎡') && typeof value === 'number' 
    ? Math.round(value) 
    : value;
    
  return (
    <div style={{ display: 'flex', marginBottom: 12 }}>
      <span style={{ color: '#666', minWidth: 80 }}>{label}</span>
      <span>{children || (displayValue !== undefined && displayValue !== null ? `${displayValue}${suffix || ''}` : '-')}</span>
    </div>
  );
};

const SpaceDetailModal: React.FC<SpaceDetailModalProps> = ({
  open,
  onCancel,
  space,
  onSave,
  spaces = [],
  prospects = [],
  images = [],
  imagesLoading = false,
  onUploadImage,
  onDeleteImage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [expandedProspectId, setExpandedProspectId] = useState<string | null>(null);

  const isVacant = space?.status === 'VACANT' || space?.status === 'CONSTRUCTION';

  const handleStartEdit = () => {
    if (space) {
      form.setFieldsValue({
        code: space.code,
        name: space.name,
        type: space.type || '标准仓库',
        status: space.status,
        graphicArea: space.graphicArea || space.area,
        assetArea: space.assetArea || space.area,
        buildingArea: space.buildingArea,
        unitPrice: space.unitPrice,
        propertyFeeUnit: space.propertyFeeUnit,
        utilityFeeUnit: space.utilityFeeUnit,
        score: space.score,
        occupancyRate: space.occupancyRate,
        function: space.function,
        pricingRule: space.pricingRule,
        quantity: space.quantity,
        idleArea: space.idleArea,
        leasedUnit: space.leasedUnit,
        idleUnit: space.idleUnit,
        customer: space.customer,
        industry: space.industry,
        contractNo: space.contractNo,
        phone: space.phone,
        startDate: space.startDate,
        endDate: space.endDate,
        floorHeight: space.floorHeight || 9.0,
        loadCapacity: space.loadCapacity || 3.0,
        passage: space.passage || '贯通',
        createdBy: space.createdBy,
        createdAt: space.createdAt,
        sliceX: space.sliceX,
        sliceY: space.sliceY,
        sliceWidth: space.sliceWidth,
        sliceHeight: space.sliceHeight,
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSaveEdit = async (values: any) => {
    // 校验名称重复
    if (space && spaces.length > 0) {
      const isDuplicateName = spaces.some(
        (s) => s.id !== space.id && s.name === values.name
      );
      if (isDuplicateName) {
        message.error('空间名称已存在，请使用其他名称');
        return;
      }
    }

    setLoading(true);
    try {
      if (onSave) {
        await onSave(values);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!space) {
    return null;
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 6,
              height: 6,
              background: '#1890ff',
              borderRadius: '50%',
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 600 }}>{space.code}</span>
          <Tag color={STATUS_MAP[space.status]?.color}>
            {STATUS_MAP[space.status]?.text}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={1100}
      footer={
        !isEditing ? (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>关闭</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={handleStartEdit}>
              编辑
            </Button>
          </Space>
        ) : (
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
            >
              保存
            </Button>
          </Space>
        )
      }
    >
      {isEditing ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
          initialValues={space}
        >
          {/* 基础信息 */}
          <div style={{ marginBottom: 16 }}>
            <Space>
              <FileTextOutlined />
              <span style={{ fontWeight: 600 }}>基础信息</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="资产编号"
                rules={[{ required: true, message: '请输入资产编号' }]}
              >
                <Input placeholder="请输入资产编号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="name"
                label="资产名称"
                rules={[
                  { required: true, message: '请输入资产名称' },
                  {
                    validator: async (_, value) => {
                      if (!value || !space) return;
                      const isDuplicate = spaces.some(
                        (s) => s.id !== space.id && s.name === value
                      );
                      if (isDuplicate) {
                        return Promise.reject('空间名称已存在，请使用其他名称');
                      }
                    },
                  },
                ]}
              >
                <Input placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="资产类型">
                <Select placeholder="请选择资产类型">
                  <Option value="冻库">冻库</Option>
                  <Option value="冷藏库">冷藏库</Option>
                  <Option value="常温库">常温库</Option>
                  <Option value="办公">办公</Option>
                  <Option value="配套">配套</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="资产状态">
                <Select placeholder="请选择资产状态">
                  <Option value="VACANT">空置</Option>
                  <Option value="RENTED">已出租</Option>
                  <Option value="EXPIRING">即将到期</Option>
                  <Option value="RISK">异常</Option>
                  <Option value="CONSTRUCTION">建设中</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="function" label="功能说明">
                <Input placeholder="请输入功能说明" />
              </Form.Item>
            </Col>
          </Row>

          {/* 面积与价格 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <FileTextOutlined />
              <span style={{ fontWeight: 600 }}>面积与价格</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="assetArea"
                label="资产面积(㎡)"
                rules={[{ required: true, message: '请输入资产面积' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入资产面积" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="buildingArea" label="建筑面积(㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入建筑面积" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unitPrice" label="报价单价(元/㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入报价单价" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="propertyFeeUnit" label="物业费(元/㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入物业费" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="utilityFeeUnit" label="水电费(元/㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入水电费" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="pricingRule" label="定价规则">
                <Select placeholder="请选择定价规则">
                  <Option value="按面积">按面积</Option>
                  <Option value="按间数">按间数</Option>
                  <Option value="按楼层">按楼层</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label="数量">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入数量" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="idleArea" label="闲置面积(㎡)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入闲置面积" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="occupancyRate" label="出租率(%)">
                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="请输入出租率" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="score" label="评分">
                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="请输入评分" />
              </Form.Item>
            </Col>
          </Row>

          {/* 空间属性 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <BuildOutlined />
              <span style={{ fontWeight: 600 }}>空间属性</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="floorHeight" label="层高(m)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="请输入层高" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="loadCapacity" label="承重(t/㎡)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="请输入承重" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="passage" label="通道">
                <Select placeholder="请选择通道">
                  <Option value="贯通">贯通</Option>
                  <Option value="单侧">单侧</Option>
                  <Option value="双侧">双侧</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 租期信息 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <CalendarOutlined />
              <span style={{ fontWeight: 600 }}>租期信息</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="startDate" label="开始日期">
                <Input type="date" placeholder="请选择开始日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endDate" label="结束日期">
                <Input type="date" placeholder="请选择结束日期" />
              </Form.Item>
            </Col>
          </Row>

          {/* 租户信息 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <UserOutlined />
              <span style={{ fontWeight: 600 }}>租户信息</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customer" label="客户名称">
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="industry" label="所属行业">
                <Input placeholder="请输入所属行业" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractNo" label="合同编号">
                <Input placeholder="请输入合同编号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="leasedUnit" label="已出租单位">
                <Input placeholder="请输入已出租单位" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="idleUnit" label="闲置单位">
                <Input placeholder="请输入闲置单位" />
              </Form.Item>
            </Col>
          </Row>

          {/* 创建信息 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <FormOutlined />
              <span style={{ fontWeight: 600 }}>创建信息</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="createdBy" label="创建人">
                <Input placeholder="请输入创建人" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="createdAt" label="创建时间">
                <Input placeholder="请输入创建时间" disabled />
              </Form.Item>
            </Col>
          </Row>

          {/* 画板信息 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <BuildOutlined />
              <span style={{ fontWeight: 600 }}>画板信息</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="sliceX" label="画板 X 坐标">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入 X 坐标" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sliceY" label="画板 Y 坐标">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入 Y 坐标" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sliceWidth" label="画板宽度">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入宽度" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sliceHeight" label="画板高度">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入高度" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="graphicArea"
                label="图形面积(㎡)"
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled placeholder="系统自动计算" />
              </Form.Item>
            </Col>
          </Row>

          {/* 空间图片 */}
          <div style={{ marginBottom: 16, marginTop: 24 }}>
            <Space>
              <FileTextOutlined />
              <span style={{ fontWeight: 600 }}>空间图片</span>
            </Space>
            <Divider style={{ margin: '8px 0 16px' }} />
          </div>
          <Spin spinning={imagesLoading}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {images.map((imgUrl, index) => (
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
                  {onDeleteImage && (
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
                        zIndex: 1
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(imgUrl);
                      }}
                    >
                      ×
                    </div>
                  )}
                </div>
              ))}
              {onUploadImage && (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={({ file }) => onUploadImage(file as File)}
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
                    cursor: 'pointer'
                  }}>
                    <PlusOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <span style={{ color: '#666', fontSize: 11, marginTop: 4 }}>添加图片</span>
                  </div>
                </Upload>
              )}
            </div>
          </Spin>
        </Form>
      ) : (
        <div>
          {!isVacant ? (
            <>
              {/* 经营统计卡片 - 仅已出租显示 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="月租金(含税)"
                      value={85600}
                      precision={0}
                      suffix="元"
                      prefix={<WalletOutlined style={{ color: '#1890ff', fontSize: 24 }} />}
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="毛利率"
                      value={32.6}
                      precision={1}
                      suffix="%"
                      prefix={<BarChartOutlined style={{ color: '#52c41', fontSize: 24 }} />}
                      valueStyle={{ color: '#52c41', fontSize: 24 }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="出租率"
                      value={space.occupancyRate || 0}
                      precision={0}
                      suffix="%"
                      prefix={<PieChartOutlined style={{ color: '#faad14', fontSize: 24 }} />}
                      valueStyle={{ color: '#faad14', fontSize: 24 }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 基础信息 */}
              <InfoGroup title="基础信息" icon={<FileTextOutlined />}>
                <Row gutter={16}>
                  <Col span={6}>
                    <InfoRow label="资产编号" value={space.code} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产名称" value={space.name} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产类型" value={space.type} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产状态">
                      <Tag color={STATUS_MAP[space.status]?.color}>
                        {STATUS_MAP[space.status]?.text}
                      </Tag>
                    </InfoRow>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={6}>
                    <InfoRow label="功能说明" value={space.function} />
                  </Col>
                </Row>
              </InfoGroup>

              {/* 面积与价格 + 空间属性 */}
              <Row gutter={16}>
                <Col span={12}>
                  <InfoGroup title="面积与价格" icon={<FileTextOutlined />}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <InfoRow label="资产面积" value={space.assetArea || space.area} suffix="㎡" />
                      </Col>
                      <Col span={12}>
                        <InfoRow label="建筑面积" value={space.buildingArea} suffix="㎡" />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <InfoRow label="报价单价" value={space.unitPrice} suffix="元/㎡" />
                      </Col>
                      <Col span={12}>
                        <InfoRow label="物业费" value={space.propertyFeeUnit} suffix="元/㎡" />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <InfoRow label="水电费" value={space.utilityFeeUnit} suffix="元/㎡" />
                      </Col>
                      <Col span={12}>
                        <InfoRow label="定价规则" value={space.pricingRule} />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <InfoRow label="数量" value={space.quantity} />
                      </Col>
                      <Col span={12}>
                        <InfoRow label="评分" value={space.score} />
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <InfoRow label="闲置面积" value={space.idleArea} suffix="㎡" />
                      </Col>
                      <Col span={12}>
                        <InfoRow label="出租率" value={space.occupancyRate} suffix="%" />
                      </Col>
                    </Row>
                  </InfoGroup>
                </Col>
                <Col span={12}>
                  <InfoGroup title="空间属性" icon={<BuildOutlined />}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <InfoRow label="层高" value={space.floorHeight || 9} suffix="m" />
                      </Col>
                      <Col span={8}>
                        <InfoRow label="承重" value={space.loadCapacity || 3} suffix="t/㎡" />
                      </Col>
                      <Col span={8}>
                        <InfoRow label="通道" value={space.passage || '贯通'} />
                      </Col>
                    </Row>
                  </InfoGroup>
                </Col>
              </Row>

              {/* 租户信息 + 创建信息 */}
              <Row gutter={16}>
                <Col span={12}>
                  <InfoGroup title="租户信息" icon={<UserOutlined />}>
                    <InfoRow label="客户名称" value={space.customer} />
                    <InfoRow label="所属行业" value={space.industry} />
                    <InfoRow label="合同编号" value={space.contractNo} />
                    <InfoRow label="联系电话" value={space.phone} />
                    <InfoRow label="已出租单位" value={space.leasedUnit} />
                    <InfoRow label="闲置单位" value={space.idleUnit} />
                  </InfoGroup>
                </Col>
                <Col span={12}>
                  <InfoGroup title="创建信息" icon={<FormOutlined />}>
                    <InfoRow label="创建人" value={space.createdBy} />
                    <InfoRow label="创建时间" value={space.createdAt} />
                  </InfoGroup>
                </Col>
              </Row>

              {/* 画板信息 */}
              <InfoGroup title="画板信息" icon={<BuildOutlined />}>
                <Row gutter={16}>
                  <Col span={6}>
                    <InfoRow label="X 坐标" value={space.sliceX} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="Y 坐标" value={space.sliceY} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="宽度" value={space.sliceWidth} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="高度" value={space.sliceHeight} />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={6}>
                    <InfoRow label="图形面积" value={space.graphicArea || space.area} suffix="㎡" />
                  </Col>
                </Row>
              </InfoGroup>

              {/* 空间图片 */}
              {images.length > 0 && (
                <InfoGroup title="空间图片" icon={<FileTextOutlined />}>
                  <Spin spinning={imagesLoading}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {images.map((imgUrl, index) => (
                        <div key={index} style={{
                          aspectRatio: '1',
                          background: '#f0f0f0',
                          borderRadius: 8,
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          backgroundImage: `url(${imgUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
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
                      ))}
                    </div>
                  </Spin>
                </InfoGroup>
              )}
            </>
          ) : (
            <>
              {/* 未出租资产 - 显示潜客信息 */}
              <InfoGroup title="基础信息" icon={<FileTextOutlined />}>
                <Row gutter={16}>
                  <Col span={6}>
                    <InfoRow label="资产编号" value={space.code} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产名称" value={space.name} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产类型" value={space.type} />
                  </Col>
                  <Col span={6}>
                    <InfoRow label="资产状态">
                      <Tag color={STATUS_MAP[space.status]?.color}>
                        {STATUS_MAP[space.status]?.text}
                      </Tag>
                    </InfoRow>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={6}>
                    <InfoRow label="报价单价" value={space.unitPrice} suffix="元/㎡" />
                  </Col>
                </Row>
              </InfoGroup>

              {/* 潜客列表 */}
              <InfoGroup title={`意向潜客 (${prospects.length})`} icon={<UserOutlined />}>
                {prospects.length === 0 ? (
                  <Empty description="暂无意向潜客" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Collapse activeKey={expandedProspectId || undefined} onChange={(key) => setExpandedProspectId(Array.isArray(key) ? key[0] : key)}>
                    {prospects.map((prospect) => (
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
                        <Row gutter={16}>
                          <Col span={12}>
                            <InfoRow label="联系人" value={prospect.contact} />
                            <InfoRow label="联系电话" value={prospect.phone} />
                            <InfoRow label="邮箱" value={prospect.email} />
                          </Col>
                          <Col span={12}>
                            <InfoRow label="意向租赁模式" value={prospect.intendedLeaseMode} />
                            <InfoRow
                              label="意向租赁数量"
                              value={prospect.intendedQuantity != null
                                ? `${prospect.intendedQuantity} ${prospect.intendedLeaseMode === '按板数' ? '板' : '㎡'}`
                                : undefined}
                            />
                          </Col>
                        </Row>

                        {/* 跟进记录 */}
                        <Divider orientation="left">跟进记录</Divider>
                        {prospect.followUps && prospect.followUps.length > 0 ? (
                          <Timeline
                            items={prospect.followUps.map((fu) => ({
                              color: 'blue',
                              children: (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Space>
                                      <UserOutlined />
                                      <span>{fu.createdBy}</span>
                                    </Space>
                                    <Space>
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
              </InfoGroup>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default SpaceDetailModal;
