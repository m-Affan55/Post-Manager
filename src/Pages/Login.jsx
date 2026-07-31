import {Link} from 'react-router-dom';
import '../Styles/Auth.css';
import { useState } from 'react';
import { loginUser, getUserName } from '../Services/auth.js';
import { useNavigate } from 'react-router-dom';

export default function Login(){
    const navigate = useNavigate();
    const [user , setUser] = useState({email:"",password:""});
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
                navigate("/home");
            }
        }
        catch(error)
            {
                console.error("Error in Login",error);
            }
    }
    
    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form onSubmit={LoginHandler} className="auth-form">
                    <input type="email" placeholder="Email" required name="email" value={user.email} onChange={(e)=>setUser({...user , email : e.target.value})}/>
                    <input type="password" placeholder="Password" required name="password" value={user.password} onChange={(e)=>setUser({...user , password : e.target.value})}/>
                    <button type="submit" className="auth-submit-btn">Login</button>
                </form>
                <div className="auth-footer">
                    <Link to="/register">Don't have an account? Sign Up</Link>
                </div>
            </div>
        </div>
    )
}   