import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Questions from './pages/Questions';
import AdminPanel from './pages/AdminPanel';
import GameStart from './pages/GameStart';
import WaitingRoom from './pages/WaitingRoom';
import JoinGame from './pages/JoinGame';
import GamePlay from './pages/GamePlay';
import Leaderboard from './pages/Leaderboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/admin/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute>
              <Questions />
            </ProtectedRoute>
          }
        />
        <Route path="/game" element={<GameStart />} />
        <Route path="/game/waiting/:sessionId" element={<WaitingRoom />} />
        <Route path="/game/join/:sessionId" element={<JoinGame />} />
        <Route path="/game/play/:sessionId" element={<GamePlay />} />
        <Route path="/game/leaderboard/:sessionId" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
