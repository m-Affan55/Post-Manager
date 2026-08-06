import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Navbar.css';
import { FiBell, FiX } from 'react-icons/fi';
import { GetNotifications, ReadNotification, DeleteNotification, ReadAllNotifications } from '../Services/notifications.js';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    // Controls the mobile hamburger menu open/close state
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    // Ref for the notification container so we can detect outside clicks
    const notifRef = useRef(null);

    // Close notification dropdown when user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            }
            // Remove from local list so it disappears from the bell immediately
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            setShowNotifications(false);
            if (notif.post_id) {
                navigate('/feed', { state: { highlightPostId: notif.post_id } });
            } else if (notif.message && notif.message.includes('friend request')) {
                navigate('/friends', { state: { tab: 'requests' } });
            } else {
                navigate('/feed');
            }
        } catch (error) {
            console.error("Failed to read notification", error);
        }
    };

    // FEAT-6: Mark all notifications as read
    const handleMarkAllRead = async () => {
        try {
            await ReadAllNotifications();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    // FEAT-8: Delete a single notification
    const handleDeleteNotification = async (e, notifId) => {
        e.stopPropagation(); // Prevent triggering the read+navigate handler
        try {
            await DeleteNotification(notifId);
            setNotifications(prev => prev.filter(n => n.id !== notifId));
        } catch (error) {
            console.error("Failed to delete notification", error);
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
                
                <div className="notification-container" ref={notifRef}>
                    <button className="nav-btn bell-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <FiBell size={20} />
                        {notifications.filter(n => n.is_read === 0).length > 0 && (
                            <span className="notification-badge">{notifications.filter(n => n.is_read === 0).length}</span>
                        )}
                    </button>
                    
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0 }}>Notifications</h3>
                                {/* FEAT-6: Mark All Read button */}
                                {notifications.some(n => n.is_read === 0) && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--primary)',
                                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                        }}
                                    >
                                        Mark All Read
                                    </button>
                                )}
                            </div>
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
                                            <p style={{ flex: 1, margin: 0 }}><strong>{n.sender.name}</strong> {n.message}</p>
                                            {/* FEAT-8: Delete notification button */}
                                            <button
                                                onClick={(e) => handleDeleteNotification(e, n.id)}
                                                title="Dismiss notification"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-muted)', padding: '2px', marginLeft: '8px',
                                                    display: 'flex', alignItems: 'center', flexShrink: 0,
                                                }}
                                            >
                                                <FiX size={14} />
                                            </button>
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
