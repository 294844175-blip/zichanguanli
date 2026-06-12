import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { getMyProfile, updateMyProfile } from '../api/system';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const { username, newPassword } = values;
      const updateData: { username?: string; newPassword?: string } = {};

      if (username) updateData.username = username;
      if (newPassword) {
        updateData.newPassword = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        message.warning('没有需要更新的字段');
        return;
      }

      const updatedUser = await updateMyProfile(updateData);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const mergedUser = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(mergedUser));

      message.success('个人资料更新成功');
      form.resetFields();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else if (error.errorFields) {
        return;
      } else {
        message.error('更新失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleAfterOpenChange = async (open: boolean) => {
    if (open) {
      try {
        const profile = await getMyProfile();
        form.setFieldsValue({
          username: profile.username,
        });
      } catch {
        message.error('获取个人资料失败');
      }
    }
  };

  return (
    <Modal
      title="修改个人资料"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { min: 6, message: '密码至少6位' },
          ]}
        >
          <Input.Password placeholder="留空则不修改密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProfileModal;
