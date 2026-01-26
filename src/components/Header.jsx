import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header Component with optional back navigation
 */
function Header({ title, icon, showBack = false, backTo = '/' }) {
    return (
        <header className="header">
            {showBack ? (
                <Link to={backTo} className="header__back">
                    <span>←</span>
                    <span>{title}</span>
                </Link>
            ) : (
                <h1 className="header__title">
                    <span className="header__title-icon">{icon}</span>
                    {title}
                </h1>
            )}
        </header>
    );
}

export default Header;
