import {Link,useNavigate } from 'react-router-dom';
import '../Styles/Auth.css';
import { useState } from 'react';
import {Signup} from '../Services/auth.js';
export default function SignUp(){

    const navigate = useNavigate();

    const [userData , setUserData] = useState({name:"" , email : "" , password : "" , confirmPassword : ""});
    async function SignUpHandler(e)
    {
        e.preventDefault();
        if(userData.password !== userData.confirmPassword)
        {
            return alert("Password and Confirm Password do not match");
        }
        if(userData.password.length < 8) {
            return alert("Password must be at least 8 characters long");
        }
        if(!/[A-Z]/.test(userData.password) || !/[a-z]/.test(userData.password) || !/[0-9]/.test(userData.password)) {
            return alert("Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }
        try{
            const result = await Signup(userData.name , userData.email , userData.password);
            if (result) {
                alert("Signup successful");
            }
            navigate('/')
        }
        catch(error)
        {
            console.error("Error in signup",error);
            alert(error.message);
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
                    <input type="password" placeholder="Password" required value={userData.password} onChange={handleChange} name='password'/>
                    <input type="password" placeholder="Confirm Password" required value={userData.confirmPassword} onChange={handleChange} name='confirmPassword'/>
                    <button type="submit" className="auth-submit-btn">Sign Up</button>
                </form>
                <div className="auth-footer">
                    <Link to="/">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    )
}   