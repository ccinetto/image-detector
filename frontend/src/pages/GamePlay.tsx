import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Typography, Progress, message, Radio } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL;

const GamePlay: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [submitted, setSubmitted] = useState(false);
  const [showRevealScreen, setShowRevealScreen] = useState(false);
  const [revealData, setRevealData] = useState<any>(null);
  const [paused, setPaused] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const currentQuestionIdRef = useRef<string | null>(null);
  const submittedRef = useRef(false);
  const userId = localStorage.getItem('gameUserId');

  useEffect(() => {
    if (currentRound === 0) {
      setCurrentRound(1);
    }
  }, []);

  useEffect(() => {
    if (currentRound > 0 && currentRound <= 5) {
      loadQuestion();
    } else if (currentRound > 5) {
      navigate(`/game/leaderboard/${sessionId}`);
    }
  }, [currentRound]);

  useEffect(() => {
    if (!question) return;
    
    setAnswer('');
    setSubmitted(false);
    submittedRef.current = false;
    setShowRevealScreen(false);
    setRevealData(null);
    setTimeLeft(10);
    
    const questionId = question?.id;
    if (questionId) {
      setCurrentQuestionId(questionId);
      currentQuestionIdRef.current = questionId;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (paused) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          const qId = currentQuestionIdRef.current;
          if (qId) {
            showReveal(qId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question, paused]);

  const loadQuestion = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/session/${sessionId}/round/${currentRound}`);
      setQuestion(response.data);
    } catch (error) {
      message.error('Failed to load question');
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    
    setSubmitted(true);
    submittedRef.current = true;

    try {
      await axios.post(`${API_URL}/game/session/${sessionId}/answer`, {
        userId,
        questionId: question.id,
        answer: answer || '',
      });
    } catch (error) {
      message.error('Failed to submit answer');
    }
  };

  const showReveal = async (questionId: string) => {
    if (!submittedRef.current) {
      try {
        await axios.post(`${API_URL}/game/session/${sessionId}/answer`, {
          userId,
          questionId,
          answer: '',
        });
      } catch (error) {
        console.error('Failed to submit empty answer');
      }
    }

    try {
      const revealResponse = await axios.get(
        `${API_URL}/game/session/${sessionId}/reveal/${userId}/${questionId}`
      );
      setRevealData(revealResponse.data);
      setShowRevealScreen(true);

      setTimeout(() => {
        setCurrentRound((prev) => prev + 1);
      }, 5000);
    } catch (error) {
      message.error('Failed to load reveal');
    }
  };

  if (!question) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Card>Loading question...</Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Round {currentRound} / 5</Text>
            <div>
              <Button size="small" onClick={() => setPaused(!paused)} style={{ marginRight: 8 }}>
                {paused ? 'Resume' : 'Pause'}
              </Button>
              <Text strong style={{ fontSize: 20, color: timeLeft < 5 ? '#ff4d4f' : '#1890ff' }}>
                {timeLeft}s
              </Text>
            </div>
          </div>
          <Progress 
            percent={(timeLeft / 10) * 100} 
            showInfo={false} 
            status={timeLeft < 5 ? 'exception' : 'active'} 
          />
        </div>

        {question.questionImageUrl && (
          <img 
            src={question.questionImageUrl} 
            alt="Question" 
            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', marginBottom: 24, borderRadius: 8 }} 
          />
        )}

        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          {question.question}
        </Title>

        {!showRevealScreen ? (
          <div>
            <Radio.Group 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              style={{ width: '100%' }}
              disabled={submitted || timeLeft === 0}
            >
              <Radio.Button value="A" style={{ width: '50%', height: 60, lineHeight: '60px', fontSize: 20 }}>
                A
              </Radio.Button>
              <Radio.Button value="B" style={{ width: '50%', height: 60, lineHeight: '60px', fontSize: 20 }}>
                B
              </Radio.Button>
            </Radio.Group>
            <Button 
              type="primary" 
              size="large" 
              block 
              style={{ marginTop: 16, height: 50 }} 
              onClick={handleSubmit} 
              disabled={submitted || timeLeft === 0 || !answer}
            >
              {submitted ? 'Answer Submitted - Waiting...' : 'Submit Answer'}
            </Button>
          </div>
        ) : (
          <Card style={{ textAlign: 'center', background: revealData?.correct ? '#f6ffed' : '#fff2e8', border: `2px solid ${revealData?.correct ? '#52c41a' : '#fa8c16'}` }}>
            <Title level={2} style={{ color: revealData?.correct ? '#52c41a' : '#fa8c16', marginBottom: 16 }}>
              {revealData?.correct ? '✓ Correct!' : '✗ Wrong'}
            </Title>
            <Text style={{ fontSize: 18 }}>Correct answer: <strong>{revealData?.correctAnswer}</strong></Text>
            {revealData?.correct && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 20, color: '#52c41a' }}>+{revealData?.points} points</Text>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Current Score: {revealData?.currentScore}</Text>
            </div>
            {revealData?.revealImageUrl && (
              <img 
                src={revealData.revealImageUrl} 
                alt="Reveal" 
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', marginTop: 16, borderRadius: 8 }} 
              />
            )}
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Next round in 5 seconds...</Text>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default GamePlay;
