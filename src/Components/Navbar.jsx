import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    // Controls the mobile hamburger menu open/close state
    const [menuOpen, setMenuOpen] = useState(false);

    if (location.pathname === '/' || location.pathname === '/register') {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('current_user_id');
        navigate('/');
    };

    // Close the mobile menu whenever a nav link is clicked
    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-logo">PostApp</div>

            {/* Hamburger button — only visible on mobile via CSS */}
            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Nav links — stacks vertically on mobile when menuOpen is true */}
            <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                <Link to="/home"    className={`nav-btn ${location.pathname === '/home'    ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
                <Link to="/feed"    className={`nav-btn ${location.pathname === '/feed'    ? 'active' : ''}`} onClick={closeMenu}>Feed</Link>
                <Link to="/friends" className={`nav-btn ${location.pathname === '/friends' ? 'active' : ''}`} onClick={closeMenu}>Friends</Link>
                <button onClick={() => { handleLogout(); closeMenu(); }} className="nav-btn logout-btn">Logout</button>
            </div>
        </nav>
    );
}
