import { useState, useEffect } from 'react';
import { Tree, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getOrgTree, createOrg, updateOrg, deleteOrg } from '../../api/system';
import { Organization } from '../../types';

const OrgManagement = () => {
  const [orgTree, setOrgTree] = useState<Organization[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getOrgTree();
      setOrgTree(data);
    } catch {
      message.error('获取组织架构失败');
    }
  };

  const handleAdd = (parentId: string | null = null) => {
    setEditingOrg(null);
    setSelectedParentId(parentId);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.setFieldsValue(org);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrg(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOrg) {
        await updateOrg(editingOrg.id, values);
        message.success('更新成功');
      } else {
        await createOrg({ ...values, parentId: selectedParentId });
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const buildTreeData = (orgs: Organization[]): any[] => {
    return orgs.map(org => ({
      key: org.id,
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{org.name} <span style={{ color: '#999', fontSize: 12 }}>({org.code})</span></span>
          <Space size="small" onClick={e => e.stopPropagation()}>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAdd(org.id)} />
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(org)} />
            <Popconfirm title="确认删除?" onConfirm={() => handleDelete(org.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        </div>
      ),
      children: org.children ? buildTreeData(org.children) : [],
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>组织架构</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(null)}>新增根节点</Button>
      </div>
      <Tree treeData={buildTreeData(orgTree)} defaultExpandAll showLine blockNode />

      <Modal
        title={editingOrg ? '编辑组织' : '新增组织'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}>
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="code" label="组织编码" rules={[{ required: true, message: '请输入组织编码' }]}>
            <Input disabled={!!editingOrg} placeholder="请输入组织编码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrgManagement;
