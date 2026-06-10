import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRoles, createRole, updateRole, deleteRole, exportRoles } from '../../api/system';
import { Role } from '../../types';
import { ListToolbar } from '../../components/ListToolbar';

const DATA_SCOPE_MAP: Record<string, string> = {
  ALL: '全部数据',
  ORG: '本部门数据',
  PARK: '本园区数据',
  CUSTOM: '自定义',
};

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchData();
  }, [searchKeyword]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRoles({ keyword: searchKeyword });
      setRoles(data);
    } catch {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleExport = async () => {
    try {
      await exportRoles({ keyword: searchKeyword });
      message.success('导出成功');
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error('导出失败');
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ dataScope: 'ORG', permissions: [] });
    setModalVisible(true);
  };

  const handleEdit = (record: Role) => {
    setEditingRole(record);
    form.setFieldsValue({
      ...record,
      permissions: typeof record.permissions === 'string' ? JSON.parse(record.permissions) : record.permissions,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        permissions: Array.isArray(values.permissions) ? JSON.stringify(values.permissions) : values.permissions,
      };
      if (editingRole) {
        await updateRole(editingRole.id, data);
        message.success('更新成功');
      } else {
        await createRole(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '角色编码', dataIndex: 'code', key: 'code', width: 150 },
    {
      title: '数据权限',
      dataIndex: 'dataScope',
      key: 'dataScope',
      width: 120,
      render: (scope: string) => <Tag>{DATA_SCOPE_MAP[scope] || scope}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Role) => (
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
      <h2 style={{ margin: 0, marginBottom: 16 }}>角色管理</h2>
      <ListToolbar
        searchPlaceholder="搜索角色名称、角色编码、描述等"
        onSearch={handleSearch}
        onExport={handleExport}
        extraButtons={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增角色
          </Button>
        }
      />
      <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input disabled={!!editingRole} placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item name="dataScope" label="数据权限" rules={[{ required: true, message: '请选择数据权限' }]}>
            <Select>
              <Select.Option value="ALL">全部数据</Select.Option>
              <Select.Option value="ORG">本部门数据</Select.Option>
              <Select.Option value="PARK">本园区数据</Select.Option>
              <Select.Option value="CUSTOM">自定义</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="permissions" label="权限列表">
            <Select mode="tags" placeholder="请输入权限标识，如 asset:view" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
