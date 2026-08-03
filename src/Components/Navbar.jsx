import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Navbar.css';
import { FiBell } from 'react-icons/fi';
import { GetNotifications, ReadNotification, DeleteNotification } from '../Services/notifications.js';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    // Controls the mobile hamburger menu open/close state
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                if (localStorage.getItem('token')) {
                    const data = await GetNotifications();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        if (location.pathname !== '/' && location.pathname !== '/register') {
            fetchNotifications();
            const intervalId = setInterval(fetchNotifications, 10000); // poll every 10 seconds
            return () => clearInterval(intervalId);
        }
    }, [location.pathname]);

    const handleReadNotification = async (notif) => {
        try {
            if (notif.is_read === 0) {
                await ReadNotification(notif.id);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
            }
            setShowNotifications(false);
            if (notif.post_id) {
                navigate(`/post/${notif.post_id}`);
            } else {
                navigate('/feed');
            }
        } catch (error) {
            console.error("Failed to read notification", error);
        }
    };
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
                
                <div className="notification-container">
                    <button className="nav-btn bell-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <FiBell size={20} />
                        {notifications.filter(n => n.is_read === 0).length > 0 && (
                            <span className="notification-badge">{notifications.filter(n => n.is_read === 0).length}</span>
                        )}
                    </button>
                    
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <h3>Notifications</h3>
                            {notifications.length === 0 ? (
                                <p className="no-notifications">No notifications</p>
                            ) : (
                                <div className="notification-list">
                                    {notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            className={`notification-item ${n.is_read === 0 ? 'unread' : 'read'}`}
                                            onClick={() => handleReadNotification(n)}
                                        >
                                            <p><strong>{n.sender.name}</strong> {n.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={() => { handleLogout(); closeMenu(); }} className="nav-btn logout-btn">Logout</button>
            </div>
        </nav>
    );
}
