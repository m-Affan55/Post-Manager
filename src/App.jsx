import Login from './Pages/Login.jsx'
import Post from './Components/Post.jsx'
import FriendsProvider from './Context/FriendsProvider.jsx';
import Friends from './Pages/Friends.jsx';
import Navbar from './Components/Navbar.jsx';
import {BrowserRouter , Routes,Route} from 'react-router-dom'
import SignUp from './Pages/SignUp.jsx';
export default function App()
{
  return (
    <>
    <BrowserRouter>
    <FriendsProvider>
    <Navbar />
    <Routes>
    <Route path='/' element= {<Login/>}/>
    <Route path='/register' element= {<SignUp/>}/>
    <Route path='/home' element = {<Post/>}/>
    <Route path='/friends'element={<Friends/>}/>
    </Routes>
    </FriendsProvider>
    </BrowserRouter>
    </>
    
  );
};