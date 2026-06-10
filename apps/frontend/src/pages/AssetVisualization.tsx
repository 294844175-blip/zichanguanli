import { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { getParks } from '../api/parks';
import { Park } from '../types';
import SpaceEditor from '../components/SpaceEditor';

const AssetVisualization = () => {
  const [parks, setParks] = useState<Park[]>([]);
  const [selectedPark, setSelectedPark] = useState<string>();

  useEffect(() => {
    loadParks();
  }, []);

  const loadParks = async () => {
    const data = await getParks();
    setParks(data);
    if (data.length > 0 && !selectedPark) {
      setSelectedPark(data[0].id);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>资产空间可视化</h2>
        <Select
          style={{ width: 200 }}
          placeholder="选择园区"
          value={selectedPark}
          onChange={setSelectedPark}
          options={parks.map(p => ({ label: p.name, value: p.id }))}
        />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {selectedPark ? (
          <SpaceEditor parkId={selectedPark} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin size="large" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetVisualization;
