import React, { useState } from 'react';
import { Button, Card, Input, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const GameStart: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [hostName, setHostName] = useState('');

  const handleStartGame = async () => {
    if (!hostName.trim()) {
      message.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('gameUserId') || Math.random().toString(36).substring(7);
      
      const response = await axios.post(`${API_URL}/game/session`, { 
        totalRounds: 5,
        creatorId: userId
      });
      
      localStorage.setItem('gameUserId', userId);
      localStorage.setItem('gameUsername', hostName.trim());
      
      const sessionId = response.data.sessionId;
      
      await axios.post(`${API_URL}/game/session/${sessionId}/join`, {
        userId,
        username: hostName.trim(),
      });
      
      navigate(`/game/waiting/${sessionId}`);
    } catch (error) {
      message.error('Failed to create game session');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!joinCode) {
      message.error('Please enter a game code');
      return;
    }
    navigate(`/game/join/${joinCode.toUpperCase()}`);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card title="Image Detector Game" style={{ width: 500, textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h3>Start a New Game</h3>
            <Input
              placeholder="Enter your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              size="large"
              maxLength={20}
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" size="large" block onClick={handleStartGame} loading={loading}>
              Create Game
            </Button>
          </div>

          <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: 24 }}>
            <h3>Join a Game</h3>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Enter game code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onPressEnter={handleJoinGame}
                size="large"
                maxLength={6}
              />
              <Button type="primary" size="large" onClick={handleJoinGame}>
                Join
              </Button>
            </Space.Compact>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default GameStart;
