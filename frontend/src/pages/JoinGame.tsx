import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const JoinGame: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!username.trim()) {
      message.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const userId = Math.random().toString(36).substring(7);
      await axios.post(`${API_URL}/game/session/${sessionId}/join`, {
        userId,
        username: username.trim(),
      });
      
      localStorage.setItem('gameUserId', userId);
      localStorage.setItem('gameUsername', username.trim());
      
      navigate(`/game/waiting/${sessionId}`);
    } catch (error) {
      message.error('Failed to join game. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card title={`Join Game: ${sessionId}`} style={{ width: 400 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onPressEnter={handleJoin}
            size="large"
            maxLength={20}
          />
          <Button type="primary" size="large" block onClick={handleJoin} loading={loading}>
            Join Game
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default JoinGame;
