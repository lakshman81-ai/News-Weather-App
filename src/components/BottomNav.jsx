import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';

function BottomNav() {
    const { isWebView } = useMediaQuery();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Main', icon: '🏠' },
        { path: '/markets', label: 'Market', icon: '📈' },
        { path: '/tech-social', label: 'Tech/Social', icon: '💻' },
        { path: '/weather', label: 'Weather', icon: '☁️' },
        { path: '/settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
        <nav className={`bottom-nav ${isWebView ? 'bottom-nav--desktop' : ''}`}>
            {navItems.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={`bottom-nav__item ${location.pathname === item.path ? 'active' : ''}`}
                >
                    <span className="bottom-nav__icon">{item.icon}</span>
                    <span className="bottom-nav__label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;
