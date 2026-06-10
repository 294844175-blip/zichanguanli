import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, getRoles, exportUsers, getUserParks, assignUserParks } from '../../api/system';
import { getParks } from '../../api/parks';
import { User, Role, Park } from '../../types';
import { ListToolbar } from '../../components/ListToolbar';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [parkModalVisible, setParkModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userParkIds, setUserParkIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    fetchRoles();
    fetchParks();
  }, [searchKeyword]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUsers({ keyword: searchKeyword });
      setUsers(data);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleExport = async () => {
    try {
      await exportUsers({ keyword: searchKeyword });
      message.success('导出成功');
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error('导出失败');
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {
      console.error('获取角色列表失败');
    }
  };

  const fetchParks = async () => {
    try {
      const data = await getParks();
      setParks(data);
    } catch {
      console.error('获取园区列表失败');
    }
  };

  const handleManageParks = async (user: User) => {
    setSelectedUserId(user.id);
    try {
      const data = await getUserParks(user.id);
      setUserParkIds(data.map((p: Park) => p.id));
    } catch {
      setUserParkIds([]);
    }
    setParkModalVisible(true);
  };

  const handleSaveParks = async () => {
    if (!selectedUserId) return;
    try {
      await assignUserParks(selectedUserId, userParkIds);
      message.success('园区权限已更新');
      setParkModalVisible(false);
    } catch {
      message.error('更新园区权限失败');
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE' });
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await createUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
    { title: '姓名', dataIndex: 'realName', key: 'realName', width: 120 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 150 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '角色', dataIndex: ['role', 'name'], key: 'role', width: 120 },
    {
      title: '园区权限',
      key: 'parkAccess',
      width: 120,
      render: (_: unknown, record: User) => (
        <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleManageParks(record)}>
          配置
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'red'}>{s === 'ACTIVE' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: 16 }}>账号管理</h2>
      <ListToolbar
        searchPlaceholder="搜索用户名、姓名、电话、邮箱等"
        onSearch={handleSearch}
        onExport={handleExport}
        extraButtons={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        }
      />
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: 1000 }} />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingUser} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: !editingUser, message: '请输入密码' }]}>
            <Input.Password placeholder={editingUser ? '留空则不修改密码' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="realName" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Select.Option key={role.id} value={role.id}>{role.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="ACTIVE">启用</Select.Option>
              <Select.Option value="DISABLED">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="配置园区权限"
        open={parkModalVisible}
        onCancel={() => setParkModalVisible(false)}
        onOk={handleSaveParks}
        width={500}
      >
        <p style={{ color: '#666', marginBottom: 16 }}>选择该用户可访问的园区，未选择的园区将无权查看和管理</p>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="请选择园区"
          value={userParkIds}
          onChange={setUserParkIds}
          optionFilterProp="label"
        >
          {parks.map(park => (
            <Select.Option key={park.id} value={park.id} label={park.name}>
              {park.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default UserManagement;
