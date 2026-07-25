import {Link} from 'react-router-dom';
import '../Styles/Auth.css';

export default function Login(){
    
    function LoginHandler(e)
    {
        e.preventDefault();
        console.log("Login");
    }
    
    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form onSubmit={LoginHandler} className="auth-form">
                    <input type="email" placeholder="Email" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit" className="auth-submit-btn">Login</button>
                </form>
                <div className="auth-footer">
                    <Link to="/register">Don't have an account? Sign Up</Link>
                </div>
            </div>
        </div>
    )
}   