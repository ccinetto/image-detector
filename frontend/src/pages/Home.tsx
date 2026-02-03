import React from 'react';
import { Button, Card } from 'antd';

const Home: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Image Detector Game" style={{ width: 400, textAlign: 'center' }}>
        <p>Welcome to the Image Detector Game!</p>
        <p>A multiplayer quiz game where users answer questions about images in real-time rounds.</p>
        <Button type="primary" block href="/game" style={{ marginTop: 16 }}>
          Play Game
        </Button>
      </Card>
    </div>
  );
};

export default Home;
