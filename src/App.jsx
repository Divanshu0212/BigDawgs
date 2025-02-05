import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/welcome';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import GameList from './pages/GameList'
import GameDetails from './pages/GameDetails';
import ChatRoom from './pages/ChatRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<GameList />} />
        <Route path="/game/:id" element={<GameDetails />} />
        <Route path="/chat/:roomId" element={<ChatRoom/>} />
      </Routes>
    </Router>
  );
}

export default App;