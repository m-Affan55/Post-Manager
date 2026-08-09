import {Link,useNavigate } from 'react-router-dom';
import '../Styles/Auth.css';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Signup } from '../Services/auth.js';
import toast from 'react-hot-toast';

export default function SignUp(){

    const navigate = useNavigate();

    const [userData , setUserData] = useState({name:"" , email : "" , password : "" , confirmPassword : ""});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function SignUpHandler(e)
    {
        e.preventDefault();
        if(userData.password !== userData.confirmPassword)
        {
            return toast.error("Password and Confirm Password do not match");
        }
        if(userData.password.length < 8) {
            return toast.error("Password must be at least 8 characters long");
        }
        if(!/[A-Z]/.test(userData.password) || !/[a-z]/.test(userData.password) || !/[0-9]/.test(userData.password)) {
            return toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }
        try {
            const result = await Signup(userData.name, userData.email, userData.password);
            if (result) {
                toast.success("Signup successful! Please log in.");
                navigate('/'); // ← only navigate on success
            }
        } catch (error) {
            console.error("Error in signup", error);
            toast.error(error.message);
            // navigate('/') is NOT called here — user stays on signup form to retry
        }

        
    }
    const handleChange = (e) => {
        console.log(e.target.name);
        setUserData({...userData , [e.target.name] : e.target.value});
    }
    return(
        <div className="auth-container">
            <div className="auth-card">
                <h1>Sign Up</h1>
                <form onSubmit={SignUpHandler} className="auth-form">
                    <input type="text" placeholder="Name" required value={userData.name} onChange={handleChange} name='name'/>
                    <input type="email" placeholder="Email" required value={userData.email} onChange={handleChange} name='email'/>

                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            value={userData.password}
                            onChange={handleChange}
                            name='password'
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

                    <div className="password-input-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            required
                            value={userData.confirmPassword}
                            onChange={handleChange}
                            name='confirmPassword'
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" className="auth-submit-btn">Sign Up</button>
                </form>
                <div className="auth-footer">
                    <Link to="/">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    )
}   