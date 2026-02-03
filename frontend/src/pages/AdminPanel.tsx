import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { questionsService } from '../services/api';

interface Question {
  id: string;
  question: string;
  answer: string;
  questionImageUrl?: string;
  revealImageUrl?: string;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [questionFileList, setQuestionFileList] = useState<any[]>([]);
  const [revealFileList, setRevealFileList] = useState<any[]>([]);

  const loadQuestions = async (key?: string) => {
    setLoading(true);
    try {
      const response = await questionsService.getAll(10, key);
      const newQuestions = key ? [...questions, ...response.data.data] : response.data.data;
      setQuestions(newQuestions);
      setLastKey(response.data.lastKey);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleCreateQuestion = async (values: { question: string; answer: string }) => {
    if (questionFileList.length === 0 || revealFileList.length === 0) {
      message.error('Please upload both images');
      return;
    }

    const formData = new FormData();
    formData.append('question', values.question);
    formData.append('answer', values.answer);
    formData.append('questionImage', questionFileList[0] as any);
    formData.append('revealImage', revealFileList[0] as any);

    setLoading(true);
    try {
      await questionsService.create(formData);
      message.success('Question created successfully');
      setModalVisible(false);
      form.resetFields();
      setQuestionFileList([]);
      setRevealFileList([]);
      loadQuestions();
    } catch (error) {
      message.error('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    Modal.confirm({
      title: 'Delete Question',
      content: 'Are you sure you want to delete this question? This will also delete the associated images.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await questionsService.delete(id);
          message.success('Question deleted successfully');
          loadQuestions();
        } catch (error) {
          message.error('Failed to delete question');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Question Image',
      dataIndex: 'questionImageUrl',
      key: 'questionImageUrl',
      render: (url: string) => url ? (
        <img 
          src={url} 
          alt="Question" 
          style={{ width: 50, height: 50, objectFit: 'cover', border: '1px solid #d9d9d9' }} 
          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23ddd" width="50" height="50"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'; }}
        />
      ) : '-',
    },
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
      title: 'Reveal Image',
      dataIndex: 'revealImageUrl',
      key: 'revealImageUrl',
      render: (url: string) => url ? (
        <img 
          src={url} 
          alt="Reveal" 
          style={{ width: 50, height: 50, objectFit: 'cover', border: '1px solid #d9d9d9' }} 
          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23ddd" width="50" height="50"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'; }}
        />
      ) : '-',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Question) => (
        <Space>
          <Button onClick={() => navigate(`/admin/questions/${record.id}`)}>Edit</Button>
          <Button danger onClick={() => handleDeleteQuestion(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>Admin Panel - Questions</h1>
          <Button type="primary" onClick={() => setModalVisible(true)}>
            Add Question
          </Button>
        </div>
        <Table
          dataSource={questions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
        {lastKey && (
          <Button onClick={() => loadQuestions(lastKey)} loading={loading}>
            Load More
          </Button>
        )}
      </Space>

      <Modal
        title="Add New Question"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setQuestionFileList([]);
          setRevealFileList([]);
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateQuestion}>
          <Form.Item
            label="Question"
            name="question"
            rules={[{ required: true, message: 'Please enter the question' }]}
          >
            <Input placeholder="e.g., A or B?" />
          </Form.Item>

          <Form.Item
            label="Answer"
            name="answer"
            rules={[{ required: true, message: 'Please enter the answer' }]}
          >
            <Input placeholder="e.g., A" />
          </Form.Item>

          <Form.Item label="Question Image (max 2MB)" required>
            <Upload
              fileList={questionFileList}
              beforeUpload={(file) => {
                if (file.size > 2 * 1024 * 1024) {
                  message.error(`${file.name} is too large. Maximum size is 2MB`);
                  return Upload.LIST_IGNORE;
                }
                setQuestionFileList([file]);
                return false;
              }}
              onRemove={() => setQuestionFileList([])}
              maxCount={1}
              accept="image/jpeg,image/jpg,image/png"
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Reveal Image (max 2MB)" required>
            <Upload
              fileList={revealFileList}
              beforeUpload={(file) => {
                if (file.size > 2 * 1024 * 1024) {
                  message.error(`${file.name} is too large. Maximum size is 2MB`);
                  return Upload.LIST_IGNORE;
                }
                setRevealFileList([file]);
                return false;
              }}
              onRemove={() => setRevealFileList([])}
              maxCount={1}
              accept="image/jpeg,image/jpg,image/png"
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
