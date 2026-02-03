import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to admin panel
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/panel');
    }
  }, [navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const response = await authService.login(values.username, values.password);
      localStorage.setItem('token', response.data.access_token);
      message.success('Login successful');
      navigate('/admin/panel');
    } catch (error) {
      message.error('Invalid credentials');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Admin Login" style={{ width: 400 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label="Username" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
