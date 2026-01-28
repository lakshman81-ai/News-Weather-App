import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header Component with optional back navigation
 */
function Header({ title, icon, showBack = false, backTo = '/', children, subtitle }) {
    return (
        <header className="header">
            <div className="header__content">
                {showBack ? (
                    <Link to={backTo} className="header__back">
                        <span>←</span>
                        <span>{title}</span>
                    </Link>
                ) : (
                    <div className="header__title-container">
                        <h1 className="header__title">
                            <span className="header__title-icon">{icon}</span>
                            {title}
                        </h1>
                        {subtitle && <div className="header__subtitle">{subtitle}</div>}
                    </div>
                )}
                <div className="header__actions">
                    {children}
                </div>
            </div>
        </header>
    );
}

export default Header;
