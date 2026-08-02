import Login from './Pages/Login.jsx'
import Post from './Components/Post.jsx'
import FriendsProvider from './Context/FriendsProvider.jsx';
import Friends from './Pages/Friends.jsx';
import Navbar from './Components/Navbar.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './Pages/SignUp.jsx';
import Feed from './Pages/Feed.jsx';

/**
 * ProtectedRoute — the frontend version of "auth middleware".
 *
 * How it works:
 *  1. We check whether a JWT token exists in localStorage.
 *  2. If YES  → render the actual page (children).
 *  3. If NO   → <Navigate to="/" replace /> immediately redirects to Login.
 *
 * "replace" means the guarded route is NOT added to the browser history,
 * so the user can't press Back to get back to it without logging in.
 */
function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return children;
}

export default function App() {
    return (
        <>
            <BrowserRouter>
                <FriendsProvider>
                    <Navbar />
                    <Routes>
                        {/* Public routes — no token required */}
                        <Route path='/' element={<Login />} />
                        <Route path='/register' element={<SignUp />} />

                        {/* Protected routes — redirect to / if no token */}
                        <Route path='/home' element={
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