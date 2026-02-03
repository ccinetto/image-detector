import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Typography } from 'antd';
import { TrophyOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGameEvents } from '../hooks/useGameEvents';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL;

const Leaderboard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [restarting, setRestarting] = useState(false);

  const handleGameEvent = useCallback((event: string, data: any) => {
    if (event === 'game:restarted' && data.sessionId === sessionId) {
      navigate(`/game/waiting/${sessionId}`);
    }
  }, [navigate, sessionId]);

  useGameEvents(sessionId, handleGameEvent);

  useEffect(() => {
    loadLeaderboard();
    loadSession();
  }, [sessionId]);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/session/${sessionId}/leaderboard`);
      setPlayers(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/session/${sessionId}`);
      const sessionData = response.data.find((item: any) => item.userId === 'session');
      setSession(sessionData);
    } catch (error) {
      console.error('Failed to load session');
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await axios.post(`${API_URL}/game/session/${sessionId}/restart`);
    } catch (error) {
      console.error('Failed to restart game');
    } finally {
      setRestarting(false);
    }
  };

  const isHost = session?.creatorId === localStorage.getItem('gameUserId');

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const medals = ['🥇', '🥈', '🥉'];
        return medals[index] || `#${index + 1}`;
      },
    },
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => <Text strong>{score}</Text>,
    },
    {
      title: 'Correct',
      dataIndex: 'correctAnswers',
      key: 'correctAnswers',
      render: (correct: number, record: any) => `${correct}/${record.totalAnswers}`,
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: 800 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <TrophyOutlined style={{ fontSize: 64, color: '#faad14' }} />
          <Title level={2}>Final Leaderboard</Title>
          <Text type="secondary">Game Code: {sessionId}</Text>
        </div>

        <Table
          columns={columns}
          dataSource={players}
          rowKey="userId"
          loading={loading}
          pagination={false}
          rowClassName={(record, index) => index === 0 ? 'winner-row' : ''}
        />

        {isHost && (
          <Button
            type="primary"
            size="large"
            block
            onClick={handleRestart}
            loading={restarting}
            style={{ marginTop: 24 }}
          >
            Restart Game
          </Button>
        )}

        <Button
          size="large"
          block
          icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          style={{ marginTop: 16 }}
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
};

export default Leaderboard;
