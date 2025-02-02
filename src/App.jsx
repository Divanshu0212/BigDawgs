import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/welcome';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import GameList from './pages/GameList'
import GameDetails from './pages/GameDetails';
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<GameList />} />
        <Route path="/game/:id" element={<GameDetails />} />
      </Routes>
    </HashRouter>
  );
}

export default App;