import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';
import RefreshPage from './pages/RefreshPage';
import './index.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/refresh" element={<RefreshPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
