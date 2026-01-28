import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';
import RefreshPage from './pages/RefreshPage';
import './index.css';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/refresh" element={<RefreshPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
