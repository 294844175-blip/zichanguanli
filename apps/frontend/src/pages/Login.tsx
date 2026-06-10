import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, CloudServerOutlined, BarChartOutlined, TeamOutlined } from '@ant-design/icons';
import { login as loginApi } from '../api/system';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await loginApi(values.username, values.password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0f2f5',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 左侧装饰区 */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景装饰圆 */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }} />
        
        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: 500 }}>
          <div style={{ marginBottom: 40 }}>
            <svg viewBox="0 0 1024 1024" width="80" height="80" style={{ marginBottom: 24 }}>
              <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32z m-40 632H136V232h752v560z" fill="#fff"/>
              <path d="M200 300h120v40H200zM200 380h120v40H200zM200 460h120v40H200zM200 540h120v40H200zM400 300h424v40H400zM400 380h424v40H400zM400 460h424v40H400zM400 540h424v40H400z" fill="#fff"/>
            </svg>
            <h1 style={{ fontSize: 42, fontWeight: 700, margin: '0 0 16px', letterSpacing: '2px' }}>
              园区运营资产管理系统
            </h1>
            <p style={{ fontSize: 18, opacity: 0.9, margin: 0 }}>
              智慧园区 · 资产全生命周期管理 · 数据驱动决策
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 60 }}>
            <div style={{ textAlign: 'center' }}>
              <CloudServerOutlined style={{ fontSize: 40, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 500 }}>空间可视化</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: 40, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 500 }}>数据看板</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 40, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 500 }}>客户经营</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div style={{
        width: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.05)'
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, color: '#1f1f1f', margin: '0 0 8px' }}>
              欢迎登录
            </h2>
            <p style={{ color: '#8c8c8c', fontSize: 14, margin: 0 }}>
              请输入您的账号信息以继续
            </p>
          </div>

          <Form onFinish={handleLogin} size="large" layout="vertical">
            <Form.Item 
              name="username" 
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ marginBottom: 24 }}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="请输入用户名"
                style={{ height: 48, borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item 
              name="password" 
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: 32 }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
                placeholder="请输入密码"
                style={{ height: 48, borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                style={{ height: 48, borderRadius: 8, fontSize: 16, fontWeight: 500 }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 32, color: '#bfbfbf', fontSize: 12 }}>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
            系统由园区运营团队提供技术支持
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;