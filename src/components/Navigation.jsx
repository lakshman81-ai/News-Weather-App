import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Bottom Navigation Bar
 */
function Navigation() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="nav-bar">
            <Link
                to="/settings"
                className={`nav-btn ${isActive('/settings') ? 'nav-btn--primary' : ''}`}
            >
                <span>⚙️</span>
                <span>Settings</span>
            </Link>
            <Link
                to="/refresh"
                className={`nav-btn ${isActive('/refresh') ? 'nav-btn--primary' : ''}`}
            >
                <span>🔄</span>
                <span>Refresh</span>
            </Link>
        </nav>
    );
}

export default Navigation;
