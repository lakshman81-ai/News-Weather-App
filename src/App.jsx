import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import WeatherPage from './pages/WeatherPage';
import MarketPage from './pages/MarketPage';
import TechSocialPage from './pages/TechSocialPage';
import SettingsPage from './pages/SettingsPage';
import RefreshPage from './pages/RefreshPage';
import BottomNav from './components/BottomNav';
import { WeatherProvider } from './context/WeatherContext';
import { NewsProvider } from './context/NewsContext';
import { MarketProvider } from './context/MarketContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

function App() {
  return (
    <SettingsProvider>
      <WeatherProvider>
        <NewsProvider>
          <MarketProvider>
            <HashRouter>
              <div className="app">
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/weather" element={<WeatherPage />} />
                  <Route path="/markets" element={<MarketPage />} />
                  <Route path="/tech-social" element={<TechSocialPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/refresh" element={<RefreshPage />} />
                </Routes>
                <BottomNav />
              </div>
            </HashRouter>
          </MarketProvider>
        </NewsProvider>
      </WeatherProvider>
    </SettingsProvider>
  );
}

export default App;
