import { Modal, Descriptions, Tag, Statistic, Row, Col } from 'antd';
import { Asset } from '../../types';

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  VACANT: { color: 'red', text: '未租' },
  RENTED: { color: 'green', text: '已租' },
  EXPIRING: { color: 'orange', text: '即将到期' },
  RISK: { color: 'red', text: '风险资产' },
};

interface AssetDetailModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

const AssetDetailModal = ({ asset, open, onClose }: AssetDetailModalProps) => {
  if (!asset) return null;

  const status = STATUS_MAP[asset.status] || { color: 'default', text: asset.status };

  return (
    <Modal
      title={`资产详情 - ${asset.name}`}
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic title="资产评分" value={asset.score} suffix="分" />
        </Col>
        <Col span={8}>
          <Statistic title="报价单价" value={asset.unitPrice} prefix="¥" suffix="元/㎡" />
        </Col>
        <Col span={8}>
          <Statistic title="可租面积" value={asset.rentableArea} suffix="㎡" />
        </Col>
      </Row>

      <Descriptions column={2} style={{ marginTop: 24 }} bordered>
        <Descriptions.Item label="资产编码">{asset.code}</Descriptions.Item>
        <Descriptions.Item label="资产类型">{asset.type}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={status.color}>{status.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="建筑面积">{asset.buildingArea}㎡</Descriptions.Item>
        <Descriptions.Item label="物业费">{asset.propertyFeeUnit}元/㎡</Descriptions.Item>
        <Descriptions.Item label="水电费">{asset.utilityFeeUnit}元/㎡</Descriptions.Item>
      </Descriptions>

      {asset.lease && (
        <>
          <h4 style={{ marginTop: 24 }}>租赁信息</h4>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="客户">{asset.lease.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="租期">
              {new Date(asset.lease.startDate).toLocaleDateString()} ~ {new Date(asset.lease.endDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="月预估收入">¥{asset.lease.monthlyEstimate.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="日预估收入">¥{asset.lease.dailyEstimate.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="物业费">{asset.lease.propertyFee}元</Descriptions.Item>
            <Descriptions.Item label="水电费">{asset.lease.utilityFee}元</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {!asset.lease && asset.status === 'VACANT' && (
        <div style={{ marginTop: 24, padding: 16, background: '#fffbe6', borderRadius: 8 }}>
          <strong>闲置损失预估：</strong>
          ¥{(asset.unitPrice * asset.rentableArea).toFixed(2)} / 月
        </div>
      )}
    </Modal>
  );
};

export default AssetDetailModal;
