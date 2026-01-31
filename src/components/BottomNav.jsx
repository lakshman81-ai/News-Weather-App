import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Bottom Navigation Component
 * Provides main app navigation for mobile layout
 */
function BottomNav() {
    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/weather', icon: '☁️', label: 'Weather' },
        { path: '/markets', icon: '📈', label: 'Markets' },
        { path: '/settings', icon: '⚙️', label: 'Settings' }
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'active' : ''}`
                    }
                    end={item.path === '/'}
                >
                    <span className="bottom-nav__icon">{item.icon}</span>
                    <span className="bottom-nav__label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;
