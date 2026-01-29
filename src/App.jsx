import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';
import RefreshPage from './pages/RefreshPage';
import { WeatherProvider } from './context/WeatherContext';
import { NewsProvider } from './context/NewsContext';
import './index.css';

function App() {
  return (
    <WeatherProvider>
      <NewsProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/refresh" element={<RefreshPage />} />
          </Routes>
        </HashRouter>
      </NewsProvider>
    </WeatherProvider>
  );
}

export default App;
