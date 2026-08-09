import Login from './Pages/Login.jsx'
import Post from './Components/Post.jsx'
import FriendsProvider from './Context/FriendsProvider.jsx';
import Friends from './Pages/Friends.jsx';
import Navbar from './Components/Navbar.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './Pages/SignUp.jsx';
import Feed from './Pages/Feed.jsx';

import { useState, useEffect } from 'react';
import { getUserName } from './Services/auth.js';
import { Toaster } from 'react-hot-toast';

/**
 * ProtectedRoute — the frontend version of "auth middleware".
 *
 * FEAT-14: In addition to checking token existence, we proactively validate
 * the token on first mount by calling GET /users/me. If the token is expired
 * or invalid, we clear it and redirect to login. The apiFetch 401 interceptor
 * also handles this, but this gives a smoother UX on page load.
 */
function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsValidating(false);
            setIsValid(false);
            return;
        }

        // FEAT-14: Validate the token by hitting the /users/me endpoint
        const validateToken = async () => {
            try {
                const user = await getUserName();
                if (user && user.id) {
                    // Ensure current_user_id is up to date
                    localStorage.setItem("current_user_id", user.id);
                    setIsValid(true);
                } else {
                    // Token returned but no valid user — clear and redirect
                    localStorage.removeItem("token");
                    localStorage.removeItem("current_user_id");
                    setIsValid(false);
                }
            } catch {
                // Token is expired/invalid — apiFetch interceptor will also handle this
                // but we catch here for a clean redirect
                localStorage.removeItem("token");
                localStorage.removeItem("current_user_id");
                setIsValid(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    if (isValidating) {
        // Show nothing while validating (avoid flash of login page)
        return null;
    }

    if (!isValid) {
        return <Navigate to="/" replace />;
    }

    return children;
}

/**
 * FEAT-9: PublicRoute — redirects to /home if user is already logged in.
 * Prevents authenticated users from seeing the login/register forms.
 */
function PublicRoute({ children }) {
    const token = localStorage.getItem("token");
    if (token) {
        return <Navigate to="/feed" replace />;
    }
    return children;
}

export default function App() {
    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <BrowserRouter>
                <FriendsProvider>
                    <Navbar />
                    <Routes>
                        {/* Public routes — redirect to /home if already logged in */}
                        <Route path='/' element={
                            <PublicRoute><Login /></PublicRoute>
                        } />
                        <Route path='/register' element={
                            <PublicRoute><SignUp /></PublicRoute>
                        } />

                        {/* Protected routes — redirect to / if no token or invalid token */}
                        <Route path='/profile' element={
                            <ProtectedRoute><Post /></ProtectedRoute>
                        } />
                        <Route path='/feed' element={
                            <ProtectedRoute><Feed /></ProtectedRoute>
                        } />
                        <Route path='/friends' element={
                            <ProtectedRoute><Friends /></ProtectedRoute>
                        } />

                    </Routes>
                </FriendsProvider>
            </BrowserRouter>
        </>
    );
}