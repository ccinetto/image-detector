import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Typography, message, Spin } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL;

const WaitingRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/session/${sessionId}`);
      const sessionData = response.data.find((item: any) => item.userId === 'session');
      const playerList = response.data.filter((item: any) => item.userId !== 'session');
      
      setSession(sessionData);
      setPlayers(playerList);

      if (sessionData?.status === 'playing') {
        navigate(`/game/play/${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to load session');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadSession();
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sessionId || '');
    message.success('Game code copied to clipboard!');
  };

  const handleStartGame = async () => {
    const userId = localStorage.getItem('gameUserId');
    if (session?.creatorId !== userId) {
      message.error('Only the game creator can start the game');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/game/session/${sessionId}/start`, {});
      navigate(`/game/play/${sessionId}`);
    } catch (error) {
      message.error('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const isHost = session?.creatorId === localStorage.getItem('gameUserId');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: 600, textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>Waiting Room</Title>
            <Text type="secondary">Auto-refreshing every 2 seconds</Text>
          </div>
          
          <div>
            <Text type="secondary">Game Code</Text>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <Title level={1} style={{ margin: 0, letterSpacing: 8 }}>{sessionId}</Title>
              <Button icon={<CopyOutlined />} onClick={copyCode} size="large">
                Copy
              </Button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>Players ({players.length})</Title>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                Refresh Now
              </Button>
            </div>
            {players.length === 0 ? (
              <div style={{ padding: 40 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Waiting for players to join...</Text>
                </div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {players.map((player) => (
                  <Card key={player.userId} size="small">
                    {player.username}
                    {player.userId === session?.creatorId && (
                      <span style={{ marginLeft: 8, color: '#1890ff', fontWeight: 'bold' }}>(Host)</span>
                    )}
                  </Card>
                ))}
              </Space>
            )}
          </div>

          <Button 
            type="primary" 
            size="large" 
            disabled={!isHost} 
            onClick={handleStartGame} 
            loading={loading}
          >
            {isHost ? 'Start Game' : 'Waiting for host to start...'}
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default WaitingRoom;
