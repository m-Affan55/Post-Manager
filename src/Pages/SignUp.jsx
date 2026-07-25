import {Link } from 'react-router-dom';
import '../Styles/Auth.css';

export default function SignUp(){

    function SignUpHandler(e)
    {
        e.preventDefault();
        console.log("SignUp");
    }
    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Sign Up</h1>
                <form onSubmit={SignUpHandler} className="auth-form">
                    <input type="text" placeholder="Name" required />
                    <input type="email" placeholder="Email" required />
                    <input type="password" placeholder="Password" required />
                    <input type="password" placeholder="Confirm Password" required />
                    <button type="submit" className="auth-submit-btn">Sign Up</button>
                </form>
                <div className="auth-footer">
                    <Link to="/">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    )
}   