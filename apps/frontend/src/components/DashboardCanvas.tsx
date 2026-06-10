import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { getAssetSlices } from '../api/assets';

interface DashboardCanvasProps {
  parkId: string;
  width?: number;
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  VACANT: '#d9d9d9',
  RENTED: '#597ef7',
  EXPIRING: '#ff9c6e',
  RISK: '#ff4d4f',
};

const DashboardCanvas = ({ parkId, width = 600, height = 400 }: DashboardCanvasProps) => {
  const [spaces, setSpaces] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const data = await getAssetSlices(parkId);
        if (data.length > 0) {
          setSpaces(data);
        } else {
          setSpaces(getSampleData(parkId));
        }
      } catch {
        setSpaces(getSampleData(parkId));
      } finally {
        setLoading(false);
      }
    };
    loadSpaces();
  }, [parkId]);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#fff',
      borderRadius: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
          linear-gradient(#f0f0f0 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }} />
      
      {spaces.map((space) => (
        <div
          key={space.id}
          style={{
            position: 'absolute',
            left: space.sliceX,
            top: space.sliceY,
            width: space.sliceWidth,
            height: space.sliceHeight,
            backgroundColor: STATUS_COLORS[space.status] || '#d9d9d9',
            border: '1px solid #666',
            boxSizing: 'border-box',
            padding: '5px',
            fontSize: '11px',
            color: '#333',
            transform: `rotate(${space.sliceRotation}deg)`,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ fontWeight: 600 }}>{space.code}</div>
          <div>{space.area}㎡</div>
        </div>
      ))}
    </div>
  );
};

function getSampleData(parkId: string): Asset[] {
  return [
    {
      id: '1',
      code: 'A-101',
      name: '标准仓库 A-101',
      type: '常温库',
      status: 'RENTED',
      area: 1200,
      buildingArea: 1200,
      projectionArea: 1200,
      rentableArea: 1100,
      unitPrice: 72,
      propertyFeeUnit: 0,
      utilityFeeUnit: 0,
      score: 0,
      parkId: parkId,
      buildingId: '',
      floorId: '',
      sliceX: 50,
      sliceY: 50,
      sliceWidth: 180,
      sliceHeight: 120,
      sliceRotation: 0,
      zIndex: 0,
      createTime: '',
      updateTime: '',
      statusColor: '',
      idleUnit: '',
    },
    {
      id: '2',
      code: 'A-102',
      name: '标准仓库 A-102',
      type: '冻库',
      status: 'VACANT',
      area: 800,
      buildingArea: 800,
      projectionArea: 800,
      rentableArea: 750,
      unitPrice: 72,
      propertyFeeUnit: 0,
      utilityFeeUnit: 0,
      score: 0,
      parkId: parkId,
      buildingId: '',
      floorId: '',
      sliceX: 250,
      sliceY: 50,
      sliceWidth: 150,
      sliceHeight: 120,
      sliceRotation: 0,
      zIndex: 1,
      createTime: '',
      updateTime: '',
      statusColor: '',
      idleUnit: '',
    },
    {
      id: '3',
      code: 'A-103',
      name: '标准仓库 A-103',
      type: '冷藏库',
      status: 'EXPIRING',
      area: 600,
      buildingArea: 600,
      projectionArea: 600,
      rentableArea: 550,
      unitPrice: 72,
      propertyFeeUnit: 0,
      utilityFeeUnit: 0,
      score: 0,
      parkId: parkId,
      buildingId: '',
      floorId: '',
      sliceX: 50,
      sliceY: 200,
      sliceWidth: 160,
      sliceHeight: 100,
      sliceRotation: 0,
      zIndex: 2,
      createTime: '',
      updateTime: '',
      statusColor: '',
      idleUnit: '',
    },
  ];
}

export default DashboardCanvas;
