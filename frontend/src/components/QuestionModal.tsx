import React, { useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { questionsService } from '../services/api';

interface QuestionModalProps {
  visible: boolean;
  question: any;
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ visible, question, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [questionImage, setQuestionImage] = React.useState<File | null>(null);
  const [revealImage, setRevealImage] = React.useState<File | null>(null);
  const [questionImageError, setQuestionImageError] = React.useState('');
  const [revealImageError, setRevealImageError] = React.useState('');

  useEffect(() => {
    if (visible) {
      if (question) {
        form.setFieldsValue({
          question: question.question,
          answer: question.answer,
        });
      } else {
        form.resetFields();
      }
      setQuestionImage(null);
      setRevealImage(null);
      setQuestionImageError('');
      setRevealImageError('');
    }
  }, [question, form, visible]);

  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("NEWE IMAGE", e.target.files);

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.indexOf('image') === -1) {
      setQuestionImageError('File not supported. Please select an image.');
      setQuestionImage(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setQuestionImageError('Image too big (max 2MB)');
      setQuestionImage(null);
      return;
    }

    setQuestionImageError('');
    setQuestionImage(file);
  };

  const handleRevealImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.indexOf('image') === -1) {
      setRevealImageError('File not supported. Please select an image.');
      setRevealImage(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setRevealImageError('Image too big (max 2MB)');
      setRevealImage(null);
      return;
    }

    setRevealImageError('');
    setRevealImage(file);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append('question', values.question);
      formData.append('answer', values.answer);

      if (questionImage) {
        formData.append('questionImage', questionImage);
      }
      if (revealImage) {
        formData.append('revealImage', revealImage);
      }

      if (question) {
        await questionsService.update(question.id, formData);
        message.success('Question updated');
      } else {
        await questionsService.create(formData);
        message.success('Question created');
      }

      onSuccess();
    } catch (error) {
      message.error('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={question ? 'Edit Question' : 'Add Question'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Question"
          name="question"
          rules={[{ required: true, message: 'Please enter question' }]}
        >
          <Input placeholder="It is A or B?" />
        </Form.Item>

        <Form.Item
          label="Answer"
          name="answer"
          rules={[{ required: true, message: 'Please enter answer' }]}
        >
          <Input placeholder="A or B" />
        </Form.Item>

        <Form.Item label="Question Image (max 2MB)">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleQuestionImageChange}
          />
          {questionImageError && <div style={{ color: 'red', marginTop: 8 }}>{questionImageError}</div>}
          {questionImage && <div style={{ color: 'green', marginTop: 8 }}>Selected: {questionImage.name}</div>}
        </Form.Item>

        <Form.Item label="Reveal Image (max 2MB)">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleRevealImageChange}
          />
          {revealImageError && <div style={{ color: 'red', marginTop: 8 }}>{revealImageError}</div>}
          {revealImage && <div style={{ color: 'green', marginTop: 8 }}>Selected: {revealImage.name}</div>}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionModal;
