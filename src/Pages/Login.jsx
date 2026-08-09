import {Link} from 'react-router-dom';
import '../Styles/Auth.css';
import { useState } from 'react';
import { loginUser, getUserName } from '../Services/auth.js';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login(){
    const navigate = useNavigate();
    const [user , setUser] = useState({email:"",password:""});
    const [showPassword, setShowPassword] = useState(false);

    async function LoginHandler(e)
    {
        e.preventDefault();
        try {
            const res = await loginUser(user.email, user.password);
            console.log(res);
            if (res) {
                // Fetch and save current user ID immediately so frontend knows who is logged in
                const userData = await getUserName();
                if (userData) {
                    localStorage.setItem("current_user_id", userData.id);
                }
                toast.success('Login successful!');
                window.location.href = "/feed";
            }
        }
        catch(error)
        {
            console.error("Error in Login",error);
            toast.error(error.message);
        }
    }
    
    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form onSubmit={LoginHandler} className="auth-form">
                    <input type="email" placeholder="Email" required name="email" value={user.email} onChange={(e)=>setUser({...user , email : e.target.value})}/>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            name="password"
                            value={user.password}
                            onChange={(e)=>setUser({...user , password : e.target.value})}
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(prev => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <button type="submit" className="auth-submit-btn">Login</button>
                </form>
                <div className="auth-footer">
                    <Link to="/register">Don't have an account? Sign Up</Link>
                </div>
            </div>
        </div>
    )
}   