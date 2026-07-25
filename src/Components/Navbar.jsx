import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Styles/Navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show navbar on login or register pages
    if (location.pathname === '/' || location.pathname === '/register') {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem('token'); // Clear the token
        navigate('/'); // Redirect to login
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">PostApp</div>
            <div className="navbar-links">
                <Link to="/home" className="nav-btn">Home</Link>
                <Link to="/friends" className="nav-btn">Friends</Link>
                <button onClick={handleLogout} className="nav-btn">Logout</button>
            </div>
        </nav>
    );
}
