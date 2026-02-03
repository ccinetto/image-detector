import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Layout } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { questionsService } from '../services/api';
import QuestionModal from '../components/QuestionModal';

const { Header, Content } = Layout;

interface Question {
  id: string;
  question: string;
  answer: string;
  questionImageUrl: string;
  revealImageUrl: string;
}

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionsService.getAll();
      setQuestions(response.data);
    } catch (error) {
      message.error('Failed to load questions');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await questionsService.delete(id);
      message.success('Question deleted');
      fetchQuestions();
    } catch (error) {
      message.error('Failed to delete question');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
    },
    {
      title: 'Answer',
      dataIndex: 'answer',
      key: 'answer',
    },
    {
      title: 'Question Image',
      dataIndex: 'questionImageUrl',
      key: 'questionImageUrl',
      render: (url: string) => url ? <img src={url} alt="question" style={{ width: 50, height: 50, objectFit: 'cover' }} /> : '-',
    },
    {
      title: 'Reveal Image',
      dataIndex: 'revealImageUrl',
      key: 'revealImageUrl',
      render: (url: string) => url ? <img src={url} alt="reveal" style={{ width: 50, height: 50, objectFit: 'cover' }} /> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Question) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingQuestion(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Delete this question?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Question Management</h2>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingQuestion(null);
            setModalVisible(true);
          }}
          style={{ marginBottom: 16 }}
        >
          Add Question
        </Button>
        <Table
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
        />
        <QuestionModal
          visible={modalVisible}
          question={editingQuestion}
          onClose={() => {
            setModalVisible(false);
            setEditingQuestion(null);
          }}
          onSuccess={() => {
            setModalVisible(false);
            setEditingQuestion(null);
            fetchQuestions();
          }}
        />
      </Content>
    </Layout>
  );
};

export default Questions;
