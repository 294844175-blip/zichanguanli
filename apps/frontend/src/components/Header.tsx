import React, { useEffect } from 'react';
import { Layout, Select, Avatar, Dropdown, Button, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useParkStore } from '../store/useParkStore';
import { getParks } from '../api/parks';
import { getUserParks, logout } from '../api/system';
import { SettingOutlined, LogoutOutlined, UserOutlined, TeamOutlined, ApartmentOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  extraContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ extraContent }) => {
  const navigate = useNavigate();
  const { selectedParkId, parks, setSelectedParkId, setParks } = useParkStore();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadParks = async () => {
      try {
        const data = await getParks();
        setParks(data);
        if (data.length > 0 && !selectedParkId) {
          const defaultPark = data.find(p => p.name === '华东运营中心');
          if (defaultPark) {
            setSelectedParkId(defaultPark.id);
          } else {
            setSelectedParkId(data[0].id);
          }
        }
      } catch (err) {
        console.error('加载园区失败:', err);
      }
    };
    loadParks();
  }, [setParks, setSelectedParkId, selectedParkId]);

  const handleParkChange = async (parkId: string) => {
    const dataScope = user.dataScope;
    if (dataScope === 'ALL') {
      setSelectedParkId(parkId);
      return;
    }
    
    try {
      const userParks = await getUserParks(user.id);
      const hasAccess = userParks.some((p: any) => p.id === parkId);
      if (hasAccess) {
        setSelectedParkId(parkId);
      } else {
        message.warning('您没有该园区的访问权限');
      }
    } catch (err) {
      console.error('检查权限失败', err);
      message.error('权限检查失败');
    }
  };

  const handleSystemClick = () => {
    if (user.dataScope === 'ALL') {
      navigate('/system/user');
    } else {
      message.warning('无权限访问系统管理');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'system', label: '系统管理', icon: <SettingOutlined />, onClick: handleSystemClick },
    { key: 'user', label: '账号管理', icon: <UserOutlined />, onClick: handleSystemClick },
    { key: 'role', label: '角色管理', icon: <TeamOutlined />, onClick: handleSystemClick },
    { key: 'org', label: '组织架构', icon: <ApartmentOutlined />, onClick: handleSystemClick },
    { type: 'divider' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ];

  return (
    <AntHeader style={{
      height: 64,
      background: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #e8e8e8',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 18, fontWeight: 700, color: '#1890ff',
          flexShrink: 0, cursor: 'pointer'
        }} onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 1024 1024" width="28" height="28" style={{ flexShrink: 0 }}>
            <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32z m-40 632H136V232h752v560z" fill="#1890ff"/>
            <path d="M200 300h120v40H200zM200 380h120v40H200zM200 460h120v40H200zM200 540h120v40H200zM400 300h424v40H400zM400 380h424v40H400zM400 460h424v40H400zM400 540h424v40H400z" fill="#1890ff"/>
          </svg>
          <span style={{ whiteSpace: 'nowrap' }}>园区运营资产管理系统</span>
        </div>

        <div style={{ width: 1, height: 24, background: '#e8e8e8', flexShrink: 0 }} />

        {/* Park Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ color: '#666', fontSize: 14, whiteSpace: 'nowrap' }}>园区：</span>
          <Select
            style={{ width: 150, minWidth: 120 }}
            value={selectedParkId}
            onChange={handleParkChange}
            options={parks?.map(p => ({ label: p.name, value: p.id }))}
          />
        </div>

        {extraContent}
      </div>

      <Space size="large">
        {/* 系统管理入口 */}
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={handleSystemClick}
        >
          系统管理
        </Button>

        {/* 用户头像和下拉菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar style={{ background: '#1890ff' }}>
              {user.realName ? user.realName[0] : (user.username ? user.username[0] : <UserOutlined />)}
            </Avatar>
            <span style={{ color: '#333', fontWeight: 500 }}>{user.realName || user.username}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
